export const STORAGE_KEYS = {
  USER: 'cuemate.user.v3',
  ACCOUNTS: 'cuemate.accounts.v2',
  VERIFICATIONS: 'cuemate.verification.v1',
  ORDERS: 'cuemate.orders.v1',
  CHAT: 'cuemate.chat.v2',
};

export const DISCOVERY_TABS = ['推荐', '附近', '斯诺克', '中式八球', '高颜值', '助教'];

export const USER_ORDER_TABS = ['全部', '待支付', '待服务', '服务中', '待确认', '售后', '已完成'];

export const COMPANION_ORDER_TABS = ['全部', '待服务', '服务中', '待确认', '售后', '已完成'];

export const USER_REVIEW_TAGS = ['讲解细致', '球技专业', '守时靠谱', '沟通顺畅', '氛围轻松', '走位清晰'];

export const COMPANION_REVIEW_TAGS = ['守时到店', '沟通清楚', '配合度高', '礼貌友好', '复购意愿高', '现场稳定'];

export const ORDER_STATUS_TEXT = {
  pending_payment: { label: '待支付', color: 'text-gold-400', bg: 'bg-gold-400/10', tone: 'gold' },
  paid: { label: '待服务', color: 'text-blue-400', bg: 'bg-blue-400/10', tone: 'blue' },
  in_progress: { label: '服务中', color: 'text-billiards-400', bg: 'bg-billiards-400/10', tone: 'billiards' },
  awaiting_confirmation: { label: '待确认', color: 'text-indigo-300', bg: 'bg-indigo-400/10', tone: 'indigo' },
  completed: { label: '已完成', color: 'text-zinc-400', bg: 'bg-zinc-400/10', tone: 'zinc' },
  cancelled: { label: '已取消', color: 'text-red-400', bg: 'bg-red-400/10', tone: 'red' },
  refunded: { label: '已退款', color: 'text-emerald-300', bg: 'bg-emerald-400/10', tone: 'emerald' },
  disputed: { label: '申诉中', color: 'text-orange-300', bg: 'bg-orange-400/10', tone: 'orange' },
  no_show_user: { label: '用户爽约', color: 'text-rose-300', bg: 'bg-rose-400/10', tone: 'rose' },
  no_show_companion: { label: '陪玩爽约', color: 'text-red-300', bg: 'bg-red-400/10', tone: 'red' },
};

export const VENUES = [
  {
    id: 'v_wangjing',
    name: 'CueMate 台球俱乐部（望京店）',
    address: '北京市朝阳区望京SOHO 3号楼 B1层',
    latitude: 39.9968,
    longitude: 116.4808,
  },
  {
    id: 'v_guomao',
    name: 'CueMate 台球俱乐部（国贸店）',
    address: '北京市朝阳区建国路88号 SOHO现代城',
    latitude: 39.9072,
    longitude: 116.4712,
  },
  {
    id: 'v_sanlitun',
    name: 'CueMate 台球俱乐部（三里屯店）',
    address: '北京市朝阳区工体北路8号 三里屯SOHO',
    latitude: 39.9337,
    longitude: 116.4535,
  },
];

