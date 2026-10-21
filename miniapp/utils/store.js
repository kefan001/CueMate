const core = require('../shared/cuemate-core');
const { readJson, writeJson } = require('./storage');

const {
  STORAGE_KEYS,
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
} = core;

const listeners = new Set();
const autoReplyTimers = {};

let state = {
  initialized: false,
  accounts: [],
  verifications: {},
  user: { ...mockUser },
  orders: [],
  threads: [],
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

function init() {
  if (state.initialized) return state;
  const fallbackAccounts = [createDefaultAccount()];
  const rawAccounts = readJson(STORAGE_KEYS.ACCOUNTS, fallbackAccounts);
  const accounts = ensureAccounts(rawAccounts);
  const user = readJson(STORAGE_KEYS.USER, mockUser);
  const verifications = readJson(STORAGE_KEYS.VERIFICATIONS, {});
  const orders = readJson(STORAGE_KEYS.ORDERS, mockOrders).map(normalizeOrder);
  const threads = readJson(STORAGE_KEYS.CHAT, mockChatThreads);

  state = {
    initialized: true,
    accounts,
    verifications,
    user,
    orders,
    threads,
    connectionState: 'fallback',
  };
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
}

function saveVerifications(nextVerifications) {
  state.verifications = nextVerifications;
  writeJson(STORAGE_KEYS.VERIFICATIONS, state.verifications);
}

function saveOrders(nextOrders) {
  state.orders = nextOrders;
  writeJson(STORAGE_KEYS.ORDERS, state.orders);
  notify();
}

function saveThreads(nextThreads) {
  state.threads = nextThreads;
  writeJson(STORAGE_KEYS.CHAT, state.threads);
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
    role: 'user',
    companionId: undefined,
    isAuthenticated: true,
    lastLoginAt: now,
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

function updateProfile({ name, bio, gender }) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) {
    return { ok: false, message: '昵称不能为空' };
  }

  saveAccounts(
    state.accounts.map(item =>
      item.phone === state.user.phone
        ? {
            ...item,
            name: normalizedName,
            bio: String(bio || '').trim(),
            gender,
          }
        : item
    )
  );

  saveUser({
    ...state.user,
    name: normalizedName,
    bio: String(bio || '').trim(),
    gender,
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
        // Fallback for simulator when location permission is not configured
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
  saveOrders(mockOrders.map(normalizeOrder));
  saveThreads(mockChatThreads);
  saveUser({ ...mockUser, isAuthenticated: true });
}

// ==================== Order Actions ====================

function addOrder(order) {
  saveOrders([order, ...state.orders]);
}

function updateOrder(id, patch) {
  saveOrders(state.orders.map(o => (o.id === id ? { ...o, ...patch } : o)));
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

  if (payload.autoReply === false) return;

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
  charge,
  pay,
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
  addOrder,
  updateOrder,
  ensureThread,
  sendMessage,
  markThreadRead,
  ensureAuthRedirect,
};
