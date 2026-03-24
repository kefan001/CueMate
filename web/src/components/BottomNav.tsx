import { Link, useLocation } from 'react-router-dom';
import { Compass, FileText, User, HandCoins, CalendarRange, MessageCircleMore } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const { user } = useUser();
  const isMessages = path.startsWith('/messages');

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 pb-safe pt-2 px-6 z-50">
      <div className="flex justify-between items-center h-14">
        {user.role === 'user' ? (
          <Link
            to="/discovery"
            className={`flex flex-col items-center gap-1 transition-colors ${
              path === '/discovery' || path === '/' ? 'text-billiards-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Compass className="w-6 h-6" />
            <span className="text-[10px] font-medium">发现</span>
          </Link>
        ) : (
          <Link
            to="/companion"
            className={`flex flex-col items-center gap-1 transition-colors ${
              path === '/companion' ? 'text-billiards-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <HandCoins className="w-6 h-6" />
            <span className="text-[10px] font-medium">接单台</span>
          </Link>
        )}

        <Link
          to="/messages"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isMessages ? 'text-billiards-500' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <MessageCircleMore className="w-6 h-6" />
          <span className="text-[10px] font-medium">聊天</span>
        </Link>

        {user.role === 'user' ? (
          <Link
            to="/orders"
            className={`flex flex-col items-center gap-1 transition-colors ${
              path === '/orders' ? 'text-billiards-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FileText className="w-6 h-6" />
            <span className="text-[10px] font-medium">订单</span>
          </Link>
        ) : (
          <Link
            to="/companion/schedule"
            className={`flex flex-col items-center gap-1 transition-colors ${
              path === '/companion/schedule' ? 'text-billiards-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <CalendarRange className="w-6 h-6" />
            <span className="text-[10px] font-medium">日程</span>
          </Link>
        )}

        <Link 
          to="/profile" 
          className={`flex flex-col items-center gap-1 transition-colors ${
            path === '/profile' ? 'text-billiards-500' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">我的</span>
        </Link>
      </div>
    </nav>
  );
}