export const companions = [
  {
    id: 'c1',
    name: '李教练 (Mike)',
    avatar: 'https://picsum.photos/seed/mike/200/200',
    level: '职业斯诺克选手',
    hourlyRate: 298,
    rating: 4.9,
    reviewCount: 342,
    tags: ['斯诺克', '耐心教学', '单杆破百'],
    bio: '前职业斯诺克选手，拥有10年教龄。擅长纠正发力动作，走位思路教学。无论你是新手还是想突破瓶颈的进阶玩家，我都能帮你提升。',
    distance: '1.2km',
    venueName: 'CueMate 台球俱乐部（望京店）',
    venueAddress: '北京市朝阳区望京SOHO 3号楼 B1层',
    venueLat: 39.9968,
    venueLng: 116.4808,
    onlineStatus: 'online',
    images: ['https://picsum.photos/seed/mike1/600/400', 'https://picsum.photos/seed/mike2/600/400'],
  },
  {
    id: 'c2',
    name: '小雅 (Yaya)',
    avatar: 'https://picsum.photos/seed/yaya/200/200',
    level: '中式八球达人',
    hourlyRate: 158,
    rating: 4.8,
    reviewCount: 128,
    tags: ['中式八球', '氛围担当', '高颜值'],
    bio: '热爱中式八球，球风稳健。性格开朗，擅长带动气氛，不仅能陪练，还能让你在轻松愉快的氛围中享受台球的乐趣。',
    distance: '2.5km',
    venueName: 'CueMate 台球俱乐部（望京店）',
    venueAddress: '北京市朝阳区望京SOHO 3号楼 B1层',
    venueLat: 39.9968,
    venueLng: 116.4808,
    onlineStatus: 'online',
    images: ['https://picsum.photos/seed/yaya1/600/400', 'https://picsum.photos/seed/yaya2/600/400'],
  },
  {
    id: 'c3',
    name: '张达人 (Alex)',
    avatar: 'https://picsum.photos/seed/alex/200/200',
    level: '美式九球高手',
    hourlyRate: 198,
    rating: 4.7,
    reviewCount: 89,
    tags: ['美式九球', '跳球绝技', '实战对抗'],
    bio: '美式九球狂热爱好者，精通各种跳球、加塞技巧。喜欢实战对抗，如果你想体验高强度的比赛节奏，找我准没错。',
    distance: '3.8km',
    venueName: 'CueMate 台球俱乐部（国贸店）',
    venueAddress: '北京市朝阳区建国路88号 SOHO现代城',
    venueLat: 39.9072,
    venueLng: 116.4712,
    onlineStatus: 'online',
    images: ['https://picsum.photos/seed/alex1/600/400'],
  },
];

export const mockOrders = [
  {
    id: 'ord_001',
    companionId: 'c2',
    companionName: '小雅 (Yaya)',
    companionAvatar: 'https://picsum.photos/seed/yaya/200/200',
    customerId: 'u_123',
    customerName: '台球爱好者_007',
    customerAvatar: 'https://picsum.photos/seed/user/200/200',
    date: '2023-11-01',
    timeSlots: ['14:00', '15:00'],
    totalPrice: 316,
    venueName: 'CueMate 台球俱乐部（望京店）',
    venueAddress: '北京市朝阳区望京SOHO 3号楼',
    note: '想练中袋准度，顺便热热身。',
    createdAt: '2023-10-30T09:00:00.000Z',
    status: 'paid',
  },
  {
    id: 'ord_002',
    companionId: 'c1',
    companionName: '李教练 (Mike)',
    companionAvatar: 'https://picsum.photos/seed/mike/200/200',
    customerId: 'u_123',
    customerName: '台球爱好者_007',
    customerAvatar: 'https://picsum.photos/seed/user/200/200',
    date: '2023-10-28',
    timeSlots: ['19:00'],
    totalPrice: 298,
    venueName: 'CueMate 台球俱乐部（望京店）',
    venueAddress: '北京市朝阳区望京SOHO 3号楼',
    note: '主要想修正发力。',
    createdAt: '2023-10-26T13:30:00.000Z',
    status: 'completed',
    serviceStartedAt: '2023-10-28T11:00:00.000Z',
    serviceEndedAt: '2023-10-28T12:05:00.000Z',
    customerConfirmedAt: '2023-10-28T12:08:00.000Z',
    customerReview: {
      rating: 5,
      content: '讲得很细，发力问题一下就找到了，打完还会复盘。',
      createdAt: '2023-10-28T12:12:00.000Z',
      tags: ['讲解细致', '很专业', '沟通顺畅'],
      anonymous: false,
      followUp: {
        content: '第二天复练时明显更稳了，建议新手也可以直接约。',
        createdAt: '2023-10-29T09:20:00.000Z',
      },
    },
  },
  {
    id: 'ord_003',
    companionId: 'c3',
    companionName: '张达人 (Alex)',
    companionAvatar: 'https://picsum.photos/seed/alex/200/200',
    customerId: 'u_123',
    customerName: '台球爱好者_007',
    customerAvatar: 'https://picsum.photos/seed/user/200/200',
    date: '2023-11-05',
    timeSlots: ['20:00', '21:00'],
    totalPrice: 396,
    venueName: 'CueMate 台球俱乐部（国贸店）',
    venueAddress: '北京市朝阳区建国路88号',
    note: '想来一场实战对抗。',
    createdAt: '2023-11-03T11:20:00.000Z',
    status: 'pending_payment',
  },
];

