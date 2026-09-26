import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, { transports: ['websocket'] });
  }
  return socket;
}

export function useSocket(
  events: Record<string, (data: unknown) => void>,
  deps: unknown[] = []
) {
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    if (user?.id) {
      s.emit('join:user', user.id);
    }

    for (const [event, handler] of Object.entries(events)) {
      s.on(event, handler);
    }

    return () => {
      for (const [event, handler] of Object.entries(events)) {
        s.off(event, handler);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, ...deps]);

  return socketRef.current;
}
