const store = require('../../utils/store');
const { COMPLIANCE_DOCS } = require('../../shared/cuemate-core');

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
    agreed: true,
    activeDoc: null,
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer);
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed, error: '' });
  },

  openDoc(e) {
    const key = e.currentTarget.dataset.doc;
    const doc = COMPLIANCE_DOCS[key];
    if (doc) {
      this.setData({ activeDoc: doc });
    }
  },

  closeDoc() {
    this.setData({ activeDoc: null });
  },

  confirmDoc() {
    store.agreePrivacy();
    this.setData({ agreed: true, activeDoc: null, error: '' });
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

  onWxGetPhone(e) {
    if (!this.data.agreed) {
      this.setData({ error: '请先阅读并勾选同意用户服务协议与隐私指引' });
      return;
    }
    const detail = (e && e.detail) || {};
    if (detail.code) {
      this._doWxLogin(detail.code);
    }
  },

  onWxQuickLogin() {
    if (!this.data.agreed) {
      this.setData({ error: '请先阅读并勾选同意用户服务协议与隐私指引' });
      return;
    }
    this._doWxLogin();
  },

  _doWxLogin() {
    if (this._wxLoggingIn) return;
    this._wxLoggingIn = true;
    store.agreePrivacy();
    store.wxQuickLogin({ phone: this.data.phone || '13800138000' }).then(res => {
      this._wxLoggingIn = false;
      if (res && res.ok) {
        wx.showToast({ title: '微信授权登录成功', icon: 'none' });
        const { user } = store.getState();
        wx.redirectTo({
          url: user.role === 'companion' ? '/pages/companion-dashboard/index' : '/pages/discovery/index',
        });
      }
    });
  },

  handleSubmit() {
    const { mode, loginMethod, name, phone, password, newPassword, code, agreed } = this.data;
    if (!agreed) {
      this.setData({ error: '请先阅读并勾选同意用户服务协议与隐私指引' });
      return;
    }
    store.agreePrivacy();
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
