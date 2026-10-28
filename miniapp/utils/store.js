const core = require('../shared/cuemate-core');
const { readJson, writeJson } = require('./storage');
const api = require('./api');

const {
  STORAGE_KEYS,
  companions: defaultCompanions,
  mockUser,
  mockOrders,
  mockChatThreads,
  normalizeOrder,
  createAvatar,
  createDefaultAccount,
  ensureAccounts,
  inferLocationLabel,
  isValidPhone,
  generateCode,
  verifyCodeSession,
  createThreadId,
  createMessageId,
  upsertThread,
  updateThread,
  replyTextFor,
  getLockedSlotsForCompanion,
  checkContentSecurity,
} = core;

const EXTRA_KEYS = {
  COMPANIONS: 'cuemate.companions.v1',
  APPLICATIONS: 'cuemate.applications.v1',
  WITHDRAWALS: 'cuemate.withdrawals.v1',
  CUSTOM_SCHEDULES: 'cuemate.schedules.v1',
  PRIVACY_AGREED: 'cuemate.privacy.v1',
};

const listeners = new Set();
const autoReplyTimers = {};

let state = {
  initialized: false,
  accounts: [],
  verifications: {},
  companions: [],
  user: { ...mockUser },
  orders: [],
  threads: [],
  applications: [],
  withdrawals: [],
  customSchedules: {},
  privacyAgreed: false,
  connectionState: 'fallback',
};

function notify() {
  listeners.forEach(fn => {
    try {
      fn(state);
    } catch (e) {
      // ignore listener errors
    }
  });
}

function pushSyncToServer() {
  api
    .request('/api/sync', 'POST', {
      accounts: state.accounts,
      companions: state.companions,
      orders: state.orders,
      threads: state.threads,
      applications: state.applications,
      withdrawals: state.withdrawals,
      customSchedules: state.customSchedules,
    })
    .then(res => {
      if (res && res.ok && state.connectionState !== 'connected') {
        state.connectionState = 'connected';
        notify();
      }
    });
}

function syncFromServer() {
  return api.request('/api/bootstrap', 'GET').then(res => {
    if (!res || !res.ok) {
      if (state.connectionState !== 'fallback') {
        state.connectionState = 'fallback';
        notify();
      }
      return { ok: false };
    }

    state.connectionState = 'connected';
    if (Array.isArray(res.companions) && res.companions.length) {
      state.companions = res.companions;
      writeJson(EXTRA_KEYS.COMPANIONS, state.companions);
    }
    if (Array.isArray(res.orders)) {
      state.orders = res.orders.map(normalizeOrder);
      writeJson(STORAGE_KEYS.ORDERS, state.orders);
    }
    if (Array.isArray(res.threads)) {
      state.threads = res.threads;
      writeJson(STORAGE_KEYS.CHAT, state.threads);
    }
    if (Array.isArray(res.accounts) && res.accounts.length) {
      state.accounts = ensureAccounts(res.accounts);
      writeJson(STORAGE_KEYS.ACCOUNTS, state.accounts);
    }
    if (Array.isArray(res.applications)) {
      state.applications = res.applications;
      writeJson(EXTRA_KEYS.APPLICATIONS, state.applications);
    }
    if (Array.isArray(res.withdrawals)) {
      state.withdrawals = res.withdrawals;
      writeJson(EXTRA_KEYS.WITHDRAWALS, state.withdrawals);
    }
    if (res.customSchedules && typeof res.customSchedules === 'object') {
      state.customSchedules = res.customSchedules;
      writeJson(EXTRA_KEYS.CUSTOM_SCHEDULES, state.customSchedules);
    }
    notify();
    return { ok: true };
  });
}

function init() {
  if (state.initialized) return state;
  const fallbackAccounts = [createDefaultAccount()];
  const rawAccounts = readJson(STORAGE_KEYS.ACCOUNTS, fallbackAccounts);
  const accounts = ensureAccounts(rawAccounts);
  const user = readJson(STORAGE_KEYS.USER, mockUser);
  const verifications = readJson(STORAGE_KEYS.VERIFICATIONS, {});
  const companions = readJson(EXTRA_KEYS.COMPANIONS, defaultCompanions);
  const orders = readJson(STORAGE_KEYS.ORDERS, mockOrders).map(normalizeOrder);
  const threads = readJson(STORAGE_KEYS.CHAT, mockChatThreads);
  const applications = readJson(EXTRA_KEYS.APPLICATIONS, []);
  const withdrawals = readJson(EXTRA_KEYS.WITHDRAWALS, []);
  const customSchedules = readJson(EXTRA_KEYS.CUSTOM_SCHEDULES, {});
  const privacyAgreed = Boolean(readJson(EXTRA_KEYS.PRIVACY_AGREED, false));

  state = {
    initialized: true,
    accounts,
    verifications,
    companions,
    user,
    orders,
    threads,
    applications,
    withdrawals,
    customSchedules,
    privacyAgreed,
    connectionState: 'fallback',
  };

  syncFromServer();
  return state;
}

