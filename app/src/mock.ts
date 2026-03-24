export interface NativeCompanion {
  id: string;
  name: string;
  level: string;
  distance: string;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  bio: string;
  tags: string[];
  avatar: string;
}

export interface NativeOrder {
  id: string;
  companionId: string;
  companionName: string;
  date: string;
  timeSlots: string[];
  totalPrice: number;
  status: 'pending_payment' | 'paid' | 'completed' | 'in_progress';
}

export interface NativeThread {
  id: string;
  peerName: string;
  preview: string;
  createdAt: string;
  unreadCount: number;
}

export const nativeCompanions: NativeCompanion[] = [
  {
    id: 'c1',
    name: '李教练 (Mike)',
    level: '职业斯诺克选手',
    distance: '1.2km',
    hourlyRate: 298,
    rating: 4.9,
    reviewCount: 342,
    bio: '擅长发力纠正、走位复盘和新手训练，适合认真提升的人。',
    tags: ['斯诺克', '耐心教学', '单杆破百'],
    avatar: 'https://picsum.photos/seed/mike/200/200',
  },
  {
    id: 'c2',
    name: '小雅 (Yaya)',
    level: '中式八球达人',
    distance: '2.5km',
    hourlyRate: 158,
    rating: 4.8,
    reviewCount: 128,
    bio: '球风稳健，带气氛也带得住节奏，适合轻松局和陪练局。',
    tags: ['中式八球', '氛围担当', '高颜值'],
    avatar: 'https://picsum.photos/seed/yaya/200/200',
  },
];

export const nativeOrders: NativeOrder[] = [
  {
    id: 'ord_001',
    companionId: 'c2',
    companionName: '小雅 (Yaya)',
    date: '2026-03-26',
    timeSlots: ['14:00', '15:00'],
    totalPrice: 316,
    status: 'paid',
  },
  {
    id: 'ord_002',
    companionId: 'c1',
    companionName: '李教练 (Mike)',
    date: '2026-03-21',
    timeSlots: ['19:00'],
    totalPrice: 298,
    status: 'completed',
  },
];

export const nativeThreads: NativeThread[] = [
  {
    id: 'thread_c1_u_123',
    peerName: '李教练 (Mike)',
    preview: '你好，这次我会重点帮你看出杆和发力节奏。',
    createdAt: '03月24日 18:20',
    unreadCount: 2,
  },
  {
    id: 'thread_c2_u_123',
    peerName: '小雅 (Yaya)',
    preview: '我到店后先帮你热手，再看中袋准度。',
    createdAt: '03月23日 20:15',
    unreadCount: 0,
  },
];
