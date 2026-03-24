import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, ImagePlus, MapPin, Mic, SendHorizonal, Sparkles, Square, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useChat } from '../context/ChatContext';
import { useUser } from '../context/UserContext';

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatThreadPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);

  const { user } = useUser();
  const { threads, sendMessage, markThreadRead, connectionState } = useChat();
  const [draft, setDraft] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingHint, setRecordingHint] = useState<string | null>(null);

  const currentRole = user.role;
  const thread = useMemo(
    () =>
      threads.find(item => {
        if (item.id !== threadId) return false;
        return currentRole === 'user' ? item.customerId === user.id : item.companionId === user.companionId;
      }),
    [currentRole, threadId, threads, user.companionId, user.id]
  );

  useEffect(() => {
    if (!thread) return;
    const timer = window.setTimeout(() => {
      markThreadRead(thread.id, currentRole);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [currentRole, markThreadRead, thread]);

  if (!thread) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-lg font-semibold text-white">会话不存在</div>
        <div className="text-sm text-zinc-500 mt-2">可能是身份切换后不再属于当前账号。</div>
        <button
          onClick={() => navigate('/messages')}
          className="mt-6 px-5 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white"
        >
          返回消息列表
        </button>
      </div>
    );
  }

  const peerName = currentRole === 'user' ? thread.companionName : thread.customerName;
  const peerAvatar = currentRole === 'user' ? thread.companionAvatar : thread.customerAvatar;
  const peerReadAt = currentRole === 'user' ? thread.lastReadAtCompanion : thread.lastReadAtUser;
  const quickReplies = currentRole === 'user'
    ? ['我大概提前10分钟到', '这次想重点练走位', '可以帮我留靠边的台吗？']
    : ['收到，我来安排', '你到店后直接联系我', '建议提前热手 5 分钟'];

  const handleSend = (payload: { text?: string; type?: 'text' | 'image' | 'voice'; mediaUrl?: string; durationSec?: number }) => {
    const normalizedText = payload.text?.trim();
    if ((payload.type ?? 'text') === 'text' && !normalizedText) return;

    sendMessage(thread.id, {
      sender: currentRole,
      type: payload.type ?? 'text',
      text: normalizedText,
      mediaUrl: payload.mediaUrl,
      durationSec: payload.durationSec,
    });
    setDraft('');
  };

  const handleSelectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    handleSend({ type: 'image', mediaUrl: dataUrl, text: file.name });
    event.target.value = '';
  };

  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingHint('当前浏览器环境不支持语音录制');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordChunksRef.current = [];
      recordStartRef.current = Date.now();

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          recordChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const durationSec = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000));
        const blob = new Blob(recordChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const dataUrl = await fileToDataUrl(blob);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingHint(`语音 ${durationSec}s 已发送`);
        handleSend({ type: 'voice', mediaUrl: dataUrl, durationSec });
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingHint('录音中，再点一次结束');
      setIsRecording(true);
    } catch {
      setRecordingHint('未获得麦克风权限，暂时无法录音');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden relative">
      <header className="shrink-0 pt-12 px-4 pb-4 border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <img src={peerAvatar} alt={peerName} className="w-11 h-11 rounded-2xl object-cover" />

          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-white truncate">{peerName}</div>
            <div className="text-xs text-zinc-500 truncate">
              {connectionState === 'connected' ? '实时在线' : '演示实时模式'}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-6 bg-[radial-gradient(circle_at_top,#0f3a2f_0%,#09090b_38%,#09090b_100%)]" style={{ scrollbarWidth: 'none' }}>
        <div className="rounded-3xl border border-billiards-500/15 bg-black/25 backdrop-blur-md p-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">本次服务沟通卡</div>
              <div className="text-xs text-zinc-400 mt-1">
                {thread.appointmentDate ? `${thread.appointmentDate} ${thread.appointmentSlots?.join(', ') ?? ''}` : '尚未绑定预约时间'}
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
          </div>
          {thread.venueName ? (
            <div className="mt-3 flex items-center text-xs text-zinc-400">
              <MapPin className="w-3 h-3 mr-1 text-billiards-400" />
              <span className="truncate">{thread.venueName}</span>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {thread.messages.map(message => {
            const isMine = message.sender === currentRole;
            const isSystem = message.sender === 'system';
            const receiptText = isMine ? (peerReadAt && peerReadAt >= message.createdAt ? '已读' : '已送达') : '';

            if (isSystem) {
              return (
                <div key={message.id} className="text-center">
                  <span className="inline-flex rounded-full bg-zinc-900/80 border border-zinc-800 px-3 py-1 text-[11px] text-zinc-500">
                    {message.text}
                  </span>
                </div>
              );
            }

            return (
              <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-lg ${
                    isMine
                      ? 'bg-billiards-600 text-white rounded-br-lg'
                      : 'bg-zinc-900/90 border border-zinc-800 text-zinc-100 rounded-bl-lg'
                  }`}
                >
                  {message.type === 'image' ? (
                    <div className="space-y-2">
                      <img src={message.mediaUrl} alt={message.text ?? '聊天图片'} className="w-full rounded-2xl object-cover" />
                      {message.text ? <div className="text-xs text-white/80">{message.text}</div> : null}
                    </div>
                  ) : null}

                  {message.type === 'voice' ? (
                    <div className="space-y-2 min-w-44">
                      <div className="flex items-center gap-2 text-sm">
                        <Volume2 className="w-4 h-4" />
                        <span>语音消息</span>
                        <span className="text-xs opacity-70">{message.durationSec ?? 0}s</span>
                      </div>
                      {message.mediaUrl ? (
                        <audio controls className="w-full h-10">
                          <source src={message.mediaUrl} />
                        </audio>
                      ) : null}
                    </div>
                  ) : null}

                  {message.type === 'text' && message.text ? (
                    <div className="text-sm leading-6">{message.text}</div>
                  ) : null}

                  <div className={`text-[10px] mt-2 flex items-center justify-between gap-3 ${isMine ? 'text-white/70' : 'text-zinc-500'}`}>
                    <span>{format(new Date(message.createdAt), 'HH:mm', { locale: zhCN })}</span>
                    {receiptText ? <span>{receiptText}</span> : null}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </main>

      <div className="shrink-0 border-t border-zinc-800/60 bg-zinc-950/95 backdrop-blur-xl px-4 pt-3 pb-5">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
          {quickReplies.map(reply => (
            <button
              key={reply}
              onClick={() => handleSend({ text: reply })}
              className="shrink-0 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-billiards-500/40 hover:text-white"
            >
              {reply}
            </button>
          ))}
        </div>

        {recordingHint ? <div className="text-[11px] text-zinc-500 mb-2">{recordingHint}</div> : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSelectImage}
        />

        <div className="flex items-end gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 flex items-center justify-center hover:bg-zinc-800"
          >
            <ImagePlus className="w-5 h-5" />
          </button>

          <button
            onClick={handleRecord}
            className={`w-12 h-12 rounded-full border flex items-center justify-center ${
              isRecording
                ? 'border-rose-500 bg-rose-500/15 text-rose-300'
                : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
          </button>

          <div className="flex-1 rounded-3xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <textarea
              value={draft}
              onChange={event => setDraft(event.target.value)}
              placeholder={currentRole === 'user' ? '先和陪玩确认打法、到店时间...' : '回复用户的时间安排或服务建议...'}
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />
          </div>

          <button
            onClick={() => handleSend({ text: draft })}
            disabled={!draft.trim()}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              draft.trim()
                ? 'bg-billiards-600 text-white hover:bg-billiards-500'
                : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
            }`}
          >
            <SendHorizonal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