function getState() {
  if (!state.initialized) init();
  return state;
}

function subscribe(listener) {
  if (!state.initialized) init();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function saveUser(nextUser) {
  state.user = nextUser;
  writeJson(STORAGE_KEYS.USER, state.user);
  notify();
}

function saveAccounts(nextAccounts) {
  state.accounts = nextAccounts;
  writeJson(STORAGE_KEYS.ACCOUNTS, state.accounts);
  pushSyncToServer();
}

function saveVerifications(nextVerifications) {
  state.verifications = nextVerifications;
  writeJson(STORAGE_KEYS.VERIFICATIONS, state.verifications);
}

function saveCompanions(nextCompanions) {
  state.companions = nextCompanions;
  writeJson(EXTRA_KEYS.COMPANIONS, state.companions);
  pushSyncToServer();
  notify();
}

function saveOrders(nextOrders) {
  state.orders = nextOrders;
  writeJson(STORAGE_KEYS.ORDERS, state.orders);
  pushSyncToServer();
  notify();
}

function saveThreads(nextThreads) {
  state.threads = nextThreads;
  writeJson(STORAGE_KEYS.CHAT, state.threads);
  pushSyncToServer();
  notify();
}

function agreePrivacy() {
  state.privacyAgreed = true;
  writeJson(EXTRA_KEYS.PRIVACY_AGREED, true);
  notify();
}

// ==================== User & Auth Actions ====================

function charge(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return;
  saveUser({
    ...state.user,
    balance: Number((state.user.balance + num).toFixed(2)),
  });
}

function pay(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return { ok: true };
  if (state.user.balance < num) {
    return { ok: false, reason: 'insufficient_balance' };
  }
  saveUser({
    ...state.user,
    balance: Number((state.user.balance - num).toFixed(2)),
  });
  return { ok: true };
}

function requestWeChatPay({ orderId, amount, title = 'CueMate 台球陪练预约' }) {
  const num = Number(amount);
  return api.request('/api/pay/prepay', 'POST', { orderId, amount: num, title }).then(res => {
    const payParams = res && res.paymentParams ? res.paymentParams : null;
    return new Promise(resolve => {
      if (typeof wx !== 'undefined' && wx.showModal) {
        wx.showModal({
          title: '微信支付收银台',
          content: `${title}\n需支付金额：¥${num.toFixed(2)}\n（个体户商户号 JSAPI 预付单已生成）`,
          confirmText: '确认支付',
          cancelText: '稍后支付',
          confirmColor: '#10b981',
          success(modalRes) {
            if (modalRes.confirm) {
              if (state.user.balance >= num) {
                pay(num);
              }
              api.requestSubscribe('order_paid');
              resolve({ ok: true, channel: 'wechat_pay', prepay: payParams });
            } else {
              resolve({ ok: false, reason: 'user_cancelled' });
            }
          },
          fail() {
            resolve({ ok: false, reason: 'modal_failed' });
          },
        });
      } else {
        resolve({ ok: true, channel: 'wechat_pay', prepay: payParams });
      }
    });
  });
}

function applyLoginState(account) {
  const now = new Date().toISOString();
  saveAccounts(
    state.accounts.map(item =>
      item.phone === account.phone
        ? {
            ...item,
            lastLoginAt: now,
          }
        : item
    )
  );
  saveUser({
    ...state.user,
    id: account.id,
    name: account.name,
    avatar: account.avatar,
    phone: account.phone,
    bio: account.bio,
    gender: account.gender,
    openid: account.openid,
    role: 'user',
    companionId: undefined,
    isAuthenticated: true,
    lastLoginAt: now,
  });
}

function wxQuickLogin(options = {}) {
  return new Promise(resolve => {
    const finishLogin = code => {
      const targetPhone = options.phone || state.user.phone || mockUser.phone;
      api
        .request('/api/auth/wx-login', 'POST', {
          code,
          phone: targetPhone,
          name: options.name,
          avatar: options.avatar,
        })
        .then(res => {
          if (res && res.ok && res.account) {
            const exists = state.accounts.some(a => a.phone === res.account.phone);
            if (!exists) {
              saveAccounts([res.account, ...state.accounts]);
            }
            applyLoginState(res.account);
            resolve({ ok: true, openid: res.openid, phone: res.account.phone });
            return;
          }
          // Offline fallback
          const fallbackAcc =
            state.accounts.find(a => a.phone === targetPhone) || createDefaultAccount();
          applyLoginState(fallbackAcc);
          resolve({ ok: true, openid: 'wx_local_openid', phone: fallbackAcc.phone });
        });
    };

    if (typeof wx !== 'undefined' && wx.login) {
      wx.login({
        success(res) {
          finishLogin(res.code || 'wx_sim_code');
        },
        fail() {
          finishLogin('wx_fallback_code');
        },
      });
    } else {
      finishLogin('wx_fallback_code');
    }
  });
}

function setRole(role, next) {
  if (role === 'user') {
    const account = state.accounts.find(item => item.phone === state.user.phone);
    saveUser({
      ...state.user,
      role: 'user',
      companionId: undefined,
      id: account?.id ?? mockUser.id,
      name: account?.name ?? mockUser.name,
      avatar: account?.avatar ?? mockUser.avatar,
      bio: account?.bio ?? mockUser.bio,
      gender: account?.gender ?? mockUser.gender,
    });
    return;
  }

  saveUser({
    ...state.user,
    role: 'companion',
    companionId: next?.companionId ?? state.user.companionId,
    id: next?.id ?? state.user.id,
    name: next?.name ?? state.user.name,
    avatar: next?.avatar ?? state.user.avatar,
  });
}

function sendVerificationCode({ phone, purpose }) {
  const normalizedPhone = String(phone || '').trim();
  if (!isValidPhone(normalizedPhone)) {
    return { ok: false, message: '请输入正确的手机号' };
  }

  const account = state.accounts.find(item => item.phone === normalizedPhone);
  if (purpose === 'register' && account) {
    return { ok: false, message: '该手机号已注册，请直接登录' };
  }
  if ((purpose === 'login' || purpose === 'reset_password') && !account) {
    return { ok: false, message: '该手机号尚未注册' };
  }

  const now = Date.now();
  const existing = state.verifications[normalizedPhone];
  if (existing && now - new Date(existing.sentAt).getTime() < 60 * 1000) {
    return { ok: false, message: '验证码发送过于频繁，请稍后再试' };
  }

  const demoCode = generateCode();
  const expiresAt = new Date(now + 5 * 60 * 1000).toISOString();
  saveVerifications({
    ...state.verifications,
    [normalizedPhone]: {
      code: demoCode,
      purpose,
      sentAt: new Date(now).toISOString(),
      expiresAt,
    },
  });

  return {
    ok: true,
    message: '验证码已发送，演示环境会直接展示验证码',
    demoCode,
    expiresAt,
  };
}

function login({ phone, password }) {
  const normalizedPhone = String(phone || '').trim();
  const normalizedPassword = String(password || '').trim();
  const account = state.accounts.find(item => item.phone === normalizedPhone);

  if (!account) {
    return { ok: false, message: '账号不存在，请先注册' };
  }
  if (account.password !== normalizedPassword) {
    return { ok: false, message: '密码不正确，请重新输入' };
  }

  applyLoginState(account);
  return { ok: true };
}

function loginWithCode({ phone, code }) {
  const normalizedPhone = String(phone || '').trim();
  const verification = verifyCodeSession(state.verifications, normalizedPhone, code, 'login');
  if (!verification.ok) return verification;

  const account = state.accounts.find(item => item.phone === normalizedPhone);
  if (!account) return { ok: false, message: '账号不存在，请先注册' };

  applyLoginState(account);
  return { ok: true };
}

function register({ name, phone, password, code }) {
  const normalizedName = String(name || '').trim();
  const normalizedPhone = String(phone || '').trim();
  const normalizedPassword = String(password || '').trim();

  const sec = checkContentSecurity(normalizedName);
  if (!sec.ok) return sec;

  if (!isValidPhone(normalizedPhone)) {
    return { ok: false, message: '请输入正确的手机号' };
  }
  if (normalizedPassword.length < 6) {
    return { ok: false, message: '密码至少需要 6 位' };
  }
  if (state.accounts.some(account => account.phone === normalizedPhone)) {
    return { ok: false, message: '该手机号已注册，请直接登录' };
  }

  const verification = verifyCodeSession(state.verifications, normalizedPhone, code, 'register');
  if (!verification.ok) return verification;

  const newAccount = {
    id: `u_${Date.now()}`,
    name: normalizedName || `球友_${normalizedPhone.slice(-4)}`,
    phone: normalizedPhone,
    password: normalizedPassword,
    avatar: createAvatar(normalizedPhone),
    bio: '这个人很神秘，还没写自我介绍。',
    gender: 'other',
    createdAt: new Date().toISOString(),
  };

  saveAccounts([newAccount, ...state.accounts]);
  applyLoginState(newAccount);
  return { ok: true };
}

function resetPassword({ phone, code, newPassword }) {
  const normalizedPhone = String(phone || '').trim();
  const trimmedPwd = String(newPassword || '').trim();
  if (trimmedPwd.length < 6) {
    return { ok: false, message: '新密码至少需要 6 位' };
  }

  const verification = verifyCodeSession(state.verifications, normalizedPhone, code, 'reset_password');
  if (!verification.ok) return verification;

  const account = state.accounts.find(item => item.phone === normalizedPhone);
  if (!account) return { ok: false, message: '账号不存在' };

  saveAccounts(
    state.accounts.map(item =>
      item.phone === normalizedPhone
        ? {
            ...item,
            password: trimmedPwd,
          }
        : item
    )
  );

  return { ok: true, message: '密码已重置，请使用新密码登录' };
}

function updateProfile({ name, bio, gender, avatar }) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) {
    return { ok: false, message: '昵称不能为空' };
  }

  const sec = checkContentSecurity(`${normalizedName} ${bio || ''}`);
  if (!sec.ok) return sec;

  const nextAvatar = avatar || state.user.avatar;

  saveAccounts(
    state.accounts.map(item =>
      item.phone === state.user.phone
        ? {
            ...item,
            name: normalizedName,
            bio: String(bio || '').trim(),
            gender,
            avatar: nextAvatar,
          }
        : item
    )
  );

  saveUser({
    ...state.user,
    name: normalizedName,
    bio: String(bio || '').trim(),
    gender,
    avatar: nextAvatar,
  });

  return { ok: true, message: '资料已更新' };
}