export const mockUser = {
  id: 'u_123',
  name: '台球爱好者_007',
  avatar: 'https://picsum.photos/seed/user/200/200',
  phone: '13800138000',
  bio: '正在寻找会讲走位、也会带气氛的台球搭子。',
  gender: 'other',
  role: 'user',
  isAuthenticated: false,
  balance: 1500.0,
  coupons: 3,
  locationCity: '未开启定位',
  locationLabel: '点击获取你附近的球房与陪玩',
  locationStatus: 'idle',
};

export const mockChatThreads = [
  {
    id: 'thread_c1_u_123',
    companionId: 'c1',
    companionName: '李教练 (Mike)',
    companionAvatar: 'https://picsum.photos/seed/mike/200/200',
    customerId: 'u_123',
    customerName: '台球爱好者_007',
    customerAvatar: 'https://picsum.photos/seed/user/200/200',
    orderId: 'ord_002',
    appointmentDate: '2023-10-28',
    appointmentSlots: ['19:00'],
    venueName: 'CueMate 台球俱乐部（望京店）',
    lastReadAtUser: '2023-10-27T11:06:00.000Z',
    lastReadAtCompanion: '2023-10-27T11:06:00.000Z',
    messages: [
      {
        id: 'msg_c1_1',
        sender: 'companion',
        type: 'text',
        text: '你好，我看了你的备注，这次我会重点帮你看出杆和发力节奏。',
        createdAt: '2023-10-27T10:58:00.000Z',
      },
      {
        id: 'msg_c1_2',
        sender: 'user',
        type: 'text',
        text: '太好了，我最近中杆老飘，辛苦你到时帮我多盯一下.',
        createdAt: '2023-10-27T11:02:00.000Z',
      },
      {
        id: 'msg_c1_3',
        sender: 'companion',
        type: 'text',
        text: '没问题，建议你提前10分钟到店，先热手两杆。',
        createdAt: '2023-10-27T11:06:00.000Z',
      },
    ],
  },
  {
    id: 'thread_c2_u_123',
    companionId: 'c2',
    companionName: '小雅 (Yaya)',
    companionAvatar: 'https://picsum.photos/seed/yaya/200/200',
    customerId: 'u_123',
    customerName: '台球爱好者_007',
    customerAvatar: 'https://picsum.photos/seed/user/200/200',
    orderId: 'ord_001',
    appointmentDate: '2023-11-01',
    appointmentSlots: ['14:00', '15:00'],
    venueName: 'CueMate 台球俱乐部（望京店）',
    lastReadAtUser: '2023-10-31T09:40:00.000Z',
    lastReadAtCompanion: '2023-10-31T09:33:00.000Z',
    messages: [
      {
        id: 'msg_c2_1',
        sender: 'user',
        type: 'text',
        text: '我下单啦，明天下午想先练一下翻袋和防守。',
        createdAt: '2023-10-31T09:25:00.000Z',
      },
      {
        id: 'msg_c2_2',
        sender: 'companion',
        type: 'text',
        text: '收到～我给你留了靠窗那张台，氛围比较安静。',
        createdAt: '2023-10-31T09:33:00.000Z',
      },
      {
        id: 'msg_c2_3',
        sender: 'companion',
        type: 'text',
        text: '如果你方便的话，穿运动鞋来会更好发力哦。',
        createdAt: '2023-10-31T09:40:00.000Z',
      },
    ],
  },
];

