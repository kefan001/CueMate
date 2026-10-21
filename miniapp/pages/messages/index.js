const store = require('../../utils/store');
const { formatMonthDayTime } = require('../../shared/cuemate-core');

Page({
  data: {
    user: {},
    connectionState: 'fallback',
    threadCards: [],
  },

  onLoad() {
    this._unsub = store.subscribe(() => this.syncData());
  },

  onShow() {
    if (!store.ensureAuthRedirect()) return;
    this.syncData();
  },

  onUnload() {
    if (this._unsub) this._unsub();
  },

  syncData() {
    const { user, threads, connectionState } = store.getState();
    const myThreads = (threads || [])
      .filter(thread =>
        user.role === 'user' ? thread.customerId === user.id : thread.companionId === user.companionId
      )
      .slice()
      .sort((a, b) => {
        const aTime = a.messages?.[a.messages.length - 1]?.createdAt || '';
        const bTime = b.messages?.[b.messages.length - 1]?.createdAt || '';
        return String(bTime).localeCompare(String(aTime));
      });

    const threadCards = myThreads.map(thread => {
      const lastMessage = thread.messages?.[thread.messages.length - 1];
      const peerName = user.role === 'user' ? thread.companionName : thread.customerName;
      const peerAvatar = user.role === 'user' ? thread.companionAvatar : thread.customerAvatar;
      const lastReadAt = user.role === 'user' ? thread.lastReadAtUser : thread.lastReadAtCompanion;
      const unread = (thread.messages || []).filter(msg => {
        if (msg.sender === 'system' || msg.sender === user.role) return false;
        if (!lastReadAt) return true;
        return msg.createdAt > lastReadAt;
      }).length;

      const preview =
        lastMessage?.type === 'image'
          ? '[图片]'
          : lastMessage?.type === 'voice'
            ? `[语音 ${lastMessage.durationSec || 0}s]`
            : lastMessage?.text || '发起一条新对话吧';

      const scheduleLabel = thread.appointmentDate
        ? `${thread.appointmentDate} ${(thread.appointmentSlots || []).join(', ')}`
        : thread.venueName || '';

      return {
        id: thread.id,
        peerName,
        peerAvatar,
        timeText: lastMessage ? formatMonthDayTime(lastMessage.createdAt) : '刚刚',
        unread,
        unreadText: unread > 9 ? '9+' : String(unread),
        preview,
        scheduleLabel,
      };
    });

    this.setData({ user, connectionState, threadCards });
  },

  onTapThread(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/chat-thread/index?threadId=${id}` });
  },
});
