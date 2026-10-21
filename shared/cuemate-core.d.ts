export interface Companion {
  id: string;
  name: string;
  avatar: string;
  level: string;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  bio: string;
  distance: string;
  images: string[];
}

export interface ReviewRecord {
  rating: number;
  content: string;
  createdAt: string;
  tags?: string[];
  anonymous?: boolean;
  followUp?: {
    content: string;
    createdAt: string;
  };
}

export interface ReviewWithMeta extends ReviewRecord {
  orderId: string;
  targetId: string;
  targetName: string;
  authorId: string;
  authorName: string;
  displayAuthorName: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'disputed'
  | 'no_show_user'
  | 'no_show_companion';

export interface Order {
  id: string;
  companionId: string;
  companionName: string;
  companionAvatar: string;
  customerId?: string;
  customerName?: string;
  customerAvatar?: string;
  date: string;
  timeSlots: string[];
  totalPrice: number;
  venueName?: string;
  venueAddress?: string;
  note?: string;
  createdAt?: string;
  status: OrderStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  serviceStartedAt?: string;
  serviceEndedAt?: string;
  customerConfirmedAt?: string;
  noShowMarkedAt?: string;
  noShowMarkedBy?: 'user' | 'companion';
  customerReview?: ReviewRecord;
  companionReview?: ReviewRecord;
  dispute?: {
    reason: string;
    createdAt: string;
    status: 'open' | 'resolved';
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'companion' | 'system';
  type: 'text' | 'image' | 'voice';
  text?: string;
  mediaUrl?: string;
  durationSec?: number;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  companionId: string;
  companionName: string;
  companionAvatar: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  orderId?: string;
  appointmentDate?: string;
  appointmentSlots?: string[];
  venueName?: string;
  lastReadAtUser?: string;
  lastReadAtCompanion?: string;
  messages: ChatMessage[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  role: 'user' | 'companion';
  isAuthenticated: boolean;
  companionId?: string;
  balance: number;
  coupons: number;
  locationCity?: string;
  locationLabel?: string;
  locationCoords?: {
    latitude: number;
    longitude: number;
  };
  locationStatus?: 'idle' | 'locating' | 'granted' | 'denied' | 'unsupported';
  lastLoginAt?: string;
}

export interface RegisteredAccount {
  id: string;
  name: string;
  phone: string;
  password: string;
  avatar: string;
  bio?: string;
  gender?: UserProfile['gender'];
  createdAt: string;
  lastLoginAt?: string;
}

export type VerificationPurpose = 'login' | 'register' | 'reset_password';

export interface VerificationSession {
  code: string;
  purpose: VerificationPurpose;
  expiresAt: string;
  sentAt: string;
}

export declare const STORAGE_KEYS: {
  USER: string;
  ACCOUNTS: string;
  VERIFICATIONS: string;
  ORDERS: string;
  CHAT: string;
};

export declare const DISCOVERY_TABS: string[];
export declare const USER_ORDER_TABS: readonly ['全部', '待支付', '待服务', '服务中', '待确认', '售后', '已完成'];
export declare const COMPANION_ORDER_TABS: readonly ['全部', '待服务', '服务中', '待确认', '售后', '已完成'];
export declare const USER_REVIEW_TAGS: readonly string[];
export declare const COMPANION_REVIEW_TAGS: readonly string[];

export declare const ORDER_STATUS_TEXT: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    bg: string;
    tone: string;
  }
>;

export declare const companions: Companion[];
export declare const mockOrders: Order[];
export declare const mockUser: UserProfile;
export declare const mockChatThreads: ChatThread[];

export declare function generateMockSchedule(deterministic?: boolean): {
  date: string;
  slots: { time: string; available: boolean }[];
}[];

export declare function getSevenDayDates(): {
  date: Date;
  fullDateStr: string;
  dayStr: string;
  dateStr: string;
}[];

export declare function filterAndSortCompanions(
  list: Companion[],
  options?: {
    activeTab?: string;
    priceMax?: number;
    query?: string;
    sort?: 'smart' | 'price_low' | 'rating_high';
  }
): Companion[];

export declare function normalizeOrder(order: Order & { review?: Order['customerReview'] }): Order;
export declare function formatOrderTime(order: Order): string;
export declare function getRefundDescription(order: Order): string;
export declare function getOrderVerificationCode(order: Order): string;
export declare function filterUserOrders(orders: Order[], activeTab?: string): Order[];
export declare function filterCompanionOrders(orders: Order[], companionId?: string, activeTab?: string): Order[];

export declare function getCompanionReviews(orders: Order[], companionId: string): ReviewWithMeta[];
export declare function getUserReviews(orders: Order[], customerId: string): ReviewWithMeta[];
export declare function getReviewSummary(reviews: ReviewRecord[]): {
  count: number;
  average: number;
  positiveRate: number;
  distribution: { star: number; count: number }[];
  topTags: { tag: string; count: number }[];
};
export declare function filterReviews(
  reviewList: ReviewWithMeta[],
  reviewFilter?: 'all' | 'latest' | 'positive' | 'critical'
): ReviewWithMeta[];

export declare function createAvatar(seed: string): string;
export declare function createDefaultAccount(): RegisteredAccount;
export declare function ensureAccounts(accounts: RegisteredAccount[]): RegisteredAccount[];
export declare function inferLocationLabel(latitude: number, longitude: number): { city: string; label: string };
export declare function isValidPhone(phone: string): boolean;
export declare function generateCode(): string;
export declare function verifyCodeSession(
  verifications: Record<string, VerificationSession>,
  phone: string,
  code: string,
  purpose: VerificationPurpose
): { ok: boolean; message?: string };

export declare function createThreadId(companionId: string, customerId: string): string;
export declare function createMessageId(threadId: string): string;
export declare function sortThreads(threads: ChatThread[]): ChatThread[];
export declare function upsertThread(prev: ChatThread[], thread: ChatThread): ChatThread[];
export declare function updateThread(
  prev: ChatThread[],
  threadId: string,
  updater: (thread: ChatThread) => ChatThread
): ChatThread[];
export declare function replyTextFor(
  thread: ChatThread,
  message: { sender: 'user' | 'companion'; type?: ChatMessage['type']; text?: string }
): string;
export declare function getQuickReplies(role: 'user' | 'companion'): string[];
export declare function formatShortDate(isoStr: string): string;
export declare function formatMonthDayTime(isoStr: string): string;
export declare function formatHourMinute(isoStr: string): string;
