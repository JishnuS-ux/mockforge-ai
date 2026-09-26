import { Server as SocketServer } from 'socket.io';

export function socketHandler(io: SocketServer) {
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // Client joins their private room
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`   → User ${userId} joined room user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });
}
