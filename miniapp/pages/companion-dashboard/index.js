const store = require('../../utils/store');
const { companions, ORDER_STATUS_TEXT, formatOrderTime } = require('../../shared/cuemate-core');

Page({
  data: {
    me: null,
    todayCount: 0,
    incomingCount: 0,
    activeCount: 0,
    completedCount: 0,
    incomingOrders: [],
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
    const me = companions.find(c => c.id === user.companionId) || null;
    const myOrders = user.companionId ? (orders || []).filter(o => o.companionId === user.companionId) : [];

    const incoming = myOrders
      .filter(o => o.status === 'paid')
      .map(o => ({
        ...o,
        statusMeta: ORDER_STATUS_TEXT[o.status] || ORDER_STATUS_TEXT.paid,
        timeText: formatOrderTime(o),
      }));
    const inProgress = myOrders.filter(o => o.status === 'in_progress');
    const awaitingConfirmation = myOrders.filter(o => o.status === 'awaiting_confirmation');
    const completed = myOrders.filter(o => o.status === 'completed');

    this.setData({
      me,
      todayCount: incoming.length + inProgress.length + awaitingConfirmation.length,
      incomingCount: incoming.length,
      activeCount: inProgress.length + awaitingConfirmation.length,
      completedCount: completed.length,
      incomingOrders: incoming,
    });
  },

  openChat(e) {
    const id = e.currentTarget.dataset.id;
    const order = this.data.incomingOrders.find(o => o.id === id);
    if (!order) return;
    const threadId = store.ensureThread({
      companionId: order.companionId,
      companionName: order.companionName,
      companionAvatar: order.companionAvatar,
      customerId: order.customerId || 'u_123',
      customerName: order.customerName || '台球爱好者_007',
      customerAvatar: order.customerAvatar || 'https://picsum.photos/seed/user/200/200',
      orderId: order.id,
      appointmentDate: order.date,
      appointmentSlots: order.timeSlots,
      venueName: order.venueName,
    });
    wx.navigateTo({ url: `/pages/chat-thread/index?threadId=${threadId}` });
  },

  startService(e) {
    const id = e.currentTarget.dataset.id;
    store.updateOrder(id, {
      status: 'in_progress',
      serviceStartedAt: new Date().toISOString(),
    });
    wx.showToast({ title: '已开始服务', icon: 'success' });
  },

  goCompanionOrders() {
    wx.redirectTo({ url: '/pages/companion-orders/index' });
  },
});
