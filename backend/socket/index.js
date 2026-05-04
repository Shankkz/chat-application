const { Server } = require('socket.io');
const User = require('../models/User');
const presence = require('./presence');
const TypingManager = require('./handlers/typing');
const registerMessaging = require('./handlers/messaging');
const registerCalling  = require('./handlers/calling');

/**
 * Initialise Socket.io on the HTTP server.
 * @param {import('http').Server} httpServer
 */
const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  const typingManager = new TypingManager(io);

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── Presence ────────────────────────────────────────────────────────
    socket.on('user_connected', async (userId) => {
      await presence.setOnline(userId, socket.id);
      User.findByIdAndUpdate(userId, { isOnline: true }).catch(() => {});
      const onlineUsers = await presence.getOnlineUsers();
      io.emit('online_users', onlineUsers);
    });

    // ── Messaging ────────────────────────────────────────────────────────
    registerMessaging(io, socket);

    // ── Typing ───────────────────────────────────────────────────────────
    socket.on('typing', ({ senderId, receiverId }) => {
      typingManager.startTyping(senderId, receiverId, presence.getSocketId);
    });

    socket.on('stop_typing', ({ senderId, receiverId }) => {
      typingManager.stopTyping(senderId, receiverId, presence.getSocketId);
    });

    // ── Calling ──────────────────────────────────────────────────────────
    registerCalling(io, socket);

    // ── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const userId = await presence.findUserBySocket(socket.id);
      if (userId) {
        await presence.setOffline(userId);
        User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() }).catch(() => {});
        const onlineUsers = await presence.getOnlineUsers();
        io.emit('online_users', onlineUsers);
      }
    });
  });

  return io;
};

module.exports = initSocket;
