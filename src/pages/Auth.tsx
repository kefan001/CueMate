import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, LockKeyhole, MapPin, MessageSquareText, Phone, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

type AuthMode = 'login' | 'register' | 'reset_password';
type LoginMethod = 'password' | 'code';

export default function Auth() {
  const navigate = useNavigate();
  const { login, loginWithCode, register, resetPassword, sendVerificationCode } = useUser();

  const [mode, setMode] = useState<AuthMode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('13800138000');
  const [password, setPassword] = useState('123456');
  const [newPassword, setNewPassword] = useState('123456');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [countdownUntil, setCountdownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const countdown = useMemo(() => {
    if (!countdownUntil) return 0;
    return Math.max(0, Math.ceil((countdownUntil - now) / 1000));
  }, [countdownUntil, now]);

  useEffect(() => {
    if (!countdownUntil) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdownUntil]);

  useEffect(() => {
    if (countdown === 0 && countdownUntil) {
      setCountdownUntil(null);
    }
  }, [countdown, countdownUntil]);

  const sendCode = () => {
    const purpose = mode === 'register' ? 'register' : mode === 'reset_password' ? 'reset_password' : 'login';
    const result = sendVerificationCode({ phone, purpose });
    if (!result.ok) {
      setError(result.message ?? '验证码发送失败');
      return;
    }
    setError('');
    setHint(result.message ?? '');
    setDemoCode(result.demoCode ?? '');
    setCountdownUntil(Date.now() + 60 * 1000);
  };

  const handleSubmit = () => {
    setError('');
    setHint('');

    const result =
      mode === 'login'
        ? loginMethod === 'password'
          ? login({ phone, password })
          : loginWithCode({ phone, code })
        : mode === 'register'
          ? register({ name, phone, password, code })
          : resetPassword({ phone, code, newPassword });

    if (!result.ok) {
      setError(result.message ?? '操作失败，请稍后重试');
      return;
    }

    if (mode === 'reset_password') {
      setMode('login');
      setLoginMethod('password');
      setPassword(newPassword);
      setHint(result.message ?? '密码已重置，请重新登录');
      return;
    }

    navigate('/discovery', { replace: true });
  };

  const showCodeField = mode === 'register' || mode === 'reset_password' || (mode === 'login' && loginMethod === 'code');

  return (
    <div className="flex-1 min-h-screen bg-[radial-gradient(circle_at_top,#124233_0%,#0b1614_34%,#09090b_100%)] px-6 py-10 flex flex-col justify-between">
      <div>
        <div className="pt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-billiards-500/20 bg-billiards-500/10 px-4 py-2 text-xs text-billiards-300">
            <MapPin className="w-3 h-3" />
            登录后即可开启附近陪玩、定位和订单履约功能
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white leading-tight">
            CueMate
            <span className="block text-zinc-400 text-lg font-medium mt-3">这次把登录、验证码和找回密码也做顺了。</span>
          </h1>
        </div>

        <div className="mt-10 rounded-[2rem] border border-zinc-800/70 bg-zinc-950/80 backdrop-blur-xl p-5 shadow-2xl shadow-black/30">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-zinc-900 p-1">
            {[
              { id: 'login', label: '登录' },
              { id: 'register', label: '注册' },
              { id: 'reset_password', label: '找回密码' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setMode(item.id as AuthMode);
                  setError('');
                  setHint('');
                }}
                className={`rounded-2xl py-3 text-xs font-medium transition-colors ${
                  mode === item.id ? 'bg-billiards-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {mode === 'login' ? (
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-zinc-900 p-1">
              {[
                { id: 'password', label: '密码登录' },
                { id: 'code', label: '验证码登录' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setLoginMethod(item.id as LoginMethod);
                    setError('');
                  }}
                  className={`rounded-2xl py-2.5 text-xs font-medium transition-colors ${
                    loginMethod === item.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          <motion.div
            key={`${mode}-${loginMethod}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 space-y-4"
          >
            {mode === 'register' ? (
              <label className="block">
                <div className="mb-2 text-sm text-zinc-400">昵称</div>
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                  <UserRound className="w-4 h-4 text-zinc-500" />
                  <input
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="输入你的昵称"
                    className="flex-1 bg-transparent text-white outline-none placeholder:text-zinc-600"
                  />
                </div>
              </label>
            ) : null}

            <label className="block">
              <div className="mb-2 text-sm text-zinc-400">手机号</div>
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                <Phone className="w-4 h-4 text-zinc-500" />
                <input
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  placeholder="请输入手机号"
                  className="flex-1 bg-transparent text-white outline-none placeholder:text-zinc-600"
                />
              </div>
            </label>

            {mode !== 'reset_password' ? (
              <label className="block">
                <div className="mb-2 text-sm text-zinc-400">密码</div>
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                  <LockKeyhole className="w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder="至少 6 位"
                    className="flex-1 bg-transparent text-white outline-none placeholder:text-zinc-600"
                  />
                </div>
              </label>
            ) : null}

            {mode === 'reset_password' ? (
              <label className="block">
                <div className="mb-2 text-sm text-zinc-400">新密码</div>
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                  <KeyRound className="w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={event => setNewPassword(event.target.value)}
                    placeholder="设置新的登录密码"
                    className="flex-1 bg-transparent text-white outline-none placeholder:text-zinc-600"
                  />
                </div>
              </label>
            ) : null}

            {showCodeField ? (
              <label className="block">
                <div className="mb-2 text-sm text-zinc-400">验证码</div>
                <div className="flex gap-3">
                  <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                    <MessageSquareText className="w-4 h-4 text-zinc-500" />
                    <input
                      value={code}
                      onChange={event => setCode(event.target.value)}
                      placeholder="输入 6 位验证码"
                      className="flex-1 bg-transparent text-white outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <button
                    onClick={sendCode}
                    disabled={countdown > 0}
                    className={`rounded-2xl px-4 text-xs font-semibold ${
                      countdown > 0 ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-900 hover:bg-white'
                    }`}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </label>
            ) : null}

            {error ? <div className="text-sm text-rose-400">{error}</div> : null}
            {hint ? <div className="text-sm text-billiards-300">{hint}</div> : null}
            {demoCode ? <div className="text-xs text-gold-300">演示验证码：{demoCode}</div> : null}

            <button
              onClick={handleSubmit}
              className="w-full rounded-2xl bg-billiards-600 py-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,0.2)] hover:bg-billiards-500"
            >
              {mode === 'login' ? '进入 CueMate' : mode === 'register' ? '注册并进入' : '重置密码'}
            </button>

            <div className="text-xs text-zinc-500 leading-5">
              演示账号：`13800138000 / 123456`
              <br />
              验证码会直接显示在页面中，方便你快速测试真实流程。
            </div>
          </motion.div>
        </div>
      </div>

      <div className="pb-4 text-xs text-zinc-600">
        登录后可在发现页获取定位，查看你附近的球房与陪玩。
      </div>
    </div>
  );
}
