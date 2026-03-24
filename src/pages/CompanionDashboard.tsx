import { useMemo } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, MessageCircleMore, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useOrders } from '../context/OrderContext';
import { useUser } from '../context/UserContext';
import { companions } from '../data/mock';
import { useChat } from '../context/ChatContext';
import { ORDER_STATUS_META, formatOrderTime } from '../lib/orders';

export default function CompanionDashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { orders, updateOrder } = useOrders();
  const { ensureThread } = useChat();

  const me = useMemo(() => companions.find(c => c.id === user.companionId), [user.companionId]);

  const myOrders = useMemo(() => {
    if (!user.companionId) return [];
    return orders.filter(o => o.companionId === user.companionId);
  }, [orders, user.companionId]);

  const incoming = myOrders.filter(o => o.status === 'paid');
  const inProgress = myOrders.filter(o => o.status === 'in_progress');
  const awaitingConfirmation = myOrders.filter(o => o.status === 'awaiting_confirmation');
  const completed = myOrders.filter(o => o.status === 'completed');

  const openChat = (order: (typeof myOrders)[number]) => {
    const threadId = ensureThread({
      companionId: order.companionId,
      companionName: order.companionName,
      companionAvatar: order.companionAvatar,
      customerId: order.customerId ?? 'u_123',
      customerName: order.customerName ?? '台球爱好者_007',
      customerAvatar: order.customerAvatar ?? 'https://picsum.photos/seed/user/200/200',
      orderId: order.id,
      appointmentDate: order.date,
      appointmentSlots: order.timeSlots,
      venueName: order.venueName,
    });
    navigate(`/messages/${threadId}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <header className="shrink-0 px-6 pt-12 pb-4 bg-zinc-950/95 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">接单台</h1>
            <div className="text-sm text-zinc-500 mt-1">
              {me ? `${me.name} · ${me.level}` : '陪玩端（演示）'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500">今日待服务</div>
            <div className="text-2xl font-bold text-white">{incoming.length + inProgress.length + awaitingConfirmation.length}</div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 pt-4" style={{ scrollbarWidth: 'none' }}>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4">
            <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> 待服务
            </div>
            <div className="text-xl font-bold text-white">{incoming.length}</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4">
            <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> 服务中
            </div>
            <div className="text-xl font-bold text-white">{inProgress.length + awaitingConfirmation.length}</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4">
            <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 已完成
            </div>
            <div className="text-xl font-bold text-white">{completed.length}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-zinc-300">待服务订单</div>
          <div className="text-xs text-zinc-500">仅显示已支付订单</div>
        </div>

        <div className="space-y-3">
          {incoming.length === 0 ? (
            <div className="text-center text-zinc-500 mt-16">暂无新订单</div>
          ) : (
            incoming.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-mono text-zinc-500">{order.id}</div>
                  <div className={`text-xs px-2 py-1 rounded-md ${ORDER_STATUS_META[order.status].bg} ${ORDER_STATUS_META[order.status].color}`}>
                    {ORDER_STATUS_META[order.status].label}
                  </div>
                </div>
                <div className="text-sm text-white font-semibold">{order.customerName ?? '用户'}</div>
                <div className="text-xs text-zinc-400 mt-1">{formatOrderTime(order)}</div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-white font-bold">¥{order.totalPrice}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openChat(order)}
                      className="w-10 h-10 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex items-center justify-center"
                    >
                      <MessageCircleMore className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateOrder(order.id, { status: 'in_progress' })}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-billiards-600 text-white hover:bg-billiards-500"
                    >
                      开始服务
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
