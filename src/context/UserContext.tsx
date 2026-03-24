import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { UserProfile } from '../data/mock';
import { mockUser } from '../data/mock';
import { readJson, writeJson } from '../utils/storage';

type VerificationPurpose = 'login' | 'register' | 'reset_password';

interface RegisteredAccount {
  id: string;
  name: string;
  phone: string;
  password: string;
  avatar: string;
  bio?: string;
  gender?: UserProfile['gender'];
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthResult {
  ok: boolean;
  message?: string;
}

interface VerificationResult extends AuthResult {
  demoCode?: string;
  expiresAt?: string;
}

interface VerificationSession {
  code: string;
  purpose: VerificationPurpose;
  expiresAt: string;
  sentAt: string;
}

interface UserContextValue {
  user: UserProfile;
  charge: (amount: number) => void;
  pay: (amount: number) => { ok: true } | { ok: false; reason: 'insufficient_balance' };
  setRole: (
    role: UserProfile['role'],
    next?: Pick<UserProfile, 'id' | 'name' | 'avatar' | 'companionId'>
  ) => void;
  login: (payload: { phone: string; password: string }) => AuthResult;
  loginWithCode: (payload: { phone: string; code: string }) => AuthResult;
  register: (payload: { name: string; phone: string; password: string; code: string }) => AuthResult;
  sendVerificationCode: (payload: { phone: string; purpose: VerificationPurpose }) => VerificationResult;
  resetPassword: (payload: { phone: string; code: string; newPassword: string }) => AuthResult;
  updateProfile: (payload: { name: string; bio: string; gender: NonNullable<UserProfile['gender']> }) => AuthResult;
  logout: () => void;
  requestLocation: () => Promise<{ ok: boolean; message?: string }>;
  resetUser: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);
const STORAGE_KEY = 'cuemate.user.v3';
const ACCOUNT_STORAGE_KEY = 'cuemate.accounts.v2';
const VERIFICATION_STORAGE_KEY = 'cuemate.verification.v1';

function createAvatar(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/200/200`;
}

function createDefaultAccount(): RegisteredAccount {
  return {
    id: mockUser.id,
    name: mockUser.name,
    phone: mockUser.phone,
    password: '123456',
    avatar: mockUser.avatar,
    bio: mockUser.bio,
    gender: mockUser.gender,
    createdAt: new Date().toISOString(),
  };
}

function readAccounts() {
  const fallback = [createDefaultAccount()];
  const accounts = readJson<RegisteredAccount[]>(ACCOUNT_STORAGE_KEY, fallback);
  if (!accounts.some(account => account.phone === mockUser.phone)) {
    return [...accounts, fallback[0]];
  }
  return accounts;
}

function inferLocationLabel(latitude: number, longitude: number) {
  if (latitude > 39 && latitude < 41 && longitude > 115 && longitude < 118) {
    return {
      city: '北京市朝阳区',
      label: '北京市朝阳区 · 已获取附近定位',
    };
  }

  if (latitude > 30 && latitude < 32 && longitude > 120 && longitude < 122) {
    return {
      city: '上海市浦东新区',
      label: '上海市浦东新区 · 已获取附近定位',
    };
  }

  if (latitude > 22 && latitude < 24 && longitude > 112 && longitude < 115) {
    return {
      city: '广州市天河区',
      label: '广州市天河区 · 已获取附近定位',
    };
  }

  return {
    city: '已获取当前位置',
    label: `纬度 ${latitude.toFixed(3)} / 经度 ${longitude.toFixed(3)}`,
  };
}

function isValidPhone(phone: string) {
  return /^1\d{10}$/.test(phone.trim());
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function UserProvider({ children }: PropsWithChildren) {
  const [accounts, setAccounts] = useState<RegisteredAccount[]>(() => readAccounts());
  const [user, setUser] = useState<UserProfile>(() => readJson<UserProfile>(STORAGE_KEY, mockUser));
  const [verifications, setVerifications] = useState<Record<string, VerificationSession>>(() =>
    readJson<Record<string, VerificationSession>>(VERIFICATION_STORAGE_KEY, {})
  );

  useEffect(() => {
    writeJson(STORAGE_KEY, user);
  }, [user]);

  useEffect(() => {
    writeJson(ACCOUNT_STORAGE_KEY, accounts);
  }, [accounts]);

  useEffect(() => {
    writeJson(VERIFICATION_STORAGE_KEY, verifications);
  }, [verifications]);

  const charge = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setUser(prev => ({ ...prev, balance: prev.balance + amount }));
  };

  const pay: UserContextValue['pay'] = amount => {
    if (!Number.isFinite(amount) || amount <= 0) return { ok: true };
    if (user.balance < amount) return { ok: false, reason: 'insufficient_balance' };
    setUser(prev => ({ ...prev, balance: prev.balance - amount }));
    return { ok: true };
  };

  const applyLoginState = (account: RegisteredAccount) => {
    const now = new Date().toISOString();
    setAccounts(prev =>
      prev.map(item =>
        item.phone === account.phone
          ? {
              ...item,
              lastLoginAt: now,
            }
          : item
      )
    );
    setUser(prev => ({
      ...prev,
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
    }));
  };

  const setRole: UserContextValue['setRole'] = (role, next) => {
    setUser(prev => {
      if (role === 'user') {
        const account = accounts.find(item => item.phone === prev.phone);
        return {
          ...prev,
          role: 'user',
          companionId: undefined,
          id: account?.id ?? mockUser.id,
          name: account?.name ?? mockUser.name,
          avatar: account?.avatar ?? mockUser.avatar,
          bio: account?.bio ?? mockUser.bio,
          gender: account?.gender ?? mockUser.gender,
        };
      }

      return {
        ...prev,
        role: 'companion',
        companionId: next?.companionId ?? prev.companionId,
        id: next?.id ?? prev.id,
        name: next?.name ?? prev.name,
        avatar: next?.avatar ?? prev.avatar,
      };
    });
  };

  const sendVerificationCode: UserContextValue['sendVerificationCode'] = ({ phone, purpose }) => {
    const normalizedPhone = phone.trim();

    if (!isValidPhone(normalizedPhone)) {
      return { ok: false, message: '请输入正确的手机号' };
    }

    const account = accounts.find(item => item.phone === normalizedPhone);
    if (purpose === 'register' && account) {
      return { ok: false, message: '该手机号已注册，请直接登录' };
    }
    if ((purpose === 'login' || purpose === 'reset_password') && !account) {
      return { ok: false, message: '该手机号尚未注册' };
    }

    const now = Date.now();
    const existing = verifications[normalizedPhone];
    if (existing && now - new Date(existing.sentAt).getTime() < 60 * 1000) {
      return { ok: false, message: '验证码发送过于频繁，请稍后再试' };
    }

    const demoCode = generateCode();
    const expiresAt = new Date(now + 5 * 60 * 1000).toISOString();
    setVerifications(prev => ({
      ...prev,
      [normalizedPhone]: {
        code: demoCode,
        purpose,
        sentAt: new Date(now).toISOString(),
        expiresAt,
      },
    }));

    return {
      ok: true,
      message: '验证码已发送，演示环境会直接展示验证码',
      demoCode,
      expiresAt,
    };
  };

  const verifyCode = (phone: string, code: string, purpose: VerificationPurpose) => {
    const session = verifications[phone.trim()];
    if (!session) return { ok: false, message: '请先获取验证码' };
    if (session.purpose !== purpose) return { ok: false, message: '验证码用途不匹配，请重新获取' };
    if (new Date(session.expiresAt).getTime() < Date.now()) return { ok: false, message: '验证码已过期，请重新获取' };
    if (session.code !== code.trim()) return { ok: false, message: '验证码不正确' };
    return { ok: true };
  };

  const login: UserContextValue['login'] = ({ phone, password }) => {
    const normalizedPhone = phone.trim();
    const normalizedPassword = password.trim();
    const account = accounts.find(item => item.phone === normalizedPhone);

    if (!account) {
      return { ok: false, message: '账号不存在，请先注册' };
    }

    if (account.password !== normalizedPassword) {
      return { ok: false, message: '密码不正确，请重新输入' };
    }

    applyLoginState(account);
    return { ok: true };
  };

  const loginWithCode: UserContextValue['loginWithCode'] = ({ phone, code }) => {
    const normalizedPhone = phone.trim();
    const verification = verifyCode(normalizedPhone, code, 'login');
    if (!verification.ok) return verification;

    const account = accounts.find(item => item.phone === normalizedPhone);
    if (!account) return { ok: false, message: '账号不存在，请先注册' };

    applyLoginState(account);
    return { ok: true };
  };

  const register: UserContextValue['register'] = ({ name, phone, password, code }) => {
    const normalizedName = name.trim();
    const normalizedPhone = phone.trim();
    const normalizedPassword = password.trim();

    if (!isValidPhone(normalizedPhone)) {
      return { ok: false, message: '请输入正确的手机号' };
    }
    if (normalizedPassword.length < 6) {
      return { ok: false, message: '密码至少需要 6 位' };
    }
    if (accounts.some(account => account.phone === normalizedPhone)) {
      return { ok: false, message: '该手机号已注册，请直接登录' };
    }

    const verification = verifyCode(normalizedPhone, code, 'register');
    if (!verification.ok) return verification;

    const newAccount: RegisteredAccount = {
      id: `u_${Date.now()}`,
      name: normalizedName || `球友_${normalizedPhone.slice(-4)}`,
      phone: normalizedPhone,
      password: normalizedPassword,
      avatar: createAvatar(normalizedPhone),
      bio: '这个人很神秘，还没写自我介绍。',
      gender: 'other',
      createdAt: new Date().toISOString(),
    };

    setAccounts(prev => [newAccount, ...prev]);
    applyLoginState(newAccount);
    return { ok: true };
  };

  const resetPassword: UserContextValue['resetPassword'] = ({ phone, code, newPassword }) => {
    const normalizedPhone = phone.trim();
    if (newPassword.trim().length < 6) {
      return { ok: false, message: '新密码至少需要 6 位' };
    }

    const verification = verifyCode(normalizedPhone, code, 'reset_password');
    if (!verification.ok) return verification;

    const account = accounts.find(item => item.phone === normalizedPhone);
    if (!account) return { ok: false, message: '账号不存在' };

    setAccounts(prev =>
      prev.map(item =>
        item.phone === normalizedPhone
          ? {
              ...item,
              password: newPassword.trim(),
            }
          : item
      )
    );

    return { ok: true, message: '密码已重置，请使用新密码登录' };
  };

  const updateProfile: UserContextValue['updateProfile'] = ({ name, bio, gender }) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return { ok: false, message: '昵称不能为空' };
    }

    setAccounts(prev =>
      prev.map(item =>
        item.phone === user.phone
          ? {
              ...item,
              name: normalizedName,
              bio: bio.trim(),
              gender,
            }
          : item
      )
    );

    setUser(prev => ({
      ...prev,
      name: normalizedName,
      bio: bio.trim(),
      gender,
    }));

    return { ok: true, message: '资料已更新' };
  };

  const logout = () => {
    setUser(prev => ({
      ...mockUser,
      balance: prev.balance,
      coupons: prev.coupons,
      locationCity: prev.locationCity,
      locationLabel: prev.locationLabel,
      locationCoords: prev.locationCoords,
      locationStatus: prev.locationStatus ?? 'idle',
    }));
  };

  const requestLocation: UserContextValue['requestLocation'] = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setUser(prev => ({
        ...prev,
        locationStatus: 'unsupported',
        locationCity: '当前设备不支持定位',
        locationLabel: '请在支持定位的浏览器中打开',
      }));
      return { ok: false, message: '当前浏览器不支持定位' };
    }

    setUser(prev => ({ ...prev, locationStatus: 'locating', locationLabel: '正在获取当前位置...' }));

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          const inferred = inferLocationLabel(latitude, longitude);
          setUser(prev => ({
            ...prev,
            locationStatus: 'granted',
            locationCity: inferred.city,
            locationLabel: inferred.label,
            locationCoords: { latitude, longitude },
          }));
          resolve({ ok: true });
        },
        () => {
          setUser(prev => ({
            ...prev,
            locationStatus: 'denied',
            locationCity: '定位权限未开启',
            locationLabel: '请允许浏览器访问位置，以查看附近陪玩',
          }));
          resolve({ ok: false, message: '定位权限未开启' });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const resetUser = () => {
    setAccounts([createDefaultAccount()]);
    setVerifications({});
    setUser(mockUser);
  };

  const value = useMemo(
    () => ({
      user,
      charge,
      pay,
      setRole,
      login,
      loginWithCode,
      register,
      sendVerificationCode,
      resetPassword,
      updateProfile,
      logout,
      requestLocation,
      resetUser,
    }),
    [user, accounts, verifications]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
