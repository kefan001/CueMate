import { AlertCircle, CheckCircle2, Clock, FileWarning, RefreshCcw, TimerOff } from 'lucide-react';
import type { OrderStatus } from '../data/mock';
import {
  ORDER_STATUS_TEXT,
  formatOrderTime,
  getRefundDescription,
  getOrderVerificationCode,
  filterUserOrders,
  filterCompanionOrders,
} from '../../../shared/cuemate-core';

const STATUS_ICONS: Record<OrderStatus, typeof Clock> = {
  pending_payment: AlertCircle,
  paid: Clock,
  in_progress: Clock,
  awaiting_confirmation: CheckCircle2,
  completed: CheckCircle2,
  cancelled: AlertCircle,
  refunded: RefreshCcw,
  disputed: FileWarning,
  no_show_user: TimerOff,
  no_show_companion: TimerOff,
};

export const ORDER_STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    bg: string;
    icon: typeof Clock;
  }
> = {
  pending_payment: { ...ORDER_STATUS_TEXT.pending_payment, icon: STATUS_ICONS.pending_payment },
  paid: { ...ORDER_STATUS_TEXT.paid, icon: STATUS_ICONS.paid },
  in_progress: { ...ORDER_STATUS_TEXT.in_progress, icon: STATUS_ICONS.in_progress },
  awaiting_confirmation: { ...ORDER_STATUS_TEXT.awaiting_confirmation, icon: STATUS_ICONS.awaiting_confirmation },
  completed: { ...ORDER_STATUS_TEXT.completed, icon: STATUS_ICONS.completed },
  cancelled: { ...ORDER_STATUS_TEXT.cancelled, icon: STATUS_ICONS.cancelled },
  refunded: { ...ORDER_STATUS_TEXT.refunded, icon: STATUS_ICONS.refunded },
  disputed: { ...ORDER_STATUS_TEXT.disputed, icon: STATUS_ICONS.disputed },
  no_show_user: { ...ORDER_STATUS_TEXT.no_show_user, icon: STATUS_ICONS.no_show_user },
  no_show_companion: { ...ORDER_STATUS_TEXT.no_show_companion, icon: STATUS_ICONS.no_show_companion },
};

export {
  formatOrderTime,
  getRefundDescription,
  getOrderVerificationCode,
  filterUserOrders,
  filterCompanionOrders,
};
