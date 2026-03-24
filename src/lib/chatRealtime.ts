type ChatRealtimeEvent =
  | {
      type: 'thread-upsert';
      payload: {
        threadId: string;
        thread: unknown;
      };
    }
  | {
      type: 'message';
      payload: {
        threadId: string;
        message: unknown;
      };
    }
  | {
      type: 'read';
      payload: {
        threadId: string;
        role: 'user' | 'companion';
        readAt: string;
      };
    };

type Listener = (event: ChatRealtimeEvent, meta: { sourceId: string }) => void;

const CHANNEL_NAME = 'cuemate-chat-realtime';

function randomId() {
  return `chat_${Math.random().toString(36).slice(2, 10)}`;
}

export function createChatRealtimeClient() {
  const sourceId = randomId();
  const listeners = new Set<Listener>();
  let socket: WebSocket | null = null;
  let broadcast: BroadcastChannel | null = null;
  let connectionState: 'disconnected' | 'connecting' | 'connected' | 'fallback' =
    typeof window === 'undefined' ? 'disconnected' : 'fallback';

  const notify = (event: ChatRealtimeEvent, meta: { sourceId: string }) => {
    listeners.forEach(listener => listener(event, meta));
  };

  const emitLocal = (event: ChatRealtimeEvent) => {
    if (broadcast) {
      broadcast.postMessage({ event, sourceId });
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event, sourceId }));
    }
  };

  if (typeof window !== 'undefined') {
    if ('BroadcastChannel' in window) {
      broadcast = new BroadcastChannel(CHANNEL_NAME);
      broadcast.onmessage = message => {
        const data = message.data as { event: ChatRealtimeEvent; sourceId: string };
        if (!data || data.sourceId === sourceId) return;
        notify(data.event, { sourceId: data.sourceId });
      };
    }

    const wsUrl = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_CHAT_WS_URL;
    if (wsUrl) {
      connectionState = 'connecting';
      try {
        socket = new WebSocket(wsUrl);
        socket.onopen = () => {
          connectionState = 'connected';
        };
        socket.onclose = () => {
          connectionState = 'fallback';
          socket = null;
        };
        socket.onerror = () => {
          connectionState = 'fallback';
        };
        socket.onmessage = message => {
          try {
            const data = JSON.parse(String(message.data)) as { event: ChatRealtimeEvent; sourceId: string };
            if (!data || data.sourceId === sourceId) return;
            notify(data.event, { sourceId: data.sourceId });
          } catch {
            // ignore malformed messages
          }
        };
      } catch {
        connectionState = 'fallback';
        socket = null;
      }
    }
  }

  return {
    getConnectionState: () => connectionState,
    publish: emitLocal,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy() {
      listeners.clear();
      if (broadcast) broadcast.close();
      if (socket) socket.close();
    },
  };
}

export type { ChatRealtimeEvent };
