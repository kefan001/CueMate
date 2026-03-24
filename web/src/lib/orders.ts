import { AlertCircle, CheckCircle2, Clock, FileWarning, RefreshCcw, TimerOff } from 'lucide-react';
import type { Order, OrderStatus } from '../data/mock';

export const ORDER_STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    bg: string;
    icon: typeof Clock;
  }
> = {
  pending_payment: { label: '待支付', color: 'text-gold-400', bg: 'bg-gold-400/10', icon: AlertCircle },
  paid: { label: '待服务', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Clock },
  in_progress: { label: '服务中', color: 'text-billiards-400', bg: 'bg-billiards-400/10', icon: Clock },
  awaiting_confirmation: { label: '待确认', color: 'text-indigo-300', bg: 'bg-indigo-400/10', icon: CheckCircle2 },
  completed: { label: '已完成', color: 'text-zinc-400', bg: 'bg-zinc-400/10', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'text-red-400', bg: 'bg-red-400/10', icon: AlertCircle },
  refunded: { label: '已退款', color: 'text-emerald-300', bg: 'bg-emerald-400/10', icon: RefreshCcw },
  disputed: { label: '申诉中', color: 'text-orange-300', bg: 'bg-orange-400/10', icon: FileWarning },
  no_show_user: { label: '用户爽约', color: 'text-rose-300', bg: 'bg-rose-400/10', icon: TimerOff },
  no_show_companion: { label: '陪玩爽约', color: 'text-red-300', bg: 'bg-red-400/10', icon: TimerOff },
};

export function formatOrderTime(order: Order) {
  return `${order.date} · ${order.timeSlots.join(', ')}`;
}

export function getRefundDescription(order: Order) {
  if (order.status === 'refunded') {
    return `已退回 ¥${order.refundAmount ?? order.totalPrice}`;
  }
  if (order.status === 'cancelled' && order.refundAmount) {
    return `退款处理中 ¥${order.refundAmount}`;
  }
  if (order.status === 'no_show_companion') {
    return `系统将补偿 ¥${order.refundAmount ?? order.totalPrice}`;
  }
  return '';
}
