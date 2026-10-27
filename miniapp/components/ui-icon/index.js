const { getIconDataUri } = require('./icons');

Component({
  properties: {
    name: {
      type: String,
      value: 'info',
    },
    size: {
      type: Number,
      value: 32,
    },
    color: {
      type: String,
      value: '#a1a1aa',
    },
  },
  data: {
    src: '',
  },
  observers: {
    'name, color': function (name, color) {
      this.setData({
        src: getIconDataUri(name, color),
      });
    },
  },
  lifetimes: {
    attached() {
      this.setData({
        src: getIconDataUri(this.data.name, this.data.color),
      });
    },
  },
});
