import { motion } from 'motion/react';
import {
  Settings,
  HelpCircle,
  Wallet,
  Ticket,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Star,
  MapPin,
  LocateFixed,
  PencilLine,
  Smartphone,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useUser } from '../context/UserContext';
import Modal from '../components/Modal';
import { useState } from 'react';
import { companions } from '../data/mock';
import { useOrders } from '../context/OrderContext';
import { getCompanionReviews, getReviewSummary, getUserReviews } from '../lib/reviews';

export default function Profile() {
  const { user, charge, resetUser, setRole, logout, requestLocation, updateProfile } = useUser();
  const { orders } = useOrders();
  const [openWallet, setOpenWallet] = useState(false);
  const [openRole, setOpenRole] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [profileName, setProfileName] = useState(user.name);
  const [profileBio, setProfileBio] = useState(user.bio ?? '');
  const [profileGender, setProfileGender] = useState<NonNullable<typeof user.gender>>(user.gender ?? 'other');
  const [profileHint, setProfileHint] = useState('');
  const receivedReviews = user.role === 'companion' && user.companionId
    ? getCompanionReviews(orders, user.companionId)
    : getUserReviews(orders, user.id);
  const reviewSummary = getReviewSummary(receivedReviews);
  const reviewTitle = user.role === 'companion' ? '用户给你的评价' : '陪玩给你的评价';
  const reviewHint = user.role === 'companion' ? '服务专业度、沟通与到店体验' : '守时、沟通与现场配合度';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <header className="shrink-0 px-6 pt-12 pb-6 bg-zinc-950/95 backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-6">我的</h1>

        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-zinc-800"
            />
            <div className="absolute bottom-0 right-0 bg-billiards-500 rounded-full p-1 border-2 border-zinc-950">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
            <div className="text-xs text-zinc-500 font-mono">ID: {user.id}</div>
            <div className="text-xs text-zinc-600 mt-1">{user.phone}</div>
            <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{user.bio}</div>
            <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
              {user.role === 'user' ? '普通用户' : '陪玩身份'}
            </div>
          </div>
          <button
            onClick={() => {
              setProfileName(user.name);
              setProfileBio(user.bio ?? '');
              setProfileGender(user.gender ?? 'other');
              setProfileHint('');
              setOpenEdit(true);
            }}
            className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 pt-6" style={{ scrollbarWidth: 'none' }}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col justify-between"
          >
            <button
              onClick={() => setOpenWallet(true)}
              className="flex items-center text-zinc-400 mb-2 text-left"
            >
              <Wallet className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">钱包余额</span>
            </button>
            <div className="text-2xl font-bold text-white">
              <span className="text-sm font-normal text-zinc-500 mr-1">¥</span>
              {user.balance.toFixed(2)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center text-zinc-400 mb-2">
              <Ticket className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">优惠券</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {user.coupons}
              <span className="text-sm font-normal text-zinc-500 ml-1">张</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center text-zinc-300">
                <MapPin className="w-4 h-4 mr-2 text-billiards-400" />
                <span className="font-medium">当前位置</span>
              </div>
              <div className="text-sm text-white mt-2">{user.locationCity ?? '未开启定位'}</div>
              <div className="text-xs text-zinc-500 mt-1">{user.locationLabel}</div>
            </div>
            <button
              onClick={() => requestLocation()}
              className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300 flex items-center justify-center"
            >
              <LocateFixed className={`w-4 h-4 ${user.locationStatus === 'granted' ? 'text-billiards-400' : ''}`} />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mb-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center text-zinc-300">
                <Star className="w-4 h-4 mr-2 text-gold-400 fill-gold-400" />
                <span className="font-medium">{reviewTitle}</span>
              </div>
              <div className="text-sm text-zinc-500 mt-1">{reviewHint}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">{reviewSummary.count > 0 ? reviewSummary.average : '--'}</div>
              <div className="text-[11px] text-zinc-500">{reviewSummary.count} 条 · 好评率 {reviewSummary.positiveRate}%</div>
            </div>
          </div>

          {reviewSummary.topTags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {reviewSummary.topTags.slice(0, 4).map(item => (
                <span key={item.tag} className="rounded-full border border-billiards-500/20 bg-billiards-500/10 px-3 py-1 text-[11px] text-billiards-300">
                  {item.tag}
                </span>
              ))}
            </div>
          ) : null}

          {receivedReviews.length === 0 ? (
            <div className="mt-4 rounded-xl bg-zinc-950/70 border border-zinc-800 px-3 py-4 text-sm text-zinc-500">
              完成订单后，这里会沉淀对你本人的服务口碑。
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {receivedReviews.slice(0, 2).map(review => (
                <div key={review.orderId} className="rounded-xl bg-zinc-950/70 border border-zinc-800 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-white">{review.displayAuthorName}</div>
                    <div className="flex items-center gap-1 text-gold-400">
                      {Array.from({ length: review.rating }).map((_, idx) => (
                        <Star key={idx} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  {review.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {review.tags.map(tag => (
                        <span key={tag} className="rounded-full bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="text-xs text-zinc-500 mt-2">{review.content}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
          <div className="divide-y divide-zinc-800/50">
            <button
              onClick={() => setOpenRole(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors group"
            >
              <div className="flex items-center text-zinc-300 group-hover:text-white">
                <div className="w-8 h-8 rounded-full bg-billiards-500/10 flex items-center justify-center mr-3">
                  <ShieldCheck className="w-4 h-4 text-billiards-400" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">切换身份（演示）</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    当前：{user.role === 'user' ? '用户端' : '陪玩端'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
            </button>

            <button
              onClick={() => {
                setProfileName(user.name);
                setProfileBio(user.bio ?? '');
                setProfileGender(user.gender ?? 'other');
                setProfileHint('');
                setOpenEdit(true);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors group"
            >
              <div className="flex items-center text-zinc-300 group-hover:text-white">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center mr-3">
                  <PencilLine className="w-4 h-4 text-zinc-300" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">编辑资料</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">昵称、简介、性别偏好</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors group">
              <div className="flex items-center text-zinc-300 group-hover:text-white">
                <div className="w-8 h-8 rounded-full bg-gold-400/10 flex items-center justify-center mr-3">
                  <Star className="w-4 h-4 text-gold-400" />
                </div>
                <span className="font-medium">成为陪玩 / 达人认证</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors group">
              <div className="flex items-center text-zinc-300 group-hover:text-white">
                <div className="w-8 h-8 rounded-full bg-emerald-400/10 flex items-center justify-center mr-3">
                  <Smartphone className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">账号安全</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">支持验证码登录与找回密码</span>
                </div>
              </div>
              <div className="text-[10px] text-zinc-500">{user.lastLoginAt ? '最近已登录' : '未记录'}</div>
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors group">
              <div className="flex items-center text-zinc-300 group-hover:text-white">
                <div className="w-8 h-8 rounded-full bg-blue-400/10 flex items-center justify-center mr-3">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                </div>
                <span className="font-medium">帮助中心与客服</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors group">
              <div className="flex items-center text-zinc-300 group-hover:text-white">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center mr-3">
                  <Settings className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="font-medium">通用设置</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <button
            onClick={logout}
            className="py-4 rounded-2xl border border-zinc-800/50 text-zinc-300 font-medium hover:bg-zinc-900 transition-colors flex items-center justify-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </button>
          <button
            onClick={resetUser}
            className="py-4 rounded-2xl border border-zinc-800/50 text-red-400 font-medium hover:bg-red-400/10 transition-colors"
          >
            重置演示数据
          </button>
        </div>
      </main>

      <BottomNav />

      <Modal open={openWallet} title="钱包" onClose={() => setOpenWallet(false)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-400">当前余额</div>
            <div className="text-lg font-bold text-white">¥{user.balance.toFixed(2)}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[50, 100, 300].map(amount => (
              <button
                key={amount}
                onClick={() => charge(amount)}
                className="py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800"
              >
                充值 ¥{amount}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-zinc-500">
            说明：这是演示用的“钱包充值”，用于体验订单支付流程。
          </div>
        </div>
      </Modal>

      <Modal open={openEdit} title="编辑资料" onClose={() => setOpenEdit(false)}>
        <div className="space-y-4">
          <label className="block">
            <div className="mb-2 text-sm text-zinc-400">昵称</div>
            <input
              value={profileName}
              onChange={event => setProfileName(event.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-sm text-zinc-400">自我介绍</div>
            <textarea
              value={profileBio}
              onChange={event => setProfileBio(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none"
            />
          </label>

          <div className="space-y-2">
            <div className="text-sm text-zinc-400">性别</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'male', label: '男' },
                { id: 'female', label: '女' },
                { id: 'other', label: '保密' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setProfileGender(item.id as NonNullable<typeof user.gender>)}
                  className={`rounded-2xl py-3 text-sm border ${
                    profileGender === item.id
                      ? 'border-billiards-500/40 bg-billiards-500/15 text-white'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {profileHint ? <div className="text-sm text-billiards-300">{profileHint}</div> : null}

          <button
            onClick={() => {
              const result = updateProfile({
                name: profileName,
                bio: profileBio,
                gender: profileGender,
              });
              setProfileHint(result.message ?? '');
              if (result.ok) {
                window.setTimeout(() => setOpenEdit(false), 500);
              }
            }}
            className="w-full py-3 rounded-2xl bg-billiards-600 text-white font-semibold hover:bg-billiards-500"
          >
            保存资料
          </button>
        </div>
      </Modal>

      <Modal open={openRole} title="选择身份" onClose={() => setOpenRole(false)}>
        <div className="space-y-4">
          <button
            onClick={() => {
              setRole('user');
              setOpenRole(false);
            }}
            className={`w-full p-4 rounded-2xl border text-left transition-colors ${
              user.role === 'user'
                ? 'bg-billiards-500/15 border-billiards-500/40'
                : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <div className="text-white font-semibold">用户端</div>
            <div className="text-xs text-zinc-500 mt-1">浏览陪玩、预约下单、支付核销</div>
          </button>

          <div className="text-xs text-zinc-500">陪玩端（选择“我是谁”）</div>
          <div className="space-y-2">
            {companions.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setRole('companion', {
                    companionId: c.id,
                    id: `comp_${c.id}`,
                    name: c.name,
                    avatar: c.avatar,
                  });
                  setOpenRole(false);
                }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  user.role === 'companion' && user.companionId === c.id
                    ? 'bg-billiards-500/15 border-billiards-500/40'
                    : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-xl object-cover" />
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{c.level}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