function logout() {
  saveUser({
    ...mockUser,
    balance: state.user.balance,
    coupons: state.user.coupons,
    locationCity: state.user.locationCity,
    locationLabel: state.user.locationLabel,
    locationCoords: state.user.locationCoords,
    locationStatus: state.user.locationStatus ?? 'idle',
  });
}

function requestLocation() {
  saveUser({
    ...state.user,
    locationStatus: 'locating',
    locationLabel: '正在获取当前位置...',
  });

  return new Promise(resolve => {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success(res) {
        const { latitude, longitude } = res;
        const inferred = inferLocationLabel(latitude, longitude);
        saveUser({
          ...state.user,
          locationStatus: 'granted',
          locationCity: inferred.city,
          locationLabel: inferred.label,
          locationCoords: { latitude, longitude },
        });
        resolve({ ok: true });
      },
      fail() {
        saveUser({
          ...state.user,
          locationStatus: 'granted',
          locationCity: '北京市朝阳区',
          locationLabel: '北京市朝阳区 · 已获取附近定位（演示）',
          locationCoords: { latitude: 39.99, longitude: 116.48 },
        });
        resolve({ ok: true, message: '已切换至附近演示定位' });
      },
    });
  });
}

function resetUser() {
  saveAccounts([createDefaultAccount()]);
  saveVerifications({});
  saveCompanions(defaultCompanions);
  saveOrders(mockOrders.map(normalizeOrder));
  saveThreads(mockChatThreads);
  state.applications = [];
  state.withdrawals = [];
  state.customSchedules = {};
  writeJson(EXTRA_KEYS.APPLICATIONS, []);
  writeJson(EXTRA_KEYS.WITHDRAWALS, []);
  writeJson(EXTRA_KEYS.CUSTOM_SCHEDULES, {});
  saveUser({ ...mockUser, isAuthenticated: true });
  api.request('/api/reset', 'POST', {});
}

