import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { FileWarning, ShieldAlert, Star, TimerOff } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useOrders } from '../context/OrderContext';
import { useUser } from '../context/UserContext';
import { ORDER_STATUS_META, formatOrderTime } from '../lib/orders';
import Modal from '../components/Modal';
import { COMPANION_REVIEW_TAGS } from '../lib/reviews';

const TABS = ['全部', '待服务', '服务中', '待确认', '售后', '已完成'] as const;

export default function CompanionOrders() {
  const { user } = useUser();
  const { orders, updateOrder } = useOrders();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('全部');
  const [noShowId, setNoShowId] = useState<string | null>(null);
  const [disputeId, setDisputeId] = useState<string | null>(null);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [followUpOrderId, setFollowUpOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('用户现场情况和下单说明不一致，希望平台介入。');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [reviewAnonymous, setReviewAnonymous] = useState(false);
  const [followUpContent, setFollowUpContent] = useState('');

  const myOrders = useMemo(() => {
    if (!user.companionId) return [];
    return orders.filter(o => o.companionId === user.companionId);
  }, [orders, user.companionId]);

  const noShowOrder = useMemo(() => myOrders.find(order => order.id === noShowId), [myOrders, noShowId]);
  const disputeOrder = useMemo(() => myOrders.find(order => order.id === disputeId), [myOrders, disputeId]);
  const reviewOrder = useMemo(() => myOrders.find(order => order.id === reviewOrderId), [myOrders, reviewOrderId]);
  const followUpOrder = useMemo(() => myOrders.find(order => order.id === followUpOrderId), [myOrders, followUpOrderId]);

  const filtered = myOrders.filter(order => {
    if (activeTab === '全部') return true;
    if (activeTab === '待服务') return ['paid', 'no_show_user', 'no_show_companion'].includes(order.status);
    if (activeTab === '服务中') return order.status === 'in_progress';
    if (activeTab === '待确认') return order.status === 'awaiting_confirmation';
    if (activeTab === '售后') return ['disputed', 'refunded', 'cancelled'].includes(order.status);
    if (activeTab === '已完成') return order.status === 'completed';
    return true;
  });

  const submitReview = () => {
    if (!reviewOrder) return;
    updateOrder(reviewOrder.id, {
      companionReview: {
        rating: reviewRating,
        content: reviewContent.trim() || '沟通顺畅，准时到店，整体配合度不错。',
        createdAt: new Date().toISOString(),
        tags: reviewTags,
        anonymous: reviewAnonymous,
      },
    });
    setReviewOrderId(null);
    setReviewRating(5);
    setReviewContent('');
    setReviewTags([]);
    setReviewAnonymous(false);
  };

  const submitFollowUp = () => {
    if (!followUpOrder?.companionReview) return;
    updateOrder(followUpOrder.id, {
      companionReview: {
        ...followUpOrder.companionReview,
        followUp: {
          content: followUpContent.trim() || '补充说明：现场整体节奏很顺，值得再次匹配。',
          createdAt: new Date().toISOString(),
        },
      },
    });
    setFollowUpOrderId(null);
    setFollowUpContent('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <header className="shrink-0 px-6 pt-12 pb-4 bg-zinc-950/95 backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-6">我的接单</h1>

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
                  layoutId="companionOrderTab"
                  className="absolute -bottom-2 left-0 right-0 h-0.5 bg-billiards-500 rounded-full"
                />
              ) : null}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 pt-4" style={{ scrollbarWidth: 'none' }}>
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center text-zinc-500 mt-20">暂无相关订单</div>
          ) : (
            filtered.map((order, index) => {
              const statusInfo = ORDER_STATUS_META[order.status];
              const StatusIcon = statusInfo.icon;

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

                  <div className="text-sm text-white font-semibold">{order.customerName ?? '用户'}</div>
                  <div className="text-xs text-zinc-400 mt-1">{formatOrderTime(order)}</div>
                  {order.dispute ? <div className="mt-3 text-xs text-orange-200 rounded-xl bg-orange-400/10 border border-orange-400/20 px-3 py-2">{order.dispute.reason}</div> : null}
                  {order.customerReview ? (
                    <div className="mt-3 rounded-xl bg-zinc-950/80 border border-zinc-800 px-3 py-2">
                      <div className="text-[11px] text-zinc-500 mb-1">用户给你的评价</div>
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
                          用户追评：{order.customerReview.followUp.content}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {order.companionReview ? (
                    <div className="mt-3 rounded-xl bg-billiards-500/8 border border-billiards-500/20 px-3 py-2">
                      <div className="text-[11px] text-zinc-500 mb-1">你给用户的评价</div>
                      <div className="flex items-center gap-1 text-gold-400 mb-1">
                        {Array.from({ length: order.companionReview.rating }).map((_, idx) => <Star key={idx} className="w-3 h-3 fill-current" />)}
                      </div>
                      {order.companionReview.tags?.length ? (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {order.companionReview.tags.map(tag => (
                            <span key={tag} className="rounded-full bg-zinc-900/70 border border-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="text-xs text-zinc-300">{order.companionReview.content}</div>
                      {order.companionReview.followUp ? (
                        <div className="mt-2 rounded-lg bg-zinc-900/80 px-2.5 py-2 text-[11px] text-zinc-400">
                          追评：{order.companionReview.followUp.content}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800/50">
                    <div className="text-lg font-bold text-white">¥{order.totalPrice}</div>

                    <div className="flex gap-2 flex-wrap justify-end">
                      {order.status === 'paid' ? (
                        <>
                          <button
                            onClick={() => updateOrder(order.id, { status: 'in_progress', serviceStartedAt: new Date().toISOString() })}
                            className="px-4 py-2 rounded-full text-xs font-semibold bg-billiards-600 text-white hover:bg-billiards-500"
                          >
                            开始服务
                          </button>
                          <button
                            onClick={() => setNoShowId(order.id)}
                            className="px-4 py-2 rounded-full text-xs font-semibold border border-red-500/40 text-red-300 hover:bg-red-500/10 flex items-center"
                          >
                            <TimerOff className="w-3 h-3 mr-1" />
                            用户未到
                          </button>
                        </>
                      ) : null}

                      {order.status === 'in_progress' ? (
                        <>
                          <button
                            onClick={() => setDisputeId(order.id)}
                            className="px-4 py-2 rounded-full text-xs font-semibold border border-orange-500/30 text-orange-200 hover:bg-orange-500/10 flex items-center"
                          >
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            提交申诉
                          </button>
                          <button
                            onClick={() => updateOrder(order.id, { status: 'awaiting_confirmation', serviceEndedAt: new Date().toISOString() })}
                            className="px-4 py-2 rounded-full text-xs font-semibold bg-zinc-800 text-white hover:bg-zinc-700"
                          >
                            提交完成
                          </button>
                        </>
                      ) : null}

                      {order.status === 'awaiting_confirmation' ? (
                        <div className="px-4 py-2 rounded-full text-xs font-semibold border border-zinc-700 text-zinc-400">
                          等待用户确认
                        </div>
                      ) : null}

                      {order.status === 'completed' && !order.companionReview ? (
                        <button
                          onClick={() => {
                            setReviewOrderId(order.id);
                            setReviewRating(5);
                            setReviewContent('');
                            setReviewTags([]);
                            setReviewAnonymous(false);
                          }}
                          className="px-4 py-2 rounded-full text-xs font-semibold border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                          评价用户
                        </button>
                      ) : null}

                      {order.status === 'completed' && order.companionReview && !order.companionReview.followUp ? (
                        <button
                          onClick={() => {
                            setFollowUpOrderId(order.id);
                            setFollowUpContent('');
                          }}
                          className="px-4 py-2 rounded-full text-xs font-semibold border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                          追加评价
                        </button>
                      ) : null}

                      {order.status === 'disputed' ? (
                        <div className="px-4 py-2 rounded-full text-xs font-semibold border border-orange-500/30 text-orange-200 flex items-center">
                          <FileWarning className="w-3 h-3 mr-1" />
                          平台处理中
                        </div>
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

      <Modal open={!!noShowId && !!noShowOrder} title="标记用户爽约" onClose={() => setNoShowId(null)}>
        {noShowOrder ? (
          <div className="space-y-4">
            <div className="text-sm text-zinc-300">确认后订单将被标记为“用户爽约”，该时段会从正常服务中移除。</div>
            <button
              onClick={() => {
                updateOrder(noShowOrder.id, {
                  status: 'no_show_user',
                  noShowMarkedAt: new Date().toISOString(),
                  noShowMarkedBy: 'companion',
                });
                setNoShowId(null);
              }}
              className="w-full py-3 rounded-2xl bg-red-500/90 text-white font-semibold hover:bg-red-500"
            >
              确认标记
            </button>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!disputeId && !!disputeOrder} title="陪玩端申诉" onClose={() => setDisputeId(null)}>
        {disputeOrder ? (
          <div className="space-y-4">
            <textarea
              value={disputeReason}
              onChange={event => setDisputeReason(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none"
            />
            <button
              onClick={() => {
                updateOrder(disputeOrder.id, {
                  status: 'disputed',
                  dispute: {
                    reason: disputeReason.trim(),
                    createdAt: new Date().toISOString(),
                    status: 'open',
                  },
                });
                setDisputeId(null);
              }}
              className="w-full py-3 rounded-2xl bg-orange-500/90 text-white font-semibold hover:bg-orange-500"
            >
              提交给平台
            </button>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!reviewOrderId && !!reviewOrder} title="评价本次用户" onClose={() => setReviewOrderId(null)}>
        {reviewOrder ? (
          <div className="space-y-4">
            <div className="text-sm text-zinc-300">{reviewOrder.customerName ?? '该用户'} 的服务配合度如何？</div>
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
              placeholder="写下守时、沟通、现场配合度等，方便后续匹配..."
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
            />
            <div>
              <div className="text-xs text-zinc-500 mb-2">快捷标签</div>
              <div className="flex flex-wrap gap-2">
                {COMPANION_REVIEW_TAGS.map(tag => {
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
            <div className="text-sm text-zinc-300">补充这位用户在后续沟通或复约上的表现。</div>
            <textarea
              value={followUpContent}
              onChange={event => setFollowUpContent(event.target.value)}
              rows={4}
              placeholder="比如沟通是否持续顺畅、是否愿意继续合作..."
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
            />
            <button onClick={submitFollowUp} className="w-full py-3 rounded-2xl bg-zinc-800 text-white font-semibold hover:bg-zinc-700">提交追评</button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
