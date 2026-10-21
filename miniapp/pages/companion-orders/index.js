const store = require('../../utils/store');
const {
  COMPANION_ORDER_TABS,
  ORDER_STATUS_TEXT,
  COMPANION_REVIEW_TAGS,
  formatOrderTime,
  filterCompanionOrders,
} = require('../../shared/cuemate-core');

Page({
  data: {
    tabs: COMPANION_ORDER_TABS,
    activeTab: '全部',
    filtered: [],
    noShowOrder: null,
    disputeOrder: null,
    reviewOrder: null,
    followUpOrder: null,
    disputeReason: '用户现场情况和下单说明不一致，希望平台介入。',
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
    return COMPANION_REVIEW_TAGS.map(tag => ({
      tag,
      active: selectedTags.includes(tag),
    }));
  },

  syncData(patch = {}) {
    const { user, orders } = store.getState();
    const activeTab = patch.activeTab ?? this.data.activeTab;
    const raw = filterCompanionOrders(orders, user.companionId, activeTab);
    const filtered = raw.map(order => ({
      ...order,
      statusMeta: ORDER_STATUS_TEXT[order.status] || ORDER_STATUS_TEXT.paid,
      timeText: formatOrderTime(order),
      customerStars: order.customerReview
        ? Array.from({ length: order.customerReview.rating }).map((_, idx) => idx)
        : [],
      companionStars: order.companionReview
        ? Array.from({ length: order.companionReview.rating }).map((_, idx) => idx)
        : [],
    }));

    this.setData({ ...patch, activeTab, filtered });
  },

  onSelectTab(e) {
    this.syncData({ activeTab: e.currentTarget.dataset.tab });
  },

  findOrder(id) {
    return this.data.filtered.find(o => o.id === id) || store.getState().orders.find(o => o.id === id);
  },

  onInputField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  startService(e) {
    const id = e.currentTarget.dataset.id;
    store.updateOrder(id, {
      status: 'in_progress',
      serviceStartedAt: new Date().toISOString(),
    });
  },

  finishService(e) {
    const id = e.currentTarget.dataset.id;
    store.updateOrder(id, {
      status: 'awaiting_confirmation',
      serviceEndedAt: new Date().toISOString(),
    });
  },

  onOpenNoShow(e) {
    this.setData({ noShowOrder: this.findOrder(e.currentTarget.dataset.id) });
  },

  onCloseNoShow() {
    this.setData({ noShowOrder: null });
  },

  confirmNoShow() {
    const { noShowOrder } = this.data;
    if (!noShowOrder) return;
    store.updateOrder(noShowOrder.id, {
      status: 'no_show_user',
      noShowMarkedAt: new Date().toISOString(),
      noShowMarkedBy: 'companion',
    });
    this.setData({ noShowOrder: null });
  },

  onOpenDispute(e) {
    this.setData({ disputeOrder: this.findOrder(e.currentTarget.dataset.id) });
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
    this._selectedTags = [];
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
    const prev = this._selectedTags || [];
    const next = prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag].slice(0, 4);
    this._selectedTags = next;
    this.setData({ reviewTagItems: this.buildReviewTagItems(next) });
  },

  onToggleAnonymous() {
    this.setData({ reviewAnonymous: !this.data.reviewAnonymous });
  },

  submitReview() {
    const { reviewOrder, reviewRating, reviewContent, reviewAnonymous } = this.data;
    if (!reviewOrder) return;
    store.updateOrder(reviewOrder.id, {
      companionReview: {
        rating: reviewRating,
        content: reviewContent.trim() || '沟通顺畅，准时到店，整体配合度不错。',
        createdAt: new Date().toISOString(),
        tags: this._selectedTags || [],
        anonymous: reviewAnonymous,
      },
    });
    this.setData({ reviewOrder: null });
    wx.showToast({ title: '评价已提交', icon: 'success' });
  },

  onOpenFollowUp(e) {
    this.setData({
      followUpOrder: this.findOrder(e.currentTarget.dataset.id),
      followUpContent: '',
    });
  },

  onCloseFollowUp() {
    this.setData({ followUpOrder: null });
  },

  submitFollowUp() {
    const { followUpOrder, followUpContent } = this.data;
    if (!followUpOrder?.companionReview) return;
    store.updateOrder(followUpOrder.id, {
      companionReview: {
        ...followUpOrder.companionReview,
        followUp: {
          content: followUpContent.trim() || '补充说明：现场整体节奏很顺，值得再次匹配。',
          createdAt: new Date().toISOString(),
        },
      },
    });
    this.setData({ followUpOrder: null });
  },
});
