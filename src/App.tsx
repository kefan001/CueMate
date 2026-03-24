import type { ReactElement } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Discovery from "./pages/Discovery";
import CompanionDetail from "./pages/CompanionDetail";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import { OrderProvider as RawOrderProvider } from "./context/OrderContext";
import { UserProvider as RawUserProvider } from "./context/UserContext";
import { useUser } from "./context/UserContext";
import CompanionDashboard from "./pages/CompanionDashboard";
import CompanionOrders from "./pages/CompanionOrders";
import CompanionSchedule from "./pages/CompanionSchedule";
import { ChatProvider as RawChatProvider } from "./context/ChatContext";
import Messages from "./pages/Messages";
import ChatThreadPage from "./pages/ChatThread";
import Auth from "./pages/Auth";

const OrderProvider = RawOrderProvider as any;
const UserProvider = RawUserProvider as any;
const ChatProvider = RawChatProvider as any;

function HomeRedirect() {
  const { user } = useUser();
  if (!user.isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return (
    <Navigate
      to={user.role === "companion" ? "/companion" : "/discovery"}
      replace
    />
  );
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user } = useUser();
  if (!user.isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

export default function App() {
  return (
    <UserProvider>
      <OrderProvider>
        <ChatProvider>
          <Router>
            <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-billiards-500/30">
              <div className="max-w-md mx-auto bg-zinc-950 min-h-screen relative shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
                <Routes>
                  <Route path="/" element={<HomeRedirect />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/discovery" element={<ProtectedRoute><Discovery /></ProtectedRoute>} />
                  <Route path="/companion/:id" element={<ProtectedRoute><CompanionDetail /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                  <Route
                    path="/messages/:threadId"
                    element={<ProtectedRoute><ChatThreadPage /></ProtectedRoute>}
                  />
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                  <Route path="/companion" element={<ProtectedRoute><CompanionDashboard /></ProtectedRoute>} />
                  <Route
                    path="/companion/orders"
                    element={<ProtectedRoute><CompanionOrders /></ProtectedRoute>}
                  />
                  <Route
                    path="/companion/schedule"
                    element={<ProtectedRoute><CompanionSchedule /></ProtectedRoute>}
                  />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </Router>
        </ChatProvider>
      </OrderProvider>
    </UserProvider>
  );
}
