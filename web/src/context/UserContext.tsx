import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { UserProfile } from '../data/mock';
import { mockUser } from '../data/mock';
import {
  STORAGE_KEYS,
  createAvatar,
  createDefaultAccount,
  ensureAccounts,
  inferLocationLabel,
  isValidPhone,
  generateCode,
  verifyCodeSession,
  type RegisteredAccount,
  type VerificationPurpose,
  type VerificationSession,
} from '../../../shared/cuemate-core';
import { readJson, writeJson } from '../utils/storage';

interface AuthResult {
  ok: boolean;
  message?: string;
}

interface VerificationResult extends AuthResult {
  demoCode?: string;
  expiresAt?: string;
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
const STORAGE_KEY = STORAGE_KEYS.USER;
const ACCOUNT_STORAGE_KEY = STORAGE_KEYS.ACCOUNTS;
const VERIFICATION_STORAGE_KEY = STORAGE_KEYS.VERIFICATIONS;

function readAccounts() {
  const fallback = [createDefaultAccount()];
  const accounts = readJson<RegisteredAccount[]>(ACCOUNT_STORAGE_KEY, fallback);
  return ensureAccounts(accounts);
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

  const verifyCode = (phone: string, code: string, purpose: VerificationPurpose) =>
    verifyCodeSession(verifications, phone, code, purpose);

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
