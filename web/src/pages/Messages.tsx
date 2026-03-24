import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CalendarClock, ChevronRight, MessageCircleMore } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import BottomNav from '../components/BottomNav';
import { useChat } from '../context/ChatContext';
import { useUser } from '../context/UserContext';

export default function Messages() {
  const { user } = useUser();
  const { threads, connectionState } = useChat();

  const myThreads = useMemo(() => {
    const list = threads.filter(thread =>
      user.role === 'user' ? thread.customerId === user.id : thread.companionId === user.companionId
    );

    return list
      .slice()
      .sort((a, b) => {
        const aTime = a.messages[a.messages.length - 1]?.createdAt ?? '';
        const bTime = b.messages[b.messages.length - 1]?.createdAt ?? '';
        return bTime.localeCompare(aTime);
      });
  }, [threads, user]);

  const unreadCount = (threadId: string) => {
    const thread = myThreads.find(item => item.id === threadId);
    if (!thread) return 0;

    const lastReadAt = user.role === 'user' ? thread.lastReadAtUser : thread.lastReadAtCompanion;
    return thread.messages.filter(message => {
      if (message.sender === 'system' || message.sender === user.role) return false;
      if (!lastReadAt) return true;
      return message.createdAt > lastReadAt;
    }).length;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <header className="shrink-0 px-6 pt-12 pb-5 bg-zinc-950/95 backdrop-blur-xl">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">聊天消息</h1>
            <div className="text-sm text-zinc-500 mt-1">
              {user.role === 'user' ? '预约前先沟通打法和时间细节' : '及时回复用户，提升成单与服务体验'}
            </div>
            <div className="text-[11px] text-zinc-600 mt-2">
              {connectionState === 'connected'
                ? 'WebSocket 实时在线'
                : connectionState === 'connecting'
                  ? '正在连接实时通道...'
                  : '演示实时模式（自动回复 / 多标签同步）'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-billiards-500/10 border border-billiards-500/20 flex items-center justify-center">
            <MessageCircleMore className="w-5 h-5 text-billiards-400" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 pt-4" style={{ scrollbarWidth: 'none' }}>
        {myThreads.length === 0 ? (
          <div className="mt-24 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center mb-4">
              <MessageCircleMore className="w-7 h-7 text-zinc-600" />
            </div>
            <div className="text-white font-semibold">还没有聊天会话</div>
            <div className="text-sm text-zinc-500 mt-2">从陪玩详情页点击“先聊聊”后，消息会出现在这里。</div>
          </div>
        ) : (
          <div className="space-y-4">
            {myThreads.map((thread, index) => {
              const lastMessage = thread.messages[thread.messages.length - 1];
              const peerName = user.role === 'user' ? thread.companionName : thread.customerName;
              const peerAvatar = user.role === 'user' ? thread.companionAvatar : thread.customerAvatar;
              const unread = unreadCount(thread.id);
              const preview =
                lastMessage?.type === 'image'
                  ? '[图片]'
                  : lastMessage?.type === 'voice'
                    ? `[语音 ${lastMessage.durationSec ?? 0}s]`
                    : lastMessage?.text ?? '发起一条新对话吧';

              return (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Link
                    to={`/messages/${thread.id}`}
                    className="block rounded-3xl border border-zinc-800/60 bg-zinc-900/50 p-4 hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className="relative shrink-0">
                        <img src={peerAvatar} alt={peerName} className="w-14 h-14 rounded-2xl object-cover" />
                        {unread > 0 ? (
                          <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {unread > 9 ? '9+' : unread}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{peerName}</div>
                            <div className="text-[11px] text-zinc-500 mt-1">
                              {lastMessage ? format(new Date(lastMessage.createdAt), 'MM月dd日 HH:mm', { locale: zhCN }) : '刚刚'}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                        </div>

                        <div className="text-sm text-zinc-300 mt-3 truncate">
                          {preview}
                        </div>

                        {(thread.appointmentDate || thread.venueName) ? (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-950/80 border border-zinc-800 px-3 py-1.5 text-[11px] text-zinc-400">
                            <CalendarClock className="w-3 h-3 text-billiards-400" />
                            <span className="truncate">
                              {thread.appointmentDate ? `${thread.appointmentDate} ${thread.appointmentSlots?.join(', ') ?? ''}` : thread.venueName}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