export function generateMockSchedule(deterministic = false) {
  const today = new Date();
  const schedule = [];
  const baseTimes = ['14:00', '15:00', '16:00', '19:00', '20:00', '21:00'];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    schedule.push({
      date: date.toISOString().split('T')[0],
      slots: baseTimes.map((time, idx) => ({
        time,
        available: deterministic ? (i + idx) % 4 !== 1 : Math.random() > 0.3,
      })),
    });
  }
  return schedule;
}

export function getSevenDayDates() {
  const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const today = new Date();
  return Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return {
      date,
      fullDateStr: `${yyyy}-${mm}-${dd}`,
      dayStr: i === 0 ? '今天' : i === 1 ? '明天' : weekNames[date.getDay()],
      dateStr: `${mm}/${dd}`,
    };
  });
}

// ==================== Discovery Helpers ====================

export function filterAndSortCompanions(list, { activeTab = '推荐', priceMax = 500, query = '', sort = 'smart' } = {}) {
  const parseDistance = d => {
    const n = Number(String(d).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 999;
  };

  const q = String(query || '').trim().toLowerCase();
  let data = (list || companions).slice();

  if (activeTab === '附近') {
    data.sort((a, b) => parseDistance(a.distance) - parseDistance(b.distance));
  } else if (activeTab !== '推荐') {
    data = data.filter(c => {
      const hay = `${c.name} ${c.level} ${(c.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(activeTab.toLowerCase());
    });
  }

  data = data.filter(c => c.hourlyRate <= priceMax);

  if (q) {
    data = data.filter(c => {
      const hay = `${c.name} ${c.level} ${(c.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (sort === 'price_low') {
    data.sort((a, b) => a.hourlyRate - b.hourlyRate);
  } else if (sort === 'rating_high') {
    data.sort((a, b) => b.rating - a.rating);
  } else if (activeTab === '推荐') {
    data.sort((a, b) => b.rating * 10 + b.reviewCount - (a.rating * 10 + a.reviewCount));
  }

  return data;
}

// ==================== Order Helpers ====================

export function normalizeOrder(order) {
  if (!order) return order;
  if (order.customerReview || !order.review) {
    return order;
  }
  return {
    ...order,
    customerReview: order.review,
  };
}

export function formatOrderTime(order) {
  return `${order.date} · ${(order.timeSlots || []).join(', ')}`;
}

export function getRefundDescription(order) {
  if (order.status === 'refunded') {
    return `已退回 ¥${order.refundAmount ?? order.totalPrice}`;
  }
  if (order.status === 'cancelled' && order.refundAmount) {
    return `退款处理中 ¥${order.refundAmount}`;
  }
  if (order.status === 'no_show_companion') {
    return `系统将补偿 ¥${order.refundAmount ?? order.totalPrice}`;
  }
  return '';
}

export function getOrderVerificationCode(order) {
  const seed = String(order.id || '')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 1000000;
  return String(seed).padStart(6, '0');
}

export function filterUserOrders(orders, activeTab = '全部') {
  return (orders || []).filter(order => {
    if (activeTab === '全部') return true;
    if (activeTab === '待支付') return order.status === 'pending_payment';
    if (activeTab === '待服务') return ['paid', 'no_show_companion', 'no_show_user'].includes(order.status);
    if (activeTab === '服务中') return order.status === 'in_progress';
    if (activeTab === '待确认') return order.status === 'awaiting_confirmation';
    if (activeTab === '售后') return ['cancelled', 'refunded', 'disputed', 'no_show_companion', 'no_show_user'].includes(order.status);
    if (activeTab === '已完成') return order.status === 'completed';
    return true;
  });
}

export function filterCompanionOrders(orders, companionId, activeTab = '全部') {
  if (!companionId) return [];
  const myOrders = (orders || []).filter(o => o.companionId === companionId);
  return myOrders.filter(order => {
    if (activeTab === '全部') return true;
    if (activeTab === '待服务') return ['paid', 'no_show_user', 'no_show_companion'].includes(order.status);
    if (activeTab === '服务中') return order.status === 'in_progress';
    if (activeTab === '待确认') return order.status === 'awaiting_confirmation';
    if (activeTab === '售后') return ['disputed', 'refunded', 'cancelled'].includes(order.status);
    if (activeTab === '已完成') return order.status === 'completed';
    return true;
  });
}

// ==================== Review Helpers ====================

export function getCompanionReviews(orders, companionId) {
  return (orders || [])
    .filter(order => order.companionId === companionId && order.customerReview)
    .map(order => ({
      ...order.customerReview,
      orderId: order.id,
      targetId: order.companionId,
      targetName: order.companionName,
      authorId: order.customerId ?? 'unknown_user',
      authorName: order.customerName ?? '匿名用户',
      displayAuthorName: order.customerReview?.anonymous ? '匿名用户' : order.customerName ?? '匿名用户',
    }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function getUserReviews(orders, customerId) {
  return (orders || [])
    .filter(order => order.customerId === customerId && order.companionReview)
    .map(order => ({
      ...order.companionReview,
      orderId: order.id,
      targetId: order.customerId ?? customerId,
      targetName: order.customerName ?? '该用户',
      authorId: order.companionId,
      authorName: order.companionName,
      displayAuthorName: order.companionReview?.anonymous ? '匿名陪玩' : order.companionName,
    }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function getReviewSummary(reviews) {
  const list = reviews || [];
  const count = list.length;
  const average = count ? list.reduce((sum, review) => sum + review.rating, 0) / count : 0;
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: list.filter(review => review.rating === star).length,
  }));
  const positiveCount = list.filter(review => review.rating >= 4).length;
  const tagCounter = new Map();

  list.forEach(review => {
    (review.tags || []).forEach(tag => {
      tagCounter.set(tag, (tagCounter.get(tag) ?? 0) + 1);
    });
  });

  const topTags = Array.from(tagCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, tagCount]) => ({ tag, count: tagCount }));

  return {
    count,
    average: count ? Number(average.toFixed(1)) : 0,
    positiveRate: count ? Math.round((positiveCount / count) * 100) : 0,
    distribution,
    topTags,
  };
}

export function filterReviews(reviewList, reviewFilter = 'all') {
  const list = reviewList || [];
  if (reviewFilter === 'latest') return list.slice(0, 5);
  if (reviewFilter === 'positive') return list.filter(review => review.rating >= 4);
  if (reviewFilter === 'critical') return list.filter(review => review.rating <= 3);
  return list;
}

// ==================== User & Auth Helpers ====================

export function createAvatar(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/200/200`;
}

export function createDefaultAccount() {
  return {
    id: mockUser.id,
    name: mockUser.name,
    phone: mockUser.phone,
    password: '123456',
    avatar: mockUser.avatar,
    bio: mockUser.bio,
    gender: mockUser.gender,
    createdAt: new Date().toISOString(),
  };
}

export function ensureAccounts(accounts) {
  const fallback = [createDefaultAccount()];
  const list = Array.isArray(accounts) && accounts.length ? accounts : fallback;
  if (!list.some(account => account.phone === mockUser.phone)) {
    return [...list, fallback[0]];
  }
  return list;
}

export function inferLocationLabel(latitude, longitude) {
  if (latitude > 39 && latitude < 41 && longitude > 115 && longitude < 118) {
    return {
      city: '北京市朝阳区',
      label: '北京市朝阳区 · 已获取附近定位',
    };
  }

  if (latitude > 30 && latitude < 32 && longitude > 120 && longitude < 122) {
    return {
      city: '上海市浦东新区',
      label: '上海市浦东新区 · 已获取附近定位',
    };
  }

  if (latitude > 22 && latitude < 24 && longitude > 112 && longitude < 115) {
    return {
      city: '广州市天河区',
      label: '广州市天河区 · 已获取附近定位',
    };
  }

  return {
    city: '已获取当前位置',
    label: `纬度 ${Number(latitude).toFixed(3)} / 经度 ${Number(longitude).toFixed(3)}`,
  };
}

export function isValidPhone(phone) {
  return /^1\d{10}$/.test(String(phone || '').trim());
}

export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function verifyCodeSession(verifications, phone, code, purpose) {
  const session = (verifications || {})[String(phone || '').trim()];
  if (!session) return { ok: false, message: '请先获取验证码' };
  if (session.purpose !== purpose) return { ok: false, message: '验证码用途不匹配，请重新获取' };
  if (new Date(session.expiresAt).getTime() < Date.now()) return { ok: false, message: '验证码已过期，请重新获取' };
  if (session.code !== String(code || '').trim()) return { ok: false, message: '验证码不正确' };
  return { ok: true };
}

// ==================== Chat Helpers ====================

export function createThreadId(companionId, customerId) {
  return `thread_${companionId}_${customerId}`;
}

export function createMessageId(threadId) {
  return `${threadId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function sortThreads(threads) {
  return (threads || [])
    .slice()
    .sort((a, b) => {
      const aTime = a.messages?.[a.messages.length - 1]?.createdAt ?? '';
      const bTime = b.messages?.[b.messages.length - 1]?.createdAt ?? '';
      return String(bTime).localeCompare(String(aTime));
    });
}

export function upsertThread(prev, thread) {
  const list = prev || [];
  const exists = list.some(item => item.id === thread.id);
  return sortThreads(exists ? list.map(item => (item.id === thread.id ? thread : item)) : [thread, ...list]);
}

export function updateThread(prev, threadId, updater) {
  return sortThreads((prev || []).map(thread => (thread.id === threadId ? updater(thread) : thread)));
}

export function replyTextFor(thread, message) {
  const text = message.text?.trim() ?? '';

  if (message.type === 'image') {
    return message.sender === 'user'
      ? '我看到了图片，现场我可以按这个状态帮你调整。'
      : '收到图片啦，我大概明白这次想练的内容了。';
  }

  if (message.type === 'voice') {
    return message.sender === 'user'
      ? '语音我收到了，重点我记下了，到店后我们直接开练。'
      : '我听完语音了，等你到店我们直接按这个思路来。';
  }

  if (/几点|时间|到店/.test(text)) {
    return '按当前预约时间到店就可以，提前 10 分钟会更从容。';
  }
  if (/走位|发力|准度|翻袋|防守/.test(text)) {
    return '明白，这部分我会优先带你练，先热手再针对性拆动作。';
  }
  if (/谢谢|辛苦|收到/.test(text)) {
    return '没事，我们到时见，有变动随时在这里说。';
  }

  return message.sender === 'user'
    ? `收到，你这次的需求我已经记下了，${thread.appointmentDate ?? '到店'}我们直接衔接。`
    : '好的，有任何变动你直接在这里找我就行。';
}

export function getQuickReplies(role) {
  return role === 'user'
    ? ['我大概提前10分钟到', '这次想重点练走位', '可以帮我留靠边的台吗？']
    : ['收到，我来安排', '你到店后直接联系我', '建议提前热手 5 分钟'];
}

export function formatShortDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return String(isoStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export function formatMonthDayTime(isoStr) {
  if (!isoStr) return '刚刚';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return '刚刚';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}月${dd}日 ${hh}:${min}`;
}

export function formatHourMinute(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

// ==================== Commercial & Compliance Helpers ====================

export const ACTIVE_LOCK_STATUSES = [
  'pending_payment',
  'paid',
  'in_progress',
  'awaiting_confirmation',
];

export function resolveVenueCoords(venueName, venueAddress) {
  const matched = VENUES.find(
    v => v.name === venueName || (venueName && v.name.includes(venueName))
  );
  if (matched) {
    return {
      name: matched.name,
      address: venueAddress || matched.address,
      latitude: matched.latitude,
      longitude: matched.longitude,
    };
  }
  return {
    name: venueName || 'CueMate 合作台球厅',
    address: venueAddress || '北京市朝阳区望京SOHO 3号楼',
    latitude: 39.9968,
    longitude: 116.4808,
  };
}

export function getLockedSlotsForCompanion(orders, companionId, dateStr, excludeOrderId = '') {
  const locked = new Set();
  (orders || []).forEach(order => {
    if (!order || order.id === excludeOrderId) return;
    if (order.companionId !== companionId) return;
    if (order.date !== dateStr) return;
    if (!ACTIVE_LOCK_STATUSES.includes(order.status)) return;
    (order.timeSlots || []).forEach(slot => locked.add(slot));
  });
  return locked;
}

export const SENSITIVE_WORDS = [
  '赌球',
  '赌博',
  '外围',
  '盘口',
  '博彩',
  '洗钱',
  '刷单',
  '裸聊',
  '色情',
  '援交',
  '毒品',
];

export function checkContentSecurity(text) {
  const raw = String(text || '').trim();
  if (!raw) return { ok: true };
  for (const word of SENSITIVE_WORDS) {
    if (raw.includes(word)) {
      return {
        ok: false,
        word,
        message: `内容包含违规敏感词「${word}」，已被微信内容安全接口（msgSecCheck）拦截`,
      };
    }
  }
  return { ok: true };
}

export const SUBSCRIBE_TEMPLATES = {
  ORDER_PAID: 'tmpl_cuemate_order_paid_01',
  SERVICE_STARTED: 'tmpl_cuemate_service_start_02',
  NEW_MESSAGE: 'tmpl_cuemate_new_msg_03',
};

export const COMPLIANCE_DOCS = {
  agreement: {
    title: 'CueMate 用户服务协议',
    content:
      '1. 本平台提供正规绿色台球运动助教、技术指导及同城球房预约服务。\n' +
      '2. 仅限年满 18 周岁的完全民事行为能力人注册并预约线下台球陪练服务。\n' +
      '3. 严禁利用本平台开展任何形式的赌球、博彩、违规场外交易或违法违纪活动。\n' +
      '4. 订单资金由平台担保结算，服务开始前按规则支持改期或取消，发生争议可提交平台仲裁。',
  },
  privacy: {
    title: 'CueMate 隐私保护指引',
    content:
      '1. 位置信息（wx.getLocation / wx.openLocation）：仅用于展示附近台球厅距离及导航，不会在后台持续追踪。\n' +
      '2. 相册与摄像头（wx.chooseMedia）：仅用于发送订单沟通图片或上传个人头像/达人认证照片。\n' +
      '3. 麦克风权限（wx.getRecorderManager）：仅用于在会话页按住发送语音沟通消息。\n' +
      '4. 手机号授权（getPhoneNumber）：仅用于实名账号绑定与订单履约联系。',
  },
  safety: {
    title: '绿色健康约球安全须知',
    content:
      '• 请在平台认证的公开正规台球俱乐部/球房内开展练球与教学活动。\n' +
      '• 严禁任何形式的打彩、赌球及私下违规转账交易，保障自身资金与人身安全。\n' +
      '• 到店后请核对订单 6 位服务验证码，完成后在小程序内确认核销。',
  },
};

