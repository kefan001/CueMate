import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import type { ChatMessage, ChatThread } from '../data/mock';
import { mockChatThreads } from '../data/mock';
import {
  STORAGE_KEYS,
  createThreadId,
  createMessageId,
  upsertThread,
  updateThread,
  replyTextFor,
} from '../../../shared/cuemate-core';
import { createChatRealtimeClient } from '../lib/chatRealtime';
import { readJson, writeJson } from '../utils/storage';

interface EnsureThreadInput {
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
}

interface SendMessageInput {
  sender: 'user' | 'companion';
  type?: ChatMessage['type'];
  text?: string;
  mediaUrl?: string;
  durationSec?: number;
  autoReply?: boolean;
}

interface ChatContextValue {
  threads: ChatThread[];
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'fallback';
  ensureThread: (input: EnsureThreadInput) => string;
  sendMessage: (threadId: string, payload: SendMessageInput) => void;
  markThreadRead: (threadId: string, role: 'user' | 'companion') => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);
const STORAGE_KEY = STORAGE_KEYS.CHAT;

const realtime = createChatRealtimeClient();

export function ChatProvider({ children }: PropsWithChildren) {
  const [threads, setThreads] = useState<ChatThread[]>(() => readJson<ChatThread[]>(STORAGE_KEY, mockChatThreads));
  const [connectionState, setConnectionState] = useState<ChatContextValue['connectionState']>(realtime.getConnectionState());
  const autoReplyTimers = useRef<Record<string, number>>({});
  const threadsRef = useRef(threads);

  useEffect(() => {
    writeJson(STORAGE_KEY, threads);
    threadsRef.current = threads;
  }, [threads]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setConnectionState(realtime.getConnectionState());
    }, 1500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    return realtime.subscribe((event) => {
      if (event.type === 'thread-upsert') {
        setThreads(prev => upsertThread(prev, event.payload.thread as ChatThread));
      }

      if (event.type === 'message') {
        const incoming = event.payload.message as ChatMessage;
        setThreads(prev =>
          updateThread(prev, event.payload.threadId, thread => {
            if (thread.messages.some(message => message.id === incoming.id)) return thread;
            return {
              ...thread,
              messages: [...thread.messages, incoming],
            };
          })
        );
      }

      if (event.type === 'read') {
        setThreads(prev =>
          updateThread(prev, event.payload.threadId, thread => ({
            ...thread,
            ...(event.payload.role === 'user'
              ? { lastReadAtUser: event.payload.readAt }
              : { lastReadAtCompanion: event.payload.readAt }),
          }))
        );
      }
    });
  }, []);

  const ensureThread: ChatContextValue['ensureThread'] = input => {
    const threadId = createThreadId(input.companionId, input.customerId);
    const existing = threadsRef.current.find(thread => thread.id === threadId);
    const now = new Date().toISOString();
    const thread: ChatThread = existing
      ? {
          ...existing,
          ...input,
          appointmentSlots: input.appointmentSlots ?? existing.appointmentSlots,
        }
      : {
          id: threadId,
          ...input,
          messages: [
            {
              id: `${threadId}_welcome`,
              sender: 'companion',
              type: 'text',
              text: '你好，档期和打法偏好都可以先聊，我会提前帮你安排。',
              createdAt: now,
            },
          ],
          lastReadAtCompanion: now,
        };

    setThreads(prev => upsertThread(prev, thread));
    realtime.publish({
      type: 'thread-upsert',
      payload: {
        threadId,
        thread,
      },
    });

    return threadId;
  };

  const sendMessage: ChatContextValue['sendMessage'] = (threadId, payload) => {
    const now = new Date().toISOString();
    const message: ChatMessage = {
      id: createMessageId(threadId),
      sender: payload.sender,
      type: payload.type ?? 'text',
      text: payload.text,
      mediaUrl: payload.mediaUrl,
      durationSec: payload.durationSec,
      createdAt: now,
    };

    setThreads(prev =>
      updateThread(prev, threadId, thread => ({
        ...thread,
        messages: [...thread.messages, message],
        ...(payload.sender === 'user' ? { lastReadAtUser: now } : { lastReadAtCompanion: now }),
      }))
    );

    realtime.publish({
      type: 'message',
      payload: {
        threadId,
        message,
      },
    });

    if (payload.autoReply === false || connectionState === 'connected') return;

    const replyRole = payload.sender === 'user' ? 'companion' : 'user';
    const delay = 1200 + Math.floor(Math.random() * 1600);

    if (autoReplyTimers.current[threadId]) {
      window.clearTimeout(autoReplyTimers.current[threadId]);
    }

    autoReplyTimers.current[threadId] = window.setTimeout(() => {
      const thread = threadsRef.current.find(item => item.id === threadId);
      if (!thread) return;

      const replyMessage: ChatMessage = {
        id: createMessageId(threadId),
        sender: replyRole,
        type: 'text',
        text: replyTextFor(thread, payload),
        createdAt: new Date().toISOString(),
      };

      setThreads(prev =>
        updateThread(prev, threadId, current => ({
          ...current,
          messages: [...current.messages, replyMessage],
        }))
      );

      realtime.publish({
        type: 'message',
        payload: {
          threadId,
          message: replyMessage,
        },
      });
    }, delay);
  };

  const markThreadRead: ChatContextValue['markThreadRead'] = (threadId, role) => {
    const now = new Date().toISOString();

    setThreads(prev =>
      updateThread(prev, threadId, thread => ({
        ...thread,
        ...(role === 'user' ? { lastReadAtUser: now } : { lastReadAtCompanion: now }),
      }))
    );

    realtime.publish({
      type: 'read',
      payload: {
        threadId,
        role,
        readAt: now,
      },
    });
  };

  const value = useMemo(
    () => ({ threads, connectionState, ensureThread, sendMessage, markThreadRead }),
    [threads, connectionState]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
