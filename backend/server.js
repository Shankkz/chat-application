require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/debug', require('./routes/debug')); // Dev-only: inspect DB

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Map to store userId -> socketId
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('user_connected', async (userId) => {
    connectedUsers.set(userId, socket.id);
    
    // Update user online status
    try {
      await User.findByIdAndUpdate(userId, { isOnline: true });
    } catch(e) {}

    // Broadcast updated online users list
    io.emit('online_users', Array.from(connectedUsers.keys()));
  });

  socket.on('send_message', (data) => {
    const receiverSocketId = connectedUsers.get(data.receiver);
    const senderSocketId = connectedUsers.get(data.sender);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', data);
    }
    
    if (senderSocketId && senderSocketId !== socket.id) {
        io.to(senderSocketId).emit('receive_message', data);
    }
  });

  // Typing indicators
  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', { senderId });
    }
  });

  socket.on('stop_typing', ({ senderId, receiverId }) => {
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('stop_typing', { senderId });
    }
  });

  // Message status
  socket.on('message_status_update', (data) => {
    const senderSocketId = connectedUsers.get(data.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('message_status_update', data);
    }
  });

  // WebRTC Signaling
  socket.on('call_user', (data) => {
    const receiverSocketId = connectedUsers.get(data.userToCall);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('incoming_call', { signal: data.signalData, from: data.from });
    }
  });

  socket.on('answer_call', (data) => {
    const callerSocketId = connectedUsers.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call_accepted', data.signal);
    }
  });
  
  socket.on('ice_candidate', (data) => {
    const receiverSocketId = connectedUsers.get(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('ice_candidate', data.candidate);
    }
  });

  socket.on('end_call', (data) => {
    const receiverSocketId = connectedUsers.get(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call_ended');
    }
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    
    let disconnectedUserId = null;
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }

    if (disconnectedUserId) {
      connectedUsers.delete(disconnectedUserId);
      
      // Update DB
      try {
        await User.findByIdAndUpdate(disconnectedUserId, { isOnline: false, lastSeen: new Date() });
      } catch(e) {}

      io.emit('online_users', Array.from(connectedUsers.keys()));
    }
  });
});

// MongoDB Connection
const startServer = async () => {
  let MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.log('No MONGODB_URI provided. Starting in-memory MongoDB...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    MONGODB_URI = mongoServer.getUri();
  }

  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      
      const PORT = process.env.PORT || 5005;
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
    });
};

startServer();
