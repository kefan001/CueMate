const store = require('../../utils/store');
const { companions, DISCOVERY_TABS, filterAndSortCompanions } = require('../../shared/cuemate-core');

Page({
  data: {
    user: {},
    tabs: DISCOVERY_TABS,
    activeTab: '推荐',
    openSearch: false,
    openFilter: false,
    query: '',
    priceMax: 500,
    sort: 'smart',
    list: [],
  },

  onLoad() {
    this._unsub = store.subscribe(() => this.syncState());
  },

  onShow() {
    if (!store.ensureAuthRedirect()) return;
    const { user } = store.getState();
    if (user.role === 'companion') {
      wx.redirectTo({ url: '/pages/companion-dashboard/index' });
      return;
    }
    this.syncState();
  },

  onUnload() {
    if (this._unsub) this._unsub();
  },

  syncState() {
    const { user } = store.getState();
    const { activeTab, priceMax, query, sort } = this.data;
    const list = filterAndSortCompanions(companions, { activeTab, priceMax, query, sort });
    this.setData({ user, list });
  },

  recomputeList(patch = {}) {
    const next = {
      activeTab: patch.activeTab ?? this.data.activeTab,
      priceMax: patch.priceMax ?? this.data.priceMax,
      query: patch.query ?? this.data.query,
      sort: patch.sort ?? this.data.sort,
    };
    const list = filterAndSortCompanions(companions, next);
    this.setData({ ...patch, list });
  },

  onSelectTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.recomputeList({ activeTab: tab });
  },

  onRequestLocation() {
    store.requestLocation();
  },

  onOpenSearch() {
    this.setData({ openSearch: true });
  },

  onCloseSearch() {
    this.setData({ openSearch: false });
  },

  onOpenFilter() {
    this.setData({ openFilter: true, openSearch: false });
  },

  onCloseFilter() {
    this.setData({ openFilter: false });
  },

  onQueryInput(e) {
    this.recomputeList({ query: e.detail.value });
  },

  onClearQuery() {
    this.recomputeList({ query: '' });
  },

  onPriceChange(e) {
    this.recomputeList({ priceMax: Number(e.detail.value) });
  },

  onSelectSort(e) {
    const sort = e.currentTarget.dataset.sort;
    this.recomputeList({ sort });
  },

  onResetAll() {
    this.recomputeList({
      activeTab: '推荐',
      priceMax: 500,
      sort: 'smart',
    });
  },

  onResetFilter() {
    this.recomputeList({
      priceMax: 500,
      sort: 'smart',
    });
  },

  onTapCompanion(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/companion-detail/index?id=${id}`,
    });
  },
});
