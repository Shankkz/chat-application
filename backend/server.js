require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const http    = require('http');

const connectDB  = require('./config/db');
const initSocket = require('./socket');

const authRoutes     = require('./modules/auth/auth.routes');
const userRoutes     = require('./modules/users/users.routes');
const messageRoutes  = require('./modules/messages/messages.routes');

// ─── App setup ───────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// 10 MB covers base64-encoded images from typical phone cameras
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/messages', messageRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Socket.io ───────────────────────────────────────────────────────────────
initSocket(server);

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5005;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
};

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});

// ─── Graceful shutdown ───────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n[Server] ${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
  // Force exit after 10 s if connections hang
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
