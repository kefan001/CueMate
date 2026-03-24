import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, MessageCircleMore, ShieldAlert, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import type { Order } from '../data/mock';
import { useOrders } from '../context/OrderContext';
import { useUser } from '../context/UserContext';
import Modal from '../components/Modal';
import { useChat } from '../context/ChatContext';
import { ORDER_STATUS_META, formatOrderTime, getRefundDescription } from '../lib/orders';
import { USER_REVIEW_TAGS } from '../lib/reviews';

const TABS = ['全部', '待支付', '待服务', '服务中', '待确认', '售后', '已完成'] as const;

export default function Orders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('全部');
  const [payingId, setPayingId] = useState<string | null>(null);
  const [codeOrderId, setCodeOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [followUpOrderId, setFollowUpOrderId] = useState<string | null>(null);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('临时有事，改天再约');
  const [disputeReason, setDisputeReason] = useState('服务和约定不符，希望平台介入处理');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [reviewAnonymous, setReviewAnonymous] = useState(false);
  const [followUpContent, setFollowUpContent] = useState('');

  const { orders, updateOrder } = useOrders();
  const { user, pay, charge } = useUser();
  const { ensureThread } = useChat();

  const payingOrder = useMemo(() => (payingId ? orders.find(o => o.id === payingId) : undefined), [orders, payingId]);
  const codeOrder = useMemo(() => (codeOrderId ? orders.find(o => o.id === codeOrderId) : undefined), [orders, codeOrderId]);
  const cancelOrder = useMemo(() => (cancelOrderId ? orders.find(o => o.id === cancelOrderId) : undefined), [orders, cancelOrderId]);
  const reviewOrder = useMemo(() => (reviewOrderId ? orders.find(o => o.id === reviewOrderId) : undefined), [orders, reviewOrderId]);
  const followUpOrder = useMemo(() => (followUpOrderId ? orders.find(o => o.id === followUpOrderId) : undefined), [orders, followUpOrderId]);
  const disputeOrder = useMemo(() => (disputeOrderId ? orders.find(o => o.id === disputeOrderId) : undefined), [orders, disputeOrderId]);

  const verificationCode = (order: Order) => {
    const seed = order.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 1000000;
    return String(seed).padStart(6, '0');
  };

  const openChat = (order: Order) => {
    const threadId = ensureThread({
      companionId: order.companionId,
      companionName: order.companionName,
      companionAvatar: order.companionAvatar,
      customerId: order.customerId ?? user.id,
      customerName: order.customerName ?? user.name,
      customerAvatar: order.customerAvatar ?? user.avatar,
      orderId: order.id,
      appointmentDate: order.date,
      appointmentSlots: order.timeSlots,
      venueName: order.venueName,
    });
    navigate(`/messages/${threadId}`);
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === '全部') return true;
    if (activeTab === '待支付') return order.status === 'pending_payment';
    if (activeTab === '待服务') return ['paid', 'no_show_companion', 'no_show_user'].includes(order.status);
    if (activeTab === '服务中') return order.status === 'in_progress';
    if (activeTab === '待确认') return order.status === 'awaiting_confirmation';
    if (activeTab === '售后') return ['cancelled', 'refunded', 'disputed', 'no_show_companion', 'no_show_user'].includes(order.status);
    if (activeTab === '已完成') return order.status === 'completed';
    return true;
  });

  const confirmPay = () => {
    if (!payingOrder) return;
    const result = pay(payingOrder.totalPrice);
    if (!result.ok) {
      setError('余额不足，请先充值或更换支付方式');
      return;
    }
    updateOrder(payingOrder.id, {
      status: 'paid',
      refundAmount: undefined,
      refundReason: undefined,
    });
    setPayingId(null);
  };

  const submitCancellation = () => {
    if (!cancelOrder) return;
    const now = new Date().toISOString();
    const patch: Partial<Order> = {
      cancellationReason: cancelReason.trim(),
      cancelledAt: now,
    };

    if (cancelOrder.status === 'paid') {
      charge(cancelOrder.totalPrice);
      patch.status = 'refunded';
      patch.refundAmount = cancelOrder.totalPrice;
      patch.refundReason = cancelReason.trim();
      patch.refundedAt = now;
    } else {
      patch.status = 'cancelled';
    }

    updateOrder(cancelOrder.id, patch);
    setCancelOrderId(null);
  };

  const confirmServiceStart = () => {
    if (!codeOrder) return;
    updateOrder(codeOrder.id, {
      status: 'in_progress',
      serviceStartedAt: new Date().toISOString(),
    });
    setCodeOrderId(null);
  };

  const confirmServiceDone = (order: Order) => {
    updateOrder(order.id, {
      status: 'awaiting_confirmation',
      serviceEndedAt: new Date().toISOString(),
    });
  };

  const confirmCompletion = (order: Order) => {
    updateOrder(order.id, {
      status: 'completed',
      customerConfirmedAt: new Date().toISOString(),
    });
  };

  const markCompanionNoShow = (order: Order) => {
    charge(order.totalPrice);
    updateOrder(order.id, {
      status: 'no_show_companion',
      noShowMarkedAt: new Date().toISOString(),
      noShowMarkedBy: 'user',
      refundAmount: order.totalPrice,
      refundedAt: new Date().toISOString(),
      refundReason: '陪玩未到店，系统全额退款',
    });
  };

  const submitReview = () => {
    if (!reviewOrder) return;
    updateOrder(reviewOrder.id, {
      customerReview: {
        rating: reviewRating,
        content: reviewContent.trim() || '这次服务整体不错，流程顺畅。',
        createdAt: new Date().toISOString(),
        tags: reviewTags,
        anonymous: reviewAnonymous,
      },
      status: 'completed',
    });
    setReviewOrderId(null);
    setReviewRating(5);
    setReviewContent('');
    setReviewTags([]);
    setReviewAnonymous(false);
  };

  const submitFollowUp = () => {
    if (!followUpOrder?.customerReview) return;
    updateOrder(followUpOrder.id, {
      customerReview: {
        ...followUpOrder.customerReview,
        followUp: {
          content: followUpContent.trim() || '补充一句：整体体验比预期更顺。',
          createdAt: new Date().toISOString(),
        },
      },
    });
    setFollowUpOrderId(null);
    setFollowUpContent('');
  };

  const submitDispute = () => {
    if (!disputeOrder) return;
    updateOrder(disputeOrder.id, {
      status: 'disputed',
      dispute: {
        reason: disputeReason.trim(),
        createdAt: new Date().toISOString(),
        status: 'open',
      },
    });
    setDisputeOrderId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <header className="shrink-0 px-6 pt-12 pb-4 bg-zinc-950/95 backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-6">我的订单</h1>

        <div className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap text-sm font-medium transition-colors relative ${
                activeTab === tab ? 'text-white' : 'text-zinc-500'
              }`}
            >
              {tab}
              {activeTab === tab ? (
                <motion.div
                  layoutId="orderTab"
                  className="absolute -bottom-2 left-0 right-0 h-0.5 bg-billiards-500 rounded-full"
                />
              ) : null}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 pt-4" style={{ scrollbarWidth: 'none' }}>
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center text-zinc-500 mt-20">暂无相关订单</div>
          ) : (
            filteredOrders.map((order, index) => {
              const statusInfo = ORDER_STATUS_META[order.status];
              const StatusIcon = statusInfo.icon;
              const refundText = getRefundDescription(order);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4"
                >
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800/50">
                    <span className="text-xs text-zinc-500 font-mono">{order.id}</span>
                    <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-md ${statusInfo.bg} ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </div>
                  </div>

                  <div className="flex gap-4 mb-4">
                    <img
                      src={order.companionAvatar}
                      alt={order.companionName}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">{order.companionName}</h3>
                      <div className="text-sm text-zinc-400">{formatOrderTime(order)}</div>
                      <div className="text-xs text-zinc-500 mt-1">共 {order.timeSlots.length} 小时</div>
                      {order.venueName ? <div className="text-xs text-zinc-500 mt-1 truncate">{order.venueName}</div> : null}
                    </div>
                  </div>

                  {refundText ? <div className="mb-3 rounded-xl bg-zinc-950/70 border border-zinc-800 px-3 py-2 text-xs text-zinc-400">{refundText}</div> : null}
                  {order.dispute ? <div className="mb-3 rounded-xl bg-orange-400/10 border border-orange-400/20 px-3 py-2 text-xs text-orange-200">申诉原因：{order.dispute.reason}</div> : null}
                  {order.customerReview ? (
                    <div className="mb-3 rounded-xl bg-zinc-950/70 border border-zinc-800 px-3 py-2">
                      <div className="flex items-center gap-1 text-gold-400 mb-1">
                        {Array.from({ length: order.customerReview.rating }).map((_, idx) => <Star key={idx} className="w-3 h-3 fill-current" />)}
                      </div>
                      {order.customerReview.tags?.length ? (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {order.customerReview.tags.map(tag => (
                            <span key={tag} className="rounded-full bg-billiards-500/10 border border-billiards-500/20 px-2 py-1 text-[10px] text-billiards-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="text-xs text-zinc-400">{order.customerReview.content}</div>
                      {order.customerReview.followUp ? (
                        <div className="mt-2 rounded-lg bg-zinc-900/80 px-2.5 py-2 text-[11px] text-zinc-400">
                          追评：{order.customerReview.followUp.content}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                    <div className="text-lg font-bold text-white">
                      <span className="text-sm font-normal text-zinc-400 mr-1">合计</span>
                      ¥{order.totalPrice}
                    </div>

                    <div className="flex gap-2 flex-wrap justify-end">
                      {!['cancelled'].includes(order.status) ? (
                        <button
                          onClick={() => openChat(order)}
                          className="px-4 py-1.5 rounded-full text-xs font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex items-center"
                        >
                          <MessageCircleMore className="w-3 h-3 mr-1" />
                          联系陪玩
                        </button>
                      ) : null}

                      {order.status === 'pending_payment' ? (
                        <>
                          <button
                            onClick={() => {
                              setCancelReason('暂时不下单了');
                              setCancelOrderId(order.id);
                            }}
                            className="px-4 py-1.5 rounded-full text-xs font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => {
                              setPayingId(order.id);
                              setError(null);
                            }}
                            className="px-4 py-1.5 rounded-full text-xs font-medium bg-billiards-600 text-white hover:bg-billiards-500"
                          >
                            去支付
                          </button>
                        </>
                      ) : null}

                      {order.status === 'paid' ? (
                        <>
                          <button
                            onClick={() => {
                              setCancelReason('行程有变，需要取消订单');
                              setCancelOrderId(order.id);
                            }}
                            className="px-4 py-1.5 rounded-full text-xs font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          >
                            申请退款
                          </button>
                          <button
                            onClick={() => setCodeOrderId(order.id)}
                            className="px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-800 text-white hover:bg-zinc-700 flex items-center"
                          >
                            出示核销码 <ChevronRight className="w-3 h-3 ml-1" />
                          </button>
                          <button
                            onClick={() => markCompanionNoShow(order)}
                            className="px-4 py-1.5 rounded-full text-xs font-medium border border-red-500/40 text-red-300 hover:bg-red-500/10"
                          >
                            陪玩未到
                          </button>
                        </>
                      ) : null}

                      {order.status === 'in_progress' ? (
                        <>
                          <button
                            onClick={() => setDisputeOrderId(order.id)}
                            className="px-4 py-1.5 rounded-full text-xs font-medium border border-orange-500/30 text-orange-200 hover:bg-orange-500/10 flex items-center"
                          >
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            申请售后
                          </button>
                          <button
                            onClick={() => confirmServiceDone(order)}
                            className="px-4 py-1.5 rounded-full text-xs font-medium bg-billiards-600 text-white hover:bg-billiards-500"
                          >
                            我已结束服务
                          </button>
                        </>
                      ) : null}

                      {order.status === 'awaiting_confirmation' ? (
                        <>
                          <button
                            onClick={() => setDisputeOrderId(order.id)}
                            className="px-4 py-1.5 rounded-full text-xs font-medium border border-orange-500/30 text-orange-200 hover:bg-orange-500/10"
                          >
                            发起申诉
                          </button>
                          <button
                            onClick={() => confirmCompletion(order)}
                            className="px-4 py-1.5 rounded-full text-xs font-medium bg-billiards-600 text-white hover:bg-billiards-500"
                          >
                            确认完成
                          </button>
                        </>
                      ) : null}

                      {order.status === 'completed' && !order.customerReview ? (
                        <button
                          onClick={() => {
                            setReviewOrderId(order.id);
                            setReviewRating(5);
                            setReviewContent('');
                            setReviewTags([]);
                            setReviewAnonymous(false);
                          }}
                          className="px-4 py-1.5 rounded-full text-xs font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                          去评价
                        </button>
                      ) : null}

                      {order.status === 'completed' && order.customerReview && !order.customerReview.followUp ? (
                        <button
                          onClick={() => {
                            setFollowUpOrderId(order.id);
                            setFollowUpContent('');
                          }}
                          className="px-4 py-1.5 rounded-full text-xs font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                          追加评价
                        </button>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      <BottomNav />

      <Modal
        open={!!payingId && !!payingOrder}
        title="确认支付"
        onClose={() => {
          setPayingId(null);
          setError(null);
        }}
      >
        {payingOrder ? (
          <div className="space-y-4">
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-300">{payingOrder.companionName}</div>
                <div className="text-lg font-bold text-white">¥{payingOrder.totalPrice}</div>
              </div>
              <div className="text-xs text-zinc-500 mt-2">{formatOrderTime(payingOrder)}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-zinc-400">钱包余额</div>
              <div className="text-white font-semibold">¥{user.balance.toFixed(2)}</div>
            </div>
            {error ? <div className="text-xs text-red-400">{error}</div> : null}
            <div className="text-xs text-zinc-500">支付后可联系陪玩、到店核销，并在异常时申请退款或申诉。</div>
            <div className="flex gap-3">
              <button onClick={() => setPayingId(null)} className="flex-1 py-3 rounded-2xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900">取消</button>
              <button onClick={confirmPay} className="flex-1 py-3 rounded-2xl bg-billiards-600 text-white font-semibold hover:bg-billiards-500">确认支付</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!cancelOrderId && !!cancelOrder} title="取消 / 退款" onClose={() => setCancelOrderId(null)}>
        {cancelOrder ? (
          <div className="space-y-4">
            <div className="text-sm text-zinc-300">{cancelOrder.status === 'paid' ? '已支付订单将原路退回到钱包余额。' : '未支付订单将直接关闭。'}</div>
            <textarea
              value={cancelReason}
              onChange={event => setCancelReason(event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setCancelOrderId(null)} className="flex-1 py-3 rounded-2xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900">返回</button>
              <button onClick={submitCancellation} className="flex-1 py-3 rounded-2xl bg-red-500/90 text-white font-semibold hover:bg-red-500">确认提交</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!codeOrderId && !!codeOrder} title="核销码" onClose={() => setCodeOrderId(null)}>
        {codeOrder ? (
          <div className="space-y-4">
            <div className="text-xs text-zinc-500">向球房前台出示该核销码，完成验证后即可开始服务。</div>
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 text-center">
              <div className="text-4xl font-mono tracking-[0.5em] text-white">{verificationCode(codeOrder)}</div>
              <div className="text-[10px] text-zinc-500 mt-3">{codeOrder.id}</div>
            </div>
            <button onClick={confirmServiceStart} className="w-full py-3 rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700">我已到店，开始服务</button>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!reviewOrderId && !!reviewOrder} title="服务评价" onClose={() => setReviewOrderId(null)}>
        {reviewOrder ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <button key={index} onClick={() => setReviewRating(index + 1)} className="text-gold-400">
                  <Star className={`w-6 h-6 ${index < reviewRating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewContent}
              onChange={event => setReviewContent(event.target.value)}
              rows={4}
              placeholder="聊聊这次陪练体验、专业度和到店沟通..."
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
            />
            <div>
              <div className="text-xs text-zinc-500 mb-2">快捷标签</div>
              <div className="flex flex-wrap gap-2">
                {USER_REVIEW_TAGS.map(tag => {
                  const active = reviewTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => setReviewTags(prev => active ? prev.filter(item => item !== tag) : [...prev, tag].slice(0, 4))}
                      className={`rounded-full border px-3 py-1.5 text-xs ${
                        active
                          ? 'border-billiards-500/40 bg-billiards-500/10 text-billiards-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={reviewAnonymous}
                onChange={event => setReviewAnonymous(event.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900"
              />
              匿名评价
            </label>
            <button onClick={submitReview} className="w-full py-3 rounded-2xl bg-billiards-600 text-white font-semibold hover:bg-billiards-500">提交评价</button>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!followUpOrderId && !!followUpOrder} title="追加评价" onClose={() => setFollowUpOrderId(null)}>
        {followUpOrder ? (
          <div className="space-y-4">
            <div className="text-sm text-zinc-300">补充这次服务后的真实感受，方便后续用户参考。</div>
            <textarea
              value={followUpContent}
              onChange={event => setFollowUpContent(event.target.value)}
              rows={4}
              placeholder="比如复练效果、后续沟通、是否愿意再次预约..."
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
            />
            <button onClick={submitFollowUp} className="w-full py-3 rounded-2xl bg-zinc-800 text-white font-semibold hover:bg-zinc-700">提交追评</button>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!disputeOrderId && !!disputeOrder} title="发起申诉" onClose={() => setDisputeOrderId(null)}>
        {disputeOrder ? (
          <div className="space-y-4">
            <div className="text-sm text-zinc-300">平台会先冻结该订单，后续可根据聊天与服务记录介入处理。</div>
            <textarea
              value={disputeReason}
              onChange={event => setDisputeReason(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none"
            />
            <button onClick={submitDispute} className="w-full py-3 rounded-2xl bg-orange-500/90 text-white font-semibold hover:bg-orange-500">提交申诉</button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
