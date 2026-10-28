const store = require('../../utils/store');
const api = require('../../utils/api');
const {
  companions,
  generateMockSchedule,
  getSevenDayDates,
  getCompanionReviews,
  getReviewSummary,
  filterReviews,
  formatShortDate,
  getLockedSlotsForCompanion,
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
    bookingNote: '',
    isBooking: false,
    reviewFilter: 'all',
    reviewSummary: { count: 0, average: 0, positiveRate: 0, distribution: [], topTags: [] },
    visibleReviews: [],
  },

  onLoad(options) {
    const id = options?.id || 'c1';
    this._companionId = id;
    const schedule = generateMockSchedule(true);
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
    const { orders, companions: storeCompanions } = store.getState();
    const list = storeCompanions && storeCompanions.length ? storeCompanions : companions;
    const companion = list.find(c => c.id === this._companionId) || list[0];
    const selectedDate = patch.selectedDate ?? this.data.selectedDate;
    const selectedSlots = patch.selectedSlots ?? this.data.selectedSlots;
    const reviewFilter = patch.reviewFilter ?? this.data.reviewFilter;
    const dateStr = this._dates[selectedDate]?.fullDateStr || '';

    const lockedSet = getLockedSlotsForCompanion(orders, companion.id, dateStr);
    const isResting = companion.onlineStatus === 'resting';

    const rawSlots = (this._schedule[selectedDate]?.slots || []).map(slot => {
      const isBooked = lockedSet.has(slot.time);
      const isClosedByComp = store.isSlotDisabledByCompanion(companion.id, dateStr, slot.time);
      const available = !isResting && !isBooked && !isClosedByComp && slot.available;
      return {
        ...slot,
        available,
        lockLabel: isBooked ? '已约满' : isResting || isClosedByComp ? '休息' : '已满',
        selected: available && selectedSlots.includes(slot.time),
      };
    });

    const validSelected = selectedSlots.filter(t => rawSlots.some(s => s.time === t && s.available));

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
      selectedSlots: validSelected,
      currentDaySlots: rawSlots,
      totalPrice: validSelected.length * companion.hourlyRate,
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

  onNoteInput(e) {
    this.setData({ bookingNote: e.detail.value });
  },

  onSelectReviewFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.syncData({ reviewFilter: filter });
  },

  onOpenVenueMap() {
    const { companion } = this.data;
    if (!companion) return;
    api.openVenueLocation(
      companion.venueName || 'CueMate 台球俱乐部（望京店）',
      companion.venueAddress || '北京市朝阳区望京SOHO 3号楼'
    );
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
      venueName: companion.venueName || 'CueMate 台球俱乐部（望京店）',
    });
    wx.navigateTo({
      url: `/pages/chat-thread/index?threadId=${threadId}`,
    });
  },

  handleBook() {
    const { companion, dates, selectedDate, selectedSlots, totalPrice, bookingNote, isBooking } = this.data;
    if (!companion || selectedSlots.length === 0 || isBooking) return;
    const { user } = store.getState();
    const selectedDateInfo = dates[selectedDate];
    const orderId = `ord_${Date.now()}`;

    const res = store.addOrder({
      id: orderId,
      companionId: companion.id,
      companionName: companion.name,
      companionAvatar: companion.avatar,
      customerId: user.id,
      customerName: user.name,
      customerAvatar: user.avatar,
      venueName: companion.venueName || 'CueMate 台球俱乐部（望京店）',
      venueAddress: companion.venueAddress || '北京市朝阳区望京SOHO 3号楼',
      note: bookingNote.trim() || '希望多给一些走位与发力建议。',
      createdAt: new Date().toISOString(),
      date: selectedDateInfo.fullDateStr,
      timeSlots: selectedSlots.slice().sort(),
      totalPrice,
      status: 'pending_payment',
    });

    if (!res.ok) {
      wx.showToast({ title: res.message || '预约失败', icon: 'none' });
      this.syncData();
      return;
    }

    this.setData({ isBooking: true });
    store
      .requestWeChatPay({
        orderId,
        amount: totalPrice,
        title: `预约 ${companion.name} (${selectedDateInfo.fullDateStr})`,
      })
      .then(payRes => {
        if (payRes && payRes.ok) {
          store.updateOrder(orderId, { status: 'paid' });
          wx.showToast({ title: '支付成功，待服务', icon: 'success' });
        } else {
          wx.showToast({ title: '订单已生成，请尽快支付', icon: 'none' });
        }
        setTimeout(() => {
          this.setData({ isBooking: false });
          wx.redirectTo({ url: '/pages/orders/index' });
        }, 700);
      });
  },
});
