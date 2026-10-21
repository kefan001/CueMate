const store = require('../../utils/store');
const {
  companions,
  getCompanionReviews,
  getUserReviews,
  getReviewSummary,
} = require('../../shared/cuemate-core');

Page({
  data: {
    user: {},
    balanceFixed: '0.00',
    companions,
    openWallet: false,
    openRole: false,
    openEdit: false,
    profileName: '',
    profileBio: '',
    profileGender: 'other',
    profileHint: '',
    reviewTitle: '陪玩给你的评价',
    reviewHint: '守时、沟通与现场配合度',
    reviewSummary: { count: 0, average: 0, positiveRate: 0, topTags: [] },
    receivedReviews: [],
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
    const rawReviews =
      user.role === 'companion' && user.companionId
        ? getCompanionReviews(orders, user.companionId)
        : getUserReviews(orders, user.id);

    const reviewSummary = getReviewSummary(rawReviews);
    const receivedReviews = rawReviews.slice(0, 2).map(r => ({
      ...r,
      stars: Array.from({ length: r.rating }).map((_, idx) => idx),
    }));

    this.setData({
      user,
      balanceFixed: Number(user.balance || 0).toFixed(2),
      reviewTitle: user.role === 'companion' ? '用户给你的评价' : '陪玩给你的评价',
      reviewHint: user.role === 'companion' ? '服务专业度、沟通与到店体验' : '守时、沟通与现场配合度',
      reviewSummary: {
        ...reviewSummary,
        topTags: (reviewSummary.topTags || []).slice(0, 4),
      },
      receivedReviews,
    });
  },

  onOpenWallet() {
    this.setData({ openWallet: true });
  },

  onCloseWallet() {
    this.setData({ openWallet: false });
  },

  onCharge(e) {
    const amount = Number(e.currentTarget.dataset.amount);
    store.charge(amount);
    wx.showToast({ title: `已充值 ¥${amount}`, icon: 'success' });
  },

  onRequestLocation() {
    store.requestLocation();
  },

  onOpenEdit() {
    const { user } = this.data;
    this.setData({
      profileName: user.name || '',
      profileBio: user.bio || '',
      profileGender: user.gender || 'other',
      profileHint: '',
      openEdit: true,
    });
  },

  onCloseEdit() {
    this.setData({ openEdit: false });
  },

  onInputField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  onSelectGender(e) {
    this.setData({ profileGender: e.currentTarget.dataset.gender });
  },

  onSaveProfile() {
    const { profileName, profileBio, profileGender } = this.data;
    const result = store.updateProfile({
      name: profileName,
      bio: profileBio,
      gender: profileGender,
    });
    this.setData({ profileHint: result.message || '' });
    if (result.ok) {
      setTimeout(() => {
        this.setData({ openEdit: false });
      }, 400);
    }
  },

  onOpenRole() {
    this.setData({ openRole: true });
  },

  onCloseRole() {
    this.setData({ openRole: false });
  },

  onSwitchToUser() {
    store.setRole('user');
    this.setData({ openRole: false });
    wx.showToast({ title: '已切换为用户端', icon: 'none' });
  },

  onSwitchToCompanion(e) {
    const id = e.currentTarget.dataset.id;
    const comp = companions.find(c => c.id === id);
    if (!comp) return;
    store.setRole('companion', {
      companionId: comp.id,
      id: `comp_${comp.id}`,
      name: comp.name,
      avatar: comp.avatar,
    });
    this.setData({ openRole: false });
    wx.showToast({ title: `已切换：${comp.name}`, icon: 'none' });
  },

  onMenuTip(e) {
    const title = e.currentTarget.dataset.tip || '演示功能已就绪';
    wx.showToast({ title, icon: 'none' });
  },

  onLogout() {
    store.logout();
    wx.redirectTo({ url: '/pages/auth/index' });
  },

  onResetData() {
    store.resetUser();
    wx.showToast({ title: '演示数据已重置', icon: 'success' });
  },
});
