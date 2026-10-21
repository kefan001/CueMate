const store = require('../../utils/store');
const {
  USER_ORDER_TABS,
  ORDER_STATUS_TEXT,
  USER_REVIEW_TAGS,
  formatOrderTime,
  getRefundDescription,
  getOrderVerificationCode,
  filterUserOrders,
} = require('../../shared/cuemate-core');

Page({
  data: {
    tabs: USER_ORDER_TABS,
    activeTab: '全部',
    user: {},
    filteredOrders: [],
    payingOrder: null,
    codeOrder: null,
    cancelOrder: null,
    reviewOrder: null,
    followUpOrder: null,
    disputeOrder: null,
    error: '',
    cancelReason: '临时有事，改天再约',
    disputeReason: '服务和约定不符，希望平台介入处理',
    reviewRating: 5,
    reviewContent: '',
    reviewTagItems: [],
    reviewAnonymous: false,
    followUpContent: '',
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

  buildReviewTagItems(selectedTags = []) {
    return USER_REVIEW_TAGS.map(tag => ({
      tag,
      active: selectedTags.includes(tag),
    }));
  },

  syncData(patch = {}) {
    const { user, orders } = store.getState();
    const activeTab = patch.activeTab ?? this.data.activeTab;
    const rawList = filterUserOrders(orders, activeTab);
    const filteredOrders = rawList.map(order => ({
      ...order,
      statusMeta: ORDER_STATUS_TEXT[order.status] || ORDER_STATUS_TEXT.paid,
      timeText: formatOrderTime(order),
      refundText: getRefundDescription(order),
      codeText: getOrderVerificationCode(order),
      reviewStars: order.customerReview
        ? Array.from({ length: order.customerReview.rating }).map((_, idx) => idx)
        : [],
    }));

    this.setData({
      ...patch,
      user,
      activeTab,
      filteredOrders,
    });
  },

  onSelectTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.syncData({ activeTab: tab });
  },

  findOrder(id) {
    return this.data.filteredOrders.find(o => o.id === id) || store.getState().orders.find(o => o.id === id);
  },

  openChat(e) {
    const id = e.currentTarget.dataset.id;
    const order = this.findOrder(id);
    if (!order) return;
    const { user } = store.getState();
    const threadId = store.ensureThread({
      companionId: order.companionId,
      companionName: order.companionName,
      companionAvatar: order.companionAvatar,
      customerId: order.customerId || user.id,
      customerName: order.customerName || user.name,
      customerAvatar: order.customerAvatar || user.avatar,
      orderId: order.id,
      appointmentDate: order.date,
      appointmentSlots: order.timeSlots,
      venueName: order.venueName,
    });
    wx.navigateTo({ url: `/pages/chat-thread/index?threadId=${threadId}` });
  },

  onOpenPay(e) {
    const order = this.findOrder(e.currentTarget.dataset.id);
    this.setData({ payingOrder: order, error: '' });
  },

  onClosePay() {
    this.setData({ payingOrder: null, error: '' });
  },

  confirmPay() {
    const { payingOrder } = this.data;
    if (!payingOrder) return;
    const result = store.pay(payingOrder.totalPrice);
    if (!result.ok) {
      this.setData({ error: '余额不足，请先到「我的 -> 钱包」充值' });
      return;
    }
    store.updateOrder(payingOrder.id, {
      status: 'paid',
      refundAmount: undefined,
      refundReason: undefined,
    });
    this.setData({ payingOrder: null, error: '' });
    wx.showToast({ title: '支付成功', icon: 'success' });
  },

  onOpenCancel(e) {
    const order = this.findOrder(e.currentTarget.dataset.id);
    const reason = order?.status === 'paid' ? '行程有变，需要取消订单' : '暂时不下单了';
    this.setData({ cancelOrder: order, cancelReason: reason });
  },

  onCloseCancel() {
    this.setData({ cancelOrder: null });
  },

  onInputField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  submitCancellation() {
    const { cancelOrder, cancelReason } = this.data;
    if (!cancelOrder) return;
    const now = new Date().toISOString();
    const patch = {
      cancellationReason: cancelReason.trim(),
      cancelledAt: now,
    };

    if (cancelOrder.status === 'paid') {
      store.charge(cancelOrder.totalPrice);
      patch.status = 'refunded';
      patch.refundAmount = cancelOrder.totalPrice;
      patch.refundReason = cancelReason.trim();
      patch.refundedAt = now;
    } else {
      patch.status = 'cancelled';
    }

    store.updateOrder(cancelOrder.id, patch);
    this.setData({ cancelOrder: null });
  },

  onOpenCode(e) {
    const order = this.findOrder(e.currentTarget.dataset.id);
    if (!order) return;
    this.setData({
      codeOrder: {
        ...order,
        codeText: getOrderVerificationCode(order),
      },
    });
  },

  onCloseCode() {
    this.setData({ codeOrder: null });
  },

  confirmServiceStart() {
    const { codeOrder } = this.data;
    if (!codeOrder) return;
    store.updateOrder(codeOrder.id, {
      status: 'in_progress',
      serviceStartedAt: new Date().toISOString(),
    });
    this.setData({ codeOrder: null });
  },

  markCompanionNoShow(e) {
    const order = this.findOrder(e.currentTarget.dataset.id);
    if (!order) return;
    store.charge(order.totalPrice);
    store.updateOrder(order.id, {
      status: 'no_show_companion',
      noShowMarkedAt: new Date().toISOString(),
      noShowMarkedBy: 'user',
      refundAmount: order.totalPrice,
      refundedAt: new Date().toISOString(),
      refundReason: '陪玩未到店，系统全额退款',
    });
    wx.showToast({ title: '已全额退回钱包', icon: 'none' });
  },

  confirmServiceDone(e) {
    const order = this.findOrder(e.currentTarget.dataset.id);
    if (!order) return;
    store.updateOrder(order.id, {
      status: 'awaiting_confirmation',
      serviceEndedAt: new Date().toISOString(),
    });
  },

  confirmCompletion(e) {
    const order = this.findOrder(e.currentTarget.dataset.id);
    if (!order) return;
    store.updateOrder(order.id, {
      status: 'completed',
      customerConfirmedAt: new Date().toISOString(),
    });
  },

  onOpenDispute(e) {
    const order = this.findOrder(e.currentTarget.dataset.id);
    this.setData({ disputeOrder: order });
  },

  onCloseDispute() {
    this.setData({ disputeOrder: null });
  },

  submitDispute() {
    const { disputeOrder, disputeReason } = this.data;
    if (!disputeOrder) return;
    store.updateOrder(disputeOrder.id, {
      status: 'disputed',
      dispute: {
        reason: disputeReason.trim(),
        createdAt: new Date().toISOString(),
        status: 'open',
      },
    });
    this.setData({ disputeOrder: null });
  },

  onOpenReview(e) {
    const order = this.findOrder(e.currentTarget.dataset.id);
    this._selectedReviewTags = [];
    this.setData({
      reviewOrder: order,
      reviewRating: 5,
      reviewContent: '',
      reviewAnonymous: false,
      reviewTagItems: this.buildReviewTagItems([]),
    });
  },

  onCloseReview() {
    this.setData({ reviewOrder: null });
  },

  onSetReviewRating(e) {
    this.setData({ reviewRating: Number(e.currentTarget.dataset.star) });
  },

  onToggleReviewTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const prev = this._selectedReviewTags || [];
    const next = prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag].slice(0, 4);
    this._selectedReviewTags = next;
    this.setData({ reviewTagItems: this.buildReviewTagItems(next) });
  },

  onToggleAnonymous() {
    this.setData({ reviewAnonymous: !this.data.reviewAnonymous });
  },

  submitReview() {
    const { reviewOrder, reviewRating, reviewContent, reviewAnonymous } = this.data;
    if (!reviewOrder) return;
    store.updateOrder(reviewOrder.id, {
      customerReview: {
        rating: reviewRating,
        content: reviewContent.trim() || '这次服务整体不错，流程顺畅。',
        createdAt: new Date().toISOString(),
        tags: this._selectedReviewTags || [],
        anonymous: reviewAnonymous,
      },
      status: 'completed',
    });
    this.setData({ reviewOrder: null });
    wx.showToast({ title: '评价已发布', icon: 'success' });
  },

  onOpenFollowUp(e) {
    const order = this.findOrder(e.currentTarget.dataset.id);
    this.setData({ followUpOrder: order, followUpContent: '' });
  },

  onCloseFollowUp() {
    this.setData({ followUpOrder: null });
  },

  submitFollowUp() {
    const { followUpOrder, followUpContent } = this.data;
    if (!followUpOrder?.customerReview) return;
    store.updateOrder(followUpOrder.id, {
      customerReview: {
        ...followUpOrder.customerReview,
        followUp: {
          content: followUpContent.trim() || '补充一句：整体体验比预期更顺。',
          createdAt: new Date().toISOString(),
        },
      },
    });
    this.setData({ followUpOrder: null });
  },
});
