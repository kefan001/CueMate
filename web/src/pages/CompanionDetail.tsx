import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Star, MapPin, CheckCircle2, Info, Calendar as CalendarIcon, MessageCircleMore } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { companions, generateMockSchedule } from '../data/mock';
import { useOrders } from '../context/OrderContext';
import { useUser } from '../context/UserContext';
import { useChat } from '../context/ChatContext';
import { getCompanionReviews, getReviewSummary } from '../lib/reviews';

export default function CompanionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const companion = companions.find(c => c.id === id);
  const { orders, addOrder } = useOrders();
  const { user } = useUser();
  const { ensureThread } = useChat();
  
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'latest' | 'positive' | 'critical'>('all');

  // Generate 7 days schedule
  const schedule = useMemo(() => generateMockSchedule(), []);
  const dates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(new Date(), i);
      return {
        date,
        dayStr: i === 0 ? '今天' : i === 1 ? '明天' : format(date, 'E', { locale: zhCN }),
        dateStr: format(date, 'MM/dd')
      };
    });
  }, []);

  if (!companion) return <div className="p-6 text-center text-zinc-400">未找到该陪玩</div>;

  const currentDaySlots = schedule[selectedDate].slots;
  const totalPrice = selectedSlots.length * companion.hourlyRate;
  const reviewList = useMemo(() => (companion ? getCompanionReviews(orders, companion.id) : []), [companion, orders]);
  const reviewSummary = useMemo(() => getReviewSummary(reviewList), [reviewList]);
  const visibleReviews = useMemo(() => {
    if (reviewFilter === 'latest') return reviewList.slice(0, 5);
    if (reviewFilter === 'positive') return reviewList.filter(review => review.rating >= 4);
    if (reviewFilter === 'critical') return reviewList.filter(review => review.rating <= 3);
    return reviewList;
  }, [reviewFilter, reviewList]);

  const toggleSlot = (time: string) => {
    setSelectedSlots(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const handleBook = () => {
    if (selectedSlots.length === 0 || !companion) return;

    const selectedDateInfo = dates[selectedDate];
    const orderId = `ord_${Date.now()}`;

    addOrder({
      id: orderId,
      companionId: companion.id,
      companionName: companion.name,
      companionAvatar: companion.avatar,
      customerId: user.id,
      customerName: user.name,
      customerAvatar: user.avatar,
      venueName: 'CueMate 台球俱乐部（望京店）',
      venueAddress: '北京市朝阳区望京SOHO 3号楼',
      note: '希望多给一些走位与发力建议。',
      createdAt: new Date().toISOString(),
      date: format(selectedDateInfo.date, 'yyyy-MM-dd'),
      timeSlots: selectedSlots.sort(),
      totalPrice,
      status: 'pending_payment',
    });

    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      navigate('/orders');
    }, 1500);
  };

  const handleOpenChat = () => {
    if (!companion) return;
    const threadId = ensureThread({
      companionId: companion.id,
      companionName: companion.name,
      companionAvatar: companion.avatar,
      customerId: user.id,
      customerName: user.name,
      customerAvatar: user.avatar,
      appointmentDate: format(dates[selectedDate].date, 'yyyy-MM-dd'),
      appointmentSlots: selectedSlots.length ? selectedSlots : undefined,
      venueName: 'CueMate 台球俱乐部（望京店）',
    });
    navigate(`/messages/${threadId}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32" style={{ scrollbarWidth: 'none' }}>
        {/* Hero Image */}
        <div className="relative h-80">
          <img 
            src={companion.images[0] || companion.avatar} 
            alt={companion.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{companion.name}</h1>
                <p className="text-gold-400 font-medium flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {companion.level}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-zinc-800 overflow-hidden">
                <img src={companion.avatar} alt="avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-8">
          {/* Stats Row */}
          <div className="flex items-center justify-between py-4 border-b border-zinc-800/50">
            <div className="text-center">
              <div className="flex items-center justify-center text-lg font-bold text-white">
                <Star className="w-4 h-4 text-gold-400 fill-gold-400 mr-1" />
                {reviewSummary.count > 0 ? reviewSummary.average : companion.rating}
              </div>
              <div className="text-xs text-zinc-500 mt-1">{reviewSummary.count > 0 ? reviewSummary.count : companion.reviewCount} 条评价</div>
            </div>
            <div className="w-px h-8 bg-zinc-800/50" />
            <div className="text-center">
              <div className="text-lg font-bold text-white">¥{companion.hourlyRate}</div>
              <div className="text-xs text-zinc-500 mt-1">每小时</div>
            </div>
            <div className="w-px h-8 bg-zinc-800/50" />
            <div className="text-center">
              <div className="flex items-center justify-center text-lg font-bold text-white">
                <MapPin className="w-4 h-4 text-zinc-400 mr-1" />
                {companion.distance}
              </div>
              <div className="text-xs text-zinc-500 mt-1">距离</div>
            </div>
          </div>

          {/* Bio & Tags */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">关于我</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {companion.bio}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {companion.tags.map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">用户评价</h3>
              <div className="text-xs text-zinc-500">
                {reviewSummary.count > 0 ? `近 ${reviewSummary.count} 条真实订单评价` : '当前展示历史口碑'}
              </div>
            </div>

            {reviewSummary.count > 0 ? (
              <div className="mb-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-3xl font-bold text-white">{reviewSummary.average}</div>
                    <div className="text-xs text-zinc-500 mt-1">好评率 {reviewSummary.positiveRate}%</div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {reviewSummary.distribution.map(item => (
                      <div key={item.star} className="flex items-center gap-2">
                        <div className="w-7 text-[11px] text-zinc-500">{item.star}星</div>
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gold-400"
                            style={{ width: `${reviewSummary.count ? (item.count / reviewSummary.count) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="w-7 text-right text-[11px] text-zinc-500">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {reviewSummary.topTags.length ? (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {reviewSummary.topTags.map(item => (
                      <span key={item.tag} className="rounded-full border border-billiards-500/20 bg-billiards-500/10 px-3 py-1 text-[11px] text-billiards-300">
                        {item.tag} {item.count}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
              {[
                { key: 'all', label: '全部' },
                { key: 'latest', label: '最新' },
                { key: 'positive', label: '好评' },
                { key: 'critical', label: '待改进' },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setReviewFilter(item.key as typeof reviewFilter)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
                    reviewFilter === item.key
                      ? 'border-billiards-500/40 bg-billiards-500/10 text-billiards-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {visibleReviews.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 px-4 py-5 text-sm text-zinc-500">
                当前筛选下暂无评价内容。
              </div>
            ) : (
              <div className="space-y-3">
                {visibleReviews.slice(0, 5).map(review => (
                  <div key={review.orderId} className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-white">{review.displayAuthorName}</div>
                      <div className="flex items-center gap-1 text-gold-400">
                        {Array.from({ length: review.rating }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">{format(new Date(review.createdAt), 'yyyy.MM.dd', { locale: zhCN })}</div>
                    {review.tags?.length ? (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {review.tags.map(tag => (
                          <span key={tag} className="rounded-full bg-zinc-950 border border-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="text-sm text-zinc-300 mt-3 leading-6">{review.content}</p>
                    {review.followUp ? (
                      <div className="mt-3 rounded-xl bg-zinc-950/80 border border-zinc-800 px-3 py-3">
                        <div className="text-[11px] text-zinc-500">追评</div>
                        <div className="text-sm text-zinc-400 mt-1 leading-6">{review.followUp.content}</div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Panel */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-billiards-500" />
                预约时间
              </h3>
              <span className="text-xs text-zinc-500 flex items-center">
                <Info className="w-3 h-3 mr-1" />
                提前2小时预约
              </span>
            </div>

            {/* Date Selector */}
            <div className="flex gap-3 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
              {dates.map((d, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedDate(i);
                    setSelectedSlots([]); // Reset slots on date change
                  }}
                  className={`flex-shrink-0 w-16 py-3 rounded-2xl border flex flex-col items-center justify-center transition-colors ${
                    selectedDate === i 
                      ? 'bg-billiards-600 border-billiards-500 text-white' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-xs mb-1">{d.dayStr}</span>
                  <span className="text-sm font-bold">{d.dateStr}</span>
                </button>
              ))}
            </div>

            {/* Time Slots */}
            <div className="grid grid-cols-3 gap-3">
              {currentDaySlots.map((slot, i) => {
                const isSelected = selectedSlots.includes(slot.time);
                return (
                  <button
                    key={i}
                    disabled={!slot.available}
                    onClick={() => toggleSlot(slot.time)}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                      !slot.available 
                        ? 'bg-zinc-900/50 border-zinc-800/30 text-zinc-600 cursor-not-allowed'
                        : isSelected
                          ? 'bg-billiards-500/20 border-billiards-500 text-billiards-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {slot.time}
                    {!slot.available && <span className="block text-[10px] mt-0.5 opacity-50">已满</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800/50 p-4 pb-safe">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 mb-0.5">
              {selectedSlots.length > 0 ? `已选 ${selectedSlots.length} 小时` : '请选择时间'}
            </div>
            <div className="text-2xl font-bold text-white flex items-baseline gap-1">
              <span className="text-sm font-normal text-zinc-400">¥</span>
              {totalPrice}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenChat}
              className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-200 flex items-center justify-center hover:bg-zinc-800"
            >
              <MessageCircleMore className="w-5 h-5" />
            </button>
            <button
              disabled={selectedSlots.length === 0 || isBooking}
              onClick={handleBook}
              className={`px-8 py-3.5 rounded-full font-bold text-sm transition-all flex items-center ${
                selectedSlots.length === 0
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-billiards-600 text-white hover:bg-billiards-500 shadow-[0_4px_20px_rgba(16,185,129,0.3)]'
              }`}
            >
              {isBooking ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                '立即预约'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
