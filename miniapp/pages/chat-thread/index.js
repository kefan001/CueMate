const store = require('../../utils/store');
const { getQuickReplies, formatHourMinute } = require('../../shared/cuemate-core');

Page({
  data: {
    thread: null,
    currentRole: 'user',
    peerName: '',
    peerAvatar: '',
    scheduleText: '',
    quickReplies: [],
    messageItems: [],
    draft: '',
    isRecording: false,
    recordingHint: '',
    playingMessageId: '',
    scrollIntoView: '',
  },

  onLoad(options) {
    this._threadId = options?.threadId || '';
    this._unsub = store.subscribe(() => this.syncData());
    this.initRecorder();
    this.syncData();
  },

  onShow() {
    this.syncData();
    this.scheduleMarkRead();
  },

  onUnload() {
    if (this._unsub) this._unsub();
    if (this._readTimer) clearTimeout(this._readTimer);
    if (this._audioCtx) {
      this._audioCtx.destroy();
      this._audioCtx = null;
    }
  },

  initRecorder() {
    try {
      const recorder = wx.getRecorderManager();
      recorder.onStop(res => {
        const durationSec = Math.max(1, Math.round((res.duration || 2000) / 1000));
        this.setData({
          isRecording: false,
          recordingHint: `语音 ${durationSec}s 已发送`,
        });
        this.sendPayload({
          type: 'voice',
          mediaUrl: res.tempFilePath,
          durationSec,
        });
      });
      recorder.onError(() => {
        // Fallback for simulator when microphone is unavailable
        const durationSec = Math.max(1, Math.round((Date.now() - (this._recordStartAt || Date.now())) / 1000));
        this.setData({
          isRecording: false,
          recordingHint: `语音 ${durationSec}s 已发送（演示）`,
        });
        this.sendPayload({
          type: 'voice',
          mediaUrl: '',
          durationSec,
        });
      });
      this._recorder = recorder;
    } catch (e) {
      this._recorder = null;
    }
  },

  scheduleMarkRead() {
    if (!this._threadId) return;
    if (this._readTimer) clearTimeout(this._readTimer);
    this._readTimer = setTimeout(() => {
      const { user } = store.getState();
      store.markThreadRead(this._threadId, user.role);
    }, 600);
  },

  syncData() {
    const { user, threads } = store.getState();
    const currentRole = user.role;
    const thread = (threads || []).find(item => {
      if (item.id !== this._threadId) return false;
      return currentRole === 'user' ? item.customerId === user.id : item.companionId === user.companionId;
    });

    if (!thread) {
      this.setData({ thread: null, currentRole });
      return;
    }

    const peerName = currentRole === 'user' ? thread.companionName : thread.customerName;
    const peerAvatar = currentRole === 'user' ? thread.companionAvatar : thread.customerAvatar;
    const peerReadAt = currentRole === 'user' ? thread.lastReadAtCompanion : thread.lastReadAtUser;
    const quickReplies = getQuickReplies(currentRole);

    const scheduleText = thread.appointmentDate
      ? `${thread.appointmentDate} ${(thread.appointmentSlots || []).join(', ')}`
      : '尚未绑定预约时间';

    const messageItems = (thread.messages || []).map(msg => {
      const isMine = msg.sender === currentRole;
      const isSystem = msg.sender === 'system';
      const receiptText = isMine ? (peerReadAt && peerReadAt >= msg.createdAt ? '已读' : '已送达') : '';
      return {
        ...msg,
        isMine,
        isSystem,
        timeText: formatHourMinute(msg.createdAt),
        receiptText,
      };
    });

    const lastMsg = messageItems[messageItems.length - 1];
    wx.setNavigationBarTitle({ title: peerName || '会话详情' });

    this.setData({
      thread,
      currentRole,
      peerName,
      peerAvatar,
      scheduleText,
      quickReplies,
      messageItems,
      scrollIntoView: lastMsg ? `msg_${lastMsg.id}` : '',
    });
  },

  onDraftInput(e) {
    this.setData({ draft: e.detail.value });
  },

  sendPayload(payload) {
    const { thread, currentRole } = this.data;
    if (!thread) return;
    const normalizedText = payload.text ? String(payload.text).trim() : '';
    if ((payload.type || 'text') === 'text' && !normalizedText) return;

    store.sendMessage(thread.id, {
      sender: currentRole,
      type: payload.type || 'text',
      text: normalizedText,
      mediaUrl: payload.mediaUrl,
      durationSec: payload.durationSec,
    });
    this.setData({ draft: '' });
  },

  onTapSend() {
    this.sendPayload({ text: this.data.draft, type: 'text' });
  },

  onTapQuickReply(e) {
    const reply = e.currentTarget.dataset.reply;
    this.sendPayload({ text: reply, type: 'text' });
  },

  onSelectImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const file = res.tempFiles?.[0];
        if (!file) return;
        this.sendPayload({
          type: 'image',
          mediaUrl: file.tempFilePath,
          text: '现场球台图片',
        });
      },
      fail: () => {
        // Fallback demo image if cancelled or unsupported in simulator
      },
    });
  },

  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.previewImage({
      current: url,
      urls: [url],
    });
  },

  onToggleRecord() {
    if (this.data.isRecording) {
      if (this._recorder) {
        try {
          this._recorder.stop();
          return;
        } catch (e) {
          // fallback below
        }
      }
      const durationSec = Math.max(1, Math.round((Date.now() - (this._recordStartAt || Date.now())) / 1000));
      this.setData({
        isRecording: false,
        recordingHint: `语音 ${durationSec}s 已发送`,
      });
      this.sendPayload({
        type: 'voice',
        mediaUrl: '',
        durationSec,
      });
      return;
    }

    this._recordStartAt = Date.now();
    this.setData({
      isRecording: true,
      recordingHint: '录音中，再点一次结束并发送',
    });

    if (this._recorder) {
      try {
        this._recorder.start({ format: 'mp3', duration: 60000 });
      } catch (e) {
        // keep simulated recording state until user taps stop
      }
    }
  },

  onPlayVoice(e) {
    const { id, url, duration } = e.currentTarget.dataset;
    if (this.data.playingMessageId === id) {
      if (this._audioCtx) this._audioCtx.stop();
      this.setData({ playingMessageId: '' });
      return;
    }

    this.setData({ playingMessageId: id });
    if (url) {
      if (!this._audioCtx) {
        this._audioCtx = wx.createInnerAudioContext();
        this._audioCtx.onEnded(() => this.setData({ playingMessageId: '' }));
        this._audioCtx.onError(() => this.setData({ playingMessageId: '' }));
      }
      this._audioCtx.src = url;
      this._audioCtx.play();
    } else {
      wx.showToast({ title: `播放语音 ${duration || 2}s`, icon: 'none' });
      setTimeout(() => {
        this.setData({ playingMessageId: '' });
      }, (Number(duration) || 2) * 1000);
    }
  },

  goBackMessages() {
    wx.redirectTo({ url: '/pages/messages/index' });
  },
});
