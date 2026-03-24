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
  /**
   * 当 role=companion 时，表示“我”对应的陪玩 ID（用于展示接单/服务界面）
   */
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

export const companions: Companion[] = [
  {
    id: "c1",
    name: "李教练 (Mike)",
    avatar: "https://picsum.photos/seed/mike/200/200",
    level: "职业斯诺克选手",
    hourlyRate: 298,
    rating: 4.9,
    reviewCount: 342,
    tags: ["斯诺克", "耐心教学", "单杆破百"],
    bio: "前职业斯诺克选手，拥有10年教龄。擅长纠正发力动作，走位思路教学。无论你是新手还是想突破瓶颈的进阶玩家，我都能帮你提升。",
    distance: "1.2km",
    images: ["https://picsum.photos/seed/mike1/600/400", "https://picsum.photos/seed/mike2/600/400"]
  },
  {
    id: "c2",
    name: "小雅 (Yaya)",
    avatar: "https://picsum.photos/seed/yaya/200/200",
    level: "中式八球达人",
    hourlyRate: 158,
    rating: 4.8,
    reviewCount: 128,
    tags: ["中式八球", "氛围担当", "高颜值"],
    bio: "热爱中式八球，球风稳健。性格开朗，擅长带动气氛，不仅能陪练，还能让你在轻松愉快的氛围中享受台球的乐趣。",
    distance: "2.5km",
    images: ["https://picsum.photos/seed/yaya1/600/400", "https://picsum.photos/seed/yaya2/600/400"]
  },
  {
    id: "c3",
    name: "张达人 (Alex)",
    avatar: "https://picsum.photos/seed/alex/200/200",
    level: "美式九球高手",
    hourlyRate: 198,
    rating: 4.7,
    reviewCount: 89,
    tags: ["美式九球", "跳球绝技", "实战对抗"],
    bio: "美式九球狂热爱好者，精通各种跳球、加塞技巧。喜欢实战对抗，如果你想体验高强度的比赛节奏，找我准没错。",
    distance: "3.8km",
    images: ["https://picsum.photos/seed/alex1/600/400"]
  }
];

export const mockOrders: Order[] = [
  {
    id: "ord_001",
    companionId: "c2",
    companionName: "小雅 (Yaya)",
    companionAvatar: "https://picsum.photos/seed/yaya/200/200",
    customerId: "u_123",
    customerName: "台球爱好者_007",
    customerAvatar: "https://picsum.photos/seed/user/200/200",
    date: "2023-11-01",
    timeSlots: ["14:00", "15:00"],
    totalPrice: 316,
    venueName: "CueMate 台球俱乐部（望京店）",
    venueAddress: "北京市朝阳区望京SOHO 3号楼",
    note: "想练中袋准度，顺便热热身。",
    createdAt: "2023-10-30T09:00:00.000Z",
    status: "paid"
  },
  {
    id: "ord_002",
    companionId: "c1",
    companionName: "李教练 (Mike)",
    companionAvatar: "https://picsum.photos/seed/mike/200/200",
    customerId: "u_123",
    customerName: "台球爱好者_007",
    customerAvatar: "https://picsum.photos/seed/user/200/200",
    date: "2023-10-28",
    timeSlots: ["19:00"],
    totalPrice: 298,
    venueName: "CueMate 台球俱乐部（望京店）",
    venueAddress: "北京市朝阳区望京SOHO 3号楼",
    note: "主要想修正发力。",
    createdAt: "2023-10-26T13:30:00.000Z",
    status: "completed",
    serviceStartedAt: "2023-10-28T11:00:00.000Z",
    serviceEndedAt: "2023-10-28T12:05:00.000Z",
    customerConfirmedAt: "2023-10-28T12:08:00.000Z",
    customerReview: {
      rating: 5,
      content: "讲得很细，发力问题一下就找到了，打完还会复盘。",
      createdAt: "2023-10-28T12:12:00.000Z",
      tags: ["讲解细致", "很专业", "沟通顺畅"],
      anonymous: false,
      followUp: {
        content: "第二天复练时明显更稳了，建议新手也可以直接约。",
        createdAt: "2023-10-29T09:20:00.000Z",
      },
    }
  },
  {
    id: "ord_003",
    companionId: "c3",
    companionName: "张达人 (Alex)",
    companionAvatar: "https://picsum.photos/seed/alex/200/200",
    customerId: "u_123",
    customerName: "台球爱好者_007",
    customerAvatar: "https://picsum.photos/seed/user/200/200",
    date: "2023-11-05",
    timeSlots: ["20:00", "21:00"],
    totalPrice: 396,
    venueName: "CueMate 台球俱乐部（国贸店）",
    venueAddress: "北京市朝阳区建国路88号",
    note: "想来一场实战对抗。",
    createdAt: "2023-11-03T11:20:00.000Z",
    status: "pending_payment"
  }
];

