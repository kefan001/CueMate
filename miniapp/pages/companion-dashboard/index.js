const store = require('../../utils/store');
const api = require('../../utils/api');
const { companions, ORDER_STATUS_TEXT, formatOrderTime } = require('../../shared/cuemate-core');

Page({
  data: {
    me: null,
    todayCount: 0,
    incomingCount: 0,
    activeCount: 0,
    completedCount: 0,
    totalEarned: '0.00',
    withdrawnTotal: '0.00',
    withdrawableAmount: '0.00',
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
    const { user, orders, companions: storeComps, withdrawals } = store.getState();
    const list = storeComps && storeComps.length ? storeComps : companions;
    const me = list.find(c => c.id === user.companionId) || null;
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

    const rawEarned = completed.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
    const myWithdrawals = (withdrawals || []).filter(w => w.companionId === user.companionId);
    const rawWithdrawn = myWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
    const rawAvailable = Math.max(0, rawEarned - rawWithdrawn);

    this.setData({
      me,
      todayCount: incoming.length + inProgress.length + awaitingConfirmation.length,
      incomingCount: incoming.length,
      activeCount: inProgress.length + awaitingConfirmation.length,
      completedCount: completed.length,
      totalEarned: rawEarned.toFixed(2),
      withdrawnTotal: rawWithdrawn.toFixed(2),
      withdrawableAmount: rawAvailable.toFixed(2),
      incomingOrders: incoming,
    });
  },

  onToggleOnline() {
    const { me } = this.data;
    if (!me) return;
    store.toggleCompanionOnlineStatus(me.id);
    wx.showToast({
      title: me.onlineStatus === 'resting' ? '已恢复在线接单' : '已切换为休息状态',
      icon: 'none',
    });
  },

  onWithdraw() {
    const { me, withdrawableAmount } = this.data;
    const num = Number(withdrawableAmount);
    if (!me || num <= 0) {
      wx.showToast({ title: '暂无可提现余额', icon: 'none' });
      return;
    }
    store
      .withdrawCompanionEarnings({
        companionId: me.id,
        amount: num,
        channel: '微信零钱（商家转账）',
      })
      .then(res => {
        if (res && res.ok) {
          wx.showToast({ title: `已提现 ¥${num.toFixed(2)} 到微信零钱`, icon: 'success' });
        }
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
    api.requestSubscribe('service_started');
    wx.showToast({ title: '已开始服务', icon: 'success' });
  },

  goCompanionOrders() {
    wx.redirectTo({ url: '/pages/companion-orders/index' });
  },
});
