const store = require('./utils/store');

App({
  globalData: {
    store,
  },
  onLaunch() {
    store.init();
  },
});
