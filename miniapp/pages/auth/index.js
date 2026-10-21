const store = require('../../utils/store');

Page({
  data: {
    mode: 'login',
    loginMethod: 'password',
    name: '',
    phone: '13800138000',
    password: '123456',
    newPassword: '123456',
    code: '',
    error: '',
    hint: '',
    demoCode: '',
    countdown: 0,
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer);
  },

  setMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      mode,
      error: '',
      hint: '',
    });
  },

  setLoginMethod(e) {
    const loginMethod = e.currentTarget.dataset.method;
    this.setData({
      loginMethod,
      error: '',
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value,
    });
  },

  sendCode() {
    if (this.data.countdown > 0) return;
    const { mode, phone } = this.data;
    const purpose = mode === 'register' ? 'register' : mode === 'reset_password' ? 'reset_password' : 'login';
    const result = store.sendVerificationCode({ phone, purpose });

    if (!result.ok) {
      this.setData({ error: result.message || '验证码发送失败' });
      return;
    }

    this.setData({
      error: '',
      hint: result.message || '',
      demoCode: result.demoCode || '',
      countdown: 60,
    });

    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      const next = this.data.countdown - 1;
      if (next <= 0) {
        clearInterval(this._timer);
        this.setData({ countdown: 0 });
      } else {
        this.setData({ countdown: next });
      }
    }, 1000);
  },

  handleSubmit() {
    const { mode, loginMethod, name, phone, password, newPassword, code } = this.data;
    this.setData({ error: '', hint: '' });

    const result =
      mode === 'login'
        ? loginMethod === 'password'
          ? store.login({ phone, password })
          : store.loginWithCode({ phone, code })
        : mode === 'register'
          ? store.register({ name, phone, password, code })
          : store.resetPassword({ phone, code, newPassword });

    if (!result.ok) {
      this.setData({ error: result.message || '操作失败，请稍后重试' });
      return;
    }

    if (mode === 'reset_password') {
      this.setData({
        mode: 'login',
        loginMethod: 'password',
        password: newPassword,
        hint: result.message || '密码已重置，请重新登录',
      });
      return;
    }

    const { user } = store.getState();
    wx.redirectTo({
      url: user.role === 'companion' ? '/pages/companion-dashboard/index' : '/pages/discovery/index',
    });
  },
});
