const store = require('../../utils/store');
const api = require('../../utils/api');
const {
  ORDER_STATUS_TEXT,
  formatOrderTime,
  getSevenDayDates,
  getLockedSlotsForCompanion,
} = require('../../shared/cuemate-core');

const BASE_TIMES = ['14:00', '15:00', '16:00', '19:00', '20:00', '21:00'];

Page({
  data: {
    dates: [],
    selectedDate: 0,
    daySlots: [],
    scheduleOrders: [],
  },

  onLoad() {
    this._dates = getSevenDayDates();
    this._unsub = store.subscribe(() => this.syncData());
  },

  onShow() {
    if (!store.ensureAuthRedirect()) return;
    this.syncData();
  },

  onUnload() {
    if (this._unsub) this._unsub();
  },

  syncData(patch = {}) {
    const { user, orders } = store.getState();
    const compId = user.companionId || 'c1';
    const selectedDate = patch.selectedDate ?? this.data.selectedDate;
    const dates = this._dates || getSevenDayDates();
    const dateStr = dates[selectedDate]?.fullDateStr || '';

    const lockedSet = getLockedSlotsForCompanion(orders, compId, dateStr);
    const daySlots = BASE_TIMES.map(time => {
      const locked = lockedSet.has(time);
      const disabled = store.isSlotDisabledByCompanion(compId, dateStr, time);
      return {
        time,
        locked,
        open: !locked && !disabled,
      };
    });

    const myOrders = user.companionId
      ? (orders || [])
          .filter(o => o.companionId === user.companionId && o.status !== 'cancelled')
          .map(o => ({
            ...o,
            statusMeta: ORDER_STATUS_TEXT[o.status] || ORDER_STATUS_TEXT.paid,
            timeText: formatOrderTime(o),
          }))
      : [];

    this.setData({
      dates,
      selectedDate,
      daySlots,
      scheduleOrders: myOrders,
    });
  },

  onSelectDate(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.syncData({ selectedDate: index });
  },

  onToggleSlot(e) {
    const { time, locked } = e.currentTarget.dataset;
    if (locked) {
      wx.showToast({ title: '该时段已有预约，不可关闭', icon: 'none' });
      return;
    }
    const { user } = store.getState();
    const compId = user.companionId || 'c1';
    const dateStr = this.data.dates[this.data.selectedDate]?.fullDateStr || '';
    const isOpen = store.toggleCompanionSlot(compId, dateStr, time);
    wx.showToast({
      title: isOpen ? `${time} 已开放预约` : `${time} 已设为休息`,
      icon: 'none',
    });
    this.syncData();
  },

  onOpenVenueMap(e) {
    const { venue, address } = e.currentTarget.dataset;
    api.openVenueLocation(venue, address);
  },
});