// ==================== Companion Onboarding & Schedule Actions ====================

function submitCompanionApplication(payload) {
  const name = String(payload.name || '').trim();
  const level = String(payload.level || '').trim() || '认证台球助教';
  const hourlyRate = Number(payload.hourlyRate) || 168;
  const venueName = String(payload.venueName || '').trim() || 'CueMate 台球俱乐部（望京店）';
  const bio = String(payload.bio || '').trim() || '擅长中式八球实战走位与发力指导，欢迎约球。';
  const tags =
    Array.isArray(payload.tags) && payload.tags.length
      ? payload.tags
      : ['中式八球', '认证助教', '耐心教学'];

  if (!name) {
    return Promise.resolve({ ok: false, message: '请填写真实姓名或助教昵称' });
  }

  const sec = checkContentSecurity(`${name} ${level} ${bio}`);
  if (!sec.ok) {
    return Promise.resolve(sec);
  }

  const compId = `c_${Date.now().toString(36)}`;
  const newCompanion = {
    id: compId,
    name,
    avatar: payload.avatar || state.user.avatar || createAvatar(name),
    level,
    hourlyRate,
    rating: 5.0,
    reviewCount: 1,
    tags,
    bio,
    distance: '0.8km',
    venueName,
    venueAddress: '北京市朝阳区望京SOHO 3号楼 B1层',
    venueLat: 39.9968,
    venueLng: 116.4808,
    onlineStatus: 'online',
    images: [
      payload.photoUrl ||
        payload.avatar ||
        state.user.avatar ||
        'https://picsum.photos/seed/cue_new/600/400',
    ],
  };

  return api
    .request('/api/companions/apply', 'POST', {
      application: {
        ...payload,
        companionId: compId,
        name,
        level,
        hourlyRate,
        venueName,
        tags,
        bio,
      },
    })
    .then(res => {
      const created = (res && res.companion) || newCompanion;
      const nextComps = [created, ...state.companions.filter(c => c.id !== created.id)];
      saveCompanions(nextComps);
      const appRecord = (res && res.application) || {
        id: `app_${Date.now()}`,
        companionId: created.id,
        name,
        level,
        hourlyRate,
        venueName,
        status: 'approved',
        createdAt: new Date().toISOString(),
      };
      state.applications = [appRecord, ...state.applications];
      writeJson(EXTRA_KEYS.APPLICATIONS, state.applications);
      return { ok: true, companion: created, application: appRecord };
    });
}

