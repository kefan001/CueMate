const store = require('../../utils/store');

Component({
  properties: {
    active: {
      type: String,
      value: 'discovery',
    },
  },
  data: {
    role: 'user',
  },
  lifetimes: {
    attached() {
      const { user } = store.getState();
      this.setData({ role: user.role });
      this._unsub = store.subscribe(nextState => {
        if (nextState.user.role !== this.data.role) {
          this.setData({ role: nextState.user.role });
        }
      });
    },
    detached() {
      if (this._unsub) this._unsub();
    },
  },
  methods: {
    onNavigate(e) {
      const target = e.currentTarget.dataset.url;
      const key = e.currentTarget.dataset.key;
      if (!target || key === this.properties.active) return;
      wx.redirectTo({ url: target });
    },
  },
});
