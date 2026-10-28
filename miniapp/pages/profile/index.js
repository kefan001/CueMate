const store = require('../../utils/store');
const api = require('../../utils/api');
const {
  companions,
  getCompanionReviews,
  getUserReviews,
  getReviewSummary,
  COMPLIANCE_DOCS,
} = require('../../shared/cuemate-core');

Page({
  data: {
    user: {},
    balanceFixed: '0.00',
    companions,
    openWallet: false,
    openRole: false,
    openEdit: false,
    openApply: false,
    openPrivacyDoc: false,
    privacyDoc: COMPLIANCE_DOCS.privacy,
    profileName: '',
    profileBio: '',
    profileGender: 'other',
    profileAvatar: '',
    profileHint: '',
    applyName: '',
    applyLevel: '中式八球认证助教',
    applyRate: '168',
    applyVenue: 'CueMate 台球俱乐部（望京店）',
    applyBio: '擅长中式八球基本功纠错与实战走位讲解，性格耐心开朗。',
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
    const { user, orders, companions: storeComps } = store.getState();
    const list = storeComps && storeComps.length ? storeComps : companions;
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
      companions: list,
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
    store
      .requestWeChatPay({
        orderId: `recharge_${Date.now()}`,
        amount,
        title: 'CueMate 钱包余额充值',
      })
      .then(res => {
        if (res && res.ok) {
          store.charge(amount);
          wx.showToast({ title: `已充值 ¥${amount}`, icon: 'success' });
        }
      });
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
      profileAvatar: user.avatar || '',
      profileHint: '',
      openEdit: true,
    });
  },

  onCloseEdit() {
    this.setData({ openEdit: false });
  },

  onChooseWxAvatar(e) {
    const avatarUrl = e.detail?.avatarUrl;
    if (!avatarUrl) return;
    api.uploadMedia(avatarUrl).then(uploaded => {
      this.setData({
        profileAvatar: uploaded.url || avatarUrl,
      });
    });
  },

  onInputField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  onSelectGender(e) {
    this.setData({ profileGender: e.currentTarget.dataset.gender });
  },

  onSaveProfile() {
    const { profileName, profileBio, profileGender, profileAvatar } = this.data;
    const result = store.updateProfile({
      name: profileName,
      bio: profileBio,
      gender: profileGender,
      avatar: profileAvatar,
    });
    this.setData({ profileHint: result.message || '' });
    if (result.ok) {
      setTimeout(() => {
        this.setData({ openEdit: false });
      }, 400);
    }
  },

  onOpenApply() {
    const { user } = this.data;
    this.setData({
      applyName: user.name ? `${user.name} (认证助教)` : '台球助教',
      openApply: true,
    });
  },

  onCloseApply() {
    this.setData({ openApply: false });
  },

  onSubmitApply() {
    const { applyName, applyLevel, applyRate, applyVenue, applyBio, user } = this.data;
    store
      .submitCompanionApplication({
        name: applyName,
        level: applyLevel,
        hourlyRate: Number(applyRate) || 168,
        venueName: applyVenue,
        bio: applyBio,
        avatar: user.avatar,
      })
      .then(res => {
        if (!res || !res.ok) {
          wx.showToast({ title: (res && res.message) || '提交失败', icon: 'none' });
          return;
        }
        const comp = res.companion;
        store.setRole('companion', {
          companionId: comp.id,
          id: `comp_${comp.id}`,
          name: comp.name,
          avatar: comp.avatar,
        });
        this.setData({ openApply: false });
        wx.showToast({ title: '认证已通过，已进入接单台', icon: 'success' });
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/companion-dashboard/index' });
        }, 700);
      });
  },

  onOpenPrivacyDoc() {
    this.setData({ openPrivacyDoc: true });
  },

  onClosePrivacyDoc() {
    this.setData({ openPrivacyDoc: false });
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
    const comp = this.data.companions.find(c => c.id === id);
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
    const title = e.currentTarget.dataset.tip || '功能已就绪';
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