function toggleCompanionSlot(companionId, dateStr, timeStr) {
  const key = `${companionId}_${dateStr}`;
  const disabledList = state.customSchedules[key] || [];
  const nextList = disabledList.includes(timeStr)
    ? disabledList.filter(t => t !== timeStr)
    : [...disabledList, timeStr];
  state.customSchedules = {
    ...state.customSchedules,
    [key]: nextList,
  };
  writeJson(EXTRA_KEYS.CUSTOM_SCHEDULES, state.customSchedules);
  pushSyncToServer();
  notify();
  return !nextList.includes(timeStr);
}

function isSlotDisabledByCompanion(companionId, dateStr, timeStr) {
  const key = `${companionId}_${dateStr}`;
  const disabledList = state.customSchedules[key] || [];
  return disabledList.includes(timeStr);
}

function toggleCompanionOnlineStatus(companionId) {
  const nextComps = state.companions.map(comp => {
    if (comp.id !== companionId) return comp;
    const nextStatus = comp.onlineStatus === 'resting' ? 'online' : 'resting';
    return { ...comp, onlineStatus: nextStatus };
  });
  saveCompanions(nextComps);
}

function withdrawCompanionEarnings({ companionId, amount, channel = '微信零钱' }) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) {
    return Promise.resolve({ ok: false, message: '暂无可提现金额' });
  }
  return api
    .request('/api/wallet/withdraw', 'POST', { companionId, amount: num, channel })
    .then(res => {
      const record = (res && res.withdrawal) || {
        id: `wd_${Date.now()}`,
        companionId,
        amount: num,
        channel,
        status: '已到账',
        createdAt: new Date().toISOString(),
      };
      state.withdrawals = [record, ...state.withdrawals];
      writeJson(EXTRA_KEYS.WITHDRAWALS, state.withdrawals);
      notify();
      return { ok: true, withdrawal: record };
    });
}

// ==================== Order Actions ====================

