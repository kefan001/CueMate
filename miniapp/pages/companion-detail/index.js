const store = require('../../utils/store');
const {
  companions,
  generateMockSchedule,
  getSevenDayDates,
  getCompanionReviews,
  getReviewSummary,
  filterReviews,
  formatShortDate,
} = require('../../shared/cuemate-core');

Page({
  data: {
    companion: null,
    schedule: [],
    dates: [],
    selectedDate: 0,
    currentDaySlots: [],
    selectedSlots: [],
    totalPrice: 0,
    isBooking: false,
    reviewFilter: 'all',
    reviewSummary: { count: 0, average: 0, positiveRate: 0, distribution: [], topTags: [] },
    visibleReviews: [],
  },

  onLoad(options) {
    const id = options?.id || 'c1';
    this._companionId = id;
    const schedule = generateMockSchedule();
    const dates = getSevenDayDates();
    this._schedule = schedule;
    this._dates = dates;
    this._unsub = store.subscribe(() => this.syncData());
    this.syncData();
  },

  onUnload() {
    if (this._unsub) this._unsub();
  },

  syncData(patch = {}) {
    const companion = companions.find(c => c.id === this._companionId) || companions[0];
    const { orders } = store.getState();
    const selectedDate = patch.selectedDate ?? this.data.selectedDate;
    const selectedSlots = patch.selectedSlots ?? this.data.selectedSlots;
    const reviewFilter = patch.reviewFilter ?? this.data.reviewFilter;

    const rawSlots = (this._schedule[selectedDate]?.slots || []).map(slot => ({
      ...slot,
      selected: selectedSlots.includes(slot.time),
    }));

    const reviewList = getCompanionReviews(orders, companion.id).map(r => ({
      ...r,
      dateText: formatShortDate(r.createdAt),
      stars: Array.from({ length: r.rating }).map((_, idx) => idx),
    }));
    const rawSummary = getReviewSummary(reviewList);
    const reviewSummary = {
      ...rawSummary,
      distribution: rawSummary.distribution.map(item => ({
        ...item,
        percent: rawSummary.count ? Math.round((item.count / rawSummary.count) * 100) : 0,
      })),
    };
    const visibleReviews = filterReviews(reviewList, reviewFilter).slice(0, 5);

    this.setData({
      companion,
      dates: this._dates,
      selectedDate,
      selectedSlots,
      currentDaySlots: rawSlots,
      totalPrice: selectedSlots.length * companion.hourlyRate,
      reviewFilter,
      reviewSummary,
      visibleReviews,
    });
  },

  onSelectDate(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.syncData({ selectedDate: index, selectedSlots: [] });
  },

  onToggleSlot(e) {
    const { time, available } = e.currentTarget.dataset;
    if (!available) return;
    const prev = this.data.selectedSlots;
    const next = prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time];
    this.syncData({ selectedSlots: next });
  },

  onSelectReviewFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.syncData({ reviewFilter: filter });
  },

  handleOpenChat() {
    const { companion, dates, selectedDate, selectedSlots } = this.data;
    if (!companion) return;
    const { user } = store.getState();
    const threadId = store.ensureThread({
      companionId: companion.id,
      companionName: companion.name,
      companionAvatar: companion.avatar,
      customerId: user.id,
      customerName: user.name,
      customerAvatar: user.avatar,
      appointmentDate: dates[selectedDate]?.fullDateStr,
      appointmentSlots: selectedSlots.length ? selectedSlots : undefined,
      venueName: 'CueMate 台球俱乐部（望京店）',
    });
    wx.navigateTo({
      url: `/pages/chat-thread/index?threadId=${threadId}`,
    });
  },

  handleBook() {
    const { companion, dates, selectedDate, selectedSlots, totalPrice, isBooking } = this.data;
    if (!companion || selectedSlots.length === 0 || isBooking) return;
    const { user } = store.getState();
    const selectedDateInfo = dates[selectedDate];
    const orderId = `ord_${Date.now()}`;

    store.addOrder({
      id: orderId,
      companionId: companion.id,
      companionName: companion.name,
      companionAvatar: companion.avatar,
      customerId: user.id,
      customerName: user.name,
      customerAvatar: user.avatar,
      venueName: 'CueMate 台球俱乐部（望京店）',
      venueAddress: '北京市朝阳区望京SOHO 3号楼',
      note: '希望多给一些走位与发力建议。',
      createdAt: new Date().toISOString(),
      date: selectedDateInfo.fullDateStr,
      timeSlots: selectedSlots.slice().sort(),
      totalPrice,
      status: 'pending_payment',
    });

    this.setData({ isBooking: true });
    wx.showToast({ title: '预约成功', icon: 'success' });
    setTimeout(() => {
      this.setData({ isBooking: false });
      wx.redirectTo({ url: '/pages/orders/index' });
    }, 900);
  },
});