export const mockUser: UserProfile = {
  id: "u_123",
  name: "台球爱好者_007",
  avatar: "https://picsum.photos/seed/user/200/200",
  phone: "13800138000",
  bio: "正在寻找会讲走位、也会带气氛的台球搭子。",
  gender: "other",
  role: "user",
  isAuthenticated: false,
  balance: 1500.00,
  coupons: 3,
  locationCity: "未开启定位",
  locationLabel: "点击获取你附近的球房与陪玩",
  locationStatus: "idle",
};

export const mockChatThreads: ChatThread[] = [
  {
    id: "thread_c1_u_123",
    companionId: "c1",
    companionName: "李教练 (Mike)",
    companionAvatar: "https://picsum.photos/seed/mike/200/200",
    customerId: "u_123",
    customerName: "台球爱好者_007",
    customerAvatar: "https://picsum.photos/seed/user/200/200",
    orderId: "ord_002",
    appointmentDate: "2023-10-28",
    appointmentSlots: ["19:00"],
    venueName: "CueMate 台球俱乐部（望京店）",
    lastReadAtUser: "2023-10-27T11:06:00.000Z",
    lastReadAtCompanion: "2023-10-27T11:06:00.000Z",
    messages: [
      {
        id: "msg_c1_1",
        sender: "companion",
        type: "text",
        text: "你好，我看了你的备注，这次我会重点帮你看出杆和发力节奏。",
        createdAt: "2023-10-27T10:58:00.000Z"
      },
      {
        id: "msg_c1_2",
        sender: "user",
        type: "text",
        text: "太好了，我最近中杆老飘，辛苦你到时帮我多盯一下。",
        createdAt: "2023-10-27T11:02:00.000Z"
      },
      {
        id: "msg_c1_3",
        sender: "companion",
        type: "text",
        text: "没问题，建议你提前10分钟到店，先热手两杆。",
        createdAt: "2023-10-27T11:06:00.000Z"
      }
    ]
  },
  {
    id: "thread_c2_u_123",
    companionId: "c2",
    companionName: "小雅 (Yaya)",
    companionAvatar: "https://picsum.photos/seed/yaya/200/200",
    customerId: "u_123",
    customerName: "台球爱好者_007",
    customerAvatar: "https://picsum.photos/seed/user/200/200",
    orderId: "ord_001",
    appointmentDate: "2023-11-01",
    appointmentSlots: ["14:00", "15:00"],
    venueName: "CueMate 台球俱乐部（望京店）",
    lastReadAtUser: "2023-10-31T09:40:00.000Z",
    lastReadAtCompanion: "2023-10-31T09:33:00.000Z",
    messages: [
      {
        id: "msg_c2_1",
        sender: "user",
        type: "text",
        text: "我下单啦，明天下午想先练一下翻袋和防守。",
        createdAt: "2023-10-31T09:25:00.000Z"
      },
      {
        id: "msg_c2_2",
        sender: "companion",
        type: "text",
        text: "收到～我给你留了靠窗那张台，氛围比较安静。",
        createdAt: "2023-10-31T09:33:00.000Z"
      },
      {
        id: "msg_c2_3",
        sender: "companion",
        type: "text",
        text: "如果你方便的话，穿运动鞋来会更好发力哦。",
        createdAt: "2023-10-31T09:40:00.000Z"
      }
    ]
  }
];

export const generateMockSchedule = () => {
  const today = new Date();
  const schedule = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    schedule.push({
      date: date.toISOString().split('T')[0],
      slots: [
        { time: "14:00", available: Math.random() > 0.3 },
        { time: "15:00", available: Math.random() > 0.3 },
        { time: "16:00", available: Math.random() > 0.3 },
        { time: "19:00", available: Math.random() > 0.3 },
        { time: "20:00", available: Math.random() > 0.3 },
        { time: "21:00", available: Math.random() > 0.3 },
      ]
    });
  }
  return schedule;
};