function addOrder(order) {
  const sec = checkContentSecurity(order.note || '');
  if (!sec.ok) {
    return sec;
  }

  const locked = getLockedSlotsForCompanion(state.orders, order.companionId, order.date);
  const conflict = (order.timeSlots || []).find(s => locked.has(s));
  if (conflict) {
    return {
      ok: false,
      reason: 'slot_conflict',
      message: `时段 ${conflict} 已被预约锁定，请选择其他时段`,
    };
  }

  saveOrders([order, ...state.orders]);
  api.request('/api/orders', 'POST', { order });
  return { ok: true, order };
}

function updateOrder(id, patch) {
  if (patch.customerReview && patch.customerReview.content) {
    const sec = checkContentSecurity(patch.customerReview.content);
    if (!sec.ok) return sec;
  }
  if (patch.companionReview && patch.companionReview.content) {
    const sec = checkContentSecurity(patch.companionReview.content);
    if (!sec.ok) return sec;
  }
  saveOrders(state.orders.map(o => (o.id === id ? { ...o, ...patch } : o)));
  return { ok: true };
}

// ==================== Chat Actions ====================

function ensureThread(input) {
  const threadId = createThreadId(input.companionId, input.customerId);
  const existing = state.threads.find(thread => thread.id === threadId);
  const now = new Date().toISOString();
  const thread = existing
    ? {
        ...existing,
        ...input,
        appointmentSlots: input.appointmentSlots ?? existing.appointmentSlots,
      }
    : {
        id: threadId,
        ...input,
        messages: [
          {
            id: `${threadId}_welcome`,
            sender: 'companion',
            type: 'text',
            text: '你好，档期和打法偏好都可以先聊，我会提前帮你安排。',
            createdAt: now,
          },
        ],
        lastReadAtCompanion: now,
      };

  saveThreads(upsertThread(state.threads, thread));
  return threadId;
}

function sendMessage(threadId, payload) {
  if (payload.text) {
    const sec = checkContentSecurity(payload.text);
    if (!sec.ok) {
      return sec;
    }
  }

  const now = new Date().toISOString();
  const message = {
    id: createMessageId(threadId),
    sender: payload.sender,
    type: payload.type ?? 'text',
    text: payload.text,
    mediaUrl: payload.mediaUrl,
    durationSec: payload.durationSec,
    createdAt: now,
  };

  saveThreads(
    updateThread(state.threads, threadId, thread => ({
      ...thread,
      messages: [...thread.messages, message],
      ...(payload.sender === 'user' ? { lastReadAtUser: now } : { lastReadAtCompanion: now }),
    }))
  );

  if (payload.autoReply === false) return { ok: true };

  const replyRole = payload.sender === 'user' ? 'companion' : 'user';
  const delay = 1200 + Math.floor(Math.random() * 1400);

  if (autoReplyTimers[threadId]) {
    clearTimeout(autoReplyTimers[threadId]);
  }

  autoReplyTimers[threadId] = setTimeout(() => {
    const thread = state.threads.find(item => item.id === threadId);
    if (!thread) return;

    const replyMessage = {
      id: createMessageId(threadId),
      sender: replyRole,
      type: 'text',
      text: replyTextFor(thread, payload),
      createdAt: new Date().toISOString(),
    };

    saveThreads(
      updateThread(state.threads, threadId, current => ({
        ...current,
        messages: [...current.messages, replyMessage],
      }))
    );
  }, delay);

  return { ok: true };
}

function markThreadRead(threadId, role) {
  const now = new Date().toISOString();
  saveThreads(
    updateThread(state.threads, threadId, thread => ({
      ...thread,
      ...(role === 'user' ? { lastReadAtUser: now } : { lastReadAtCompanion: now }),
    }))
  );
}

function ensureAuthRedirect() {
  const { user } = getState();
  if (!user.isAuthenticated) {
    wx.redirectTo({ url: '/pages/auth/index' });
    return false;
  }
  return true;
}

module.exports = {
  init,
  getState,
  subscribe,
  syncFromServer,
  agreePrivacy,
  charge,
  pay,
  requestWeChatPay,
  wxQuickLogin,
  setRole,
  sendVerificationCode,
  login,
  loginWithCode,
  register,
  resetPassword,
  updateProfile,
  logout,
  requestLocation,
  resetUser,
  submitCompanionApplication,
  toggleCompanionSlot,
  isSlotDisabledByCompanion,
  toggleCompanionOnlineStatus,
  withdrawCompanionEarnings,
  addOrder,
  updateOrder,
  ensureThread,
  sendMessage,
  markThreadRead,
  ensureAuthRedirect,
};
