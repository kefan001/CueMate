import { useMemo } from 'react';
import { motion } from 'motion/react';
import { CalendarRange, Clock, MapPin } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useOrders } from '../context/OrderContext';
import { useUser } from '../context/UserContext';
import { ORDER_STATUS_META, formatOrderTime } from '../lib/orders';

export default function CompanionSchedule() {
  const { user } = useUser();
  const { orders } = useOrders();

  const myOrders = useMemo(() => {
    if (!user.companionId) return [];
    return orders.filter(o => o.companionId === user.companionId && o.status !== 'cancelled');
  }, [orders, user.companionId]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <header className="shrink-0 px-6 pt-12 pb-4 bg-zinc-950/95 backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">我的日程</h1>
        <div className="flex items-center text-xs text-zinc-500 gap-1">
          <CalendarRange className="w-3 h-3" />
          近期待预约与服务时间一览
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 pt-4" style={{ scrollbarWidth: 'none' }}>
        {myOrders.length === 0 ? (
          <div className="text-center text-zinc-500 mt-20">暂无安排，可以安心挂单接活～</div>
        ) : (
          <div className="space-y-4">
            {myOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-2 gap-3">
                  <div className="text-sm text-white font-semibold">
                    {formatOrderTime(order)}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-md ${ORDER_STATUS_META[order.status].bg} ${ORDER_STATUS_META[order.status].color}`}>
                    {ORDER_STATUS_META[order.status].label}
                  </div>
                </div>
                {order.venueName ? (
                  <div className="flex items-center text-xs text-zinc-400 mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">{order.venueName}</span>
                  </div>
                ) : null}
                {order.note ? (
                  <div className="mt-2 text-xs text-zinc-500 line-clamp-2">
                    备注：{order.note}
                  </div>
                ) : null}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
