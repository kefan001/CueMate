const store = require('../../utils/store');
const { ORDER_STATUS_TEXT, formatOrderTime } = require('../../shared/cuemate-core');

Page({
  data: {
    scheduleOrders: [],
  },

  onLoad() {
    this._unsub = store.subscribe(() => this.syncData());
  },

  onShow() {
    if (!store.ensureAuthRedirect()) return;
    this.syncData();
  },

  onUnload() {
    if (this._unsub) this._unsub();
  },

  syncData() {
    const { user, orders } = store.getState();
    const myOrders = user.companionId
      ? (orders || [])
          .filter(o => o.companionId === user.companionId && o.status !== 'cancelled')
          .map(o => ({
            ...o,
            statusMeta: ORDER_STATUS_TEXT[o.status] || ORDER_STATUS_TEXT.paid,
            timeText: formatOrderTime(o),
          }))
      : [];
    this.setData({ scheduleOrders: myOrders });
  },
});
