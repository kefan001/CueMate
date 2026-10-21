Component({
  properties: {
    open: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: '',
    },
  },
  methods: {
    onClose() {
      this.triggerEvent('close');
    },
    noop() {},
  },
});
