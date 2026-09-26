import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import generatorRoutes from './routes/generator';
import marketplaceRoutes from './routes/marketplace';
import adminRoutes from './routes/admin';
import assistantRoutes from './routes/assistant';
import { socketHandler } from './sockets/socketHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
export const io = new SocketServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});
socketHandler(io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting – 200 requests per 15 minutes per IP
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// ─── Static exports ───────────────────────────────────────────────────────────
app.use('/exports', express.static(path.join(__dirname, '../../exports')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/generator', generatorRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assistant', assistantRoutes);

// Health check & Readiness probes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MockForge AI Server', timestamp: new Date().toISOString() });
});

app.get('/api/ready', (_req, res) => {
  res.json({ ready: true, database: 'connected', sockets: 'active', timestamp: new Date().toISOString() });
});

// ─── 404 / Error handlers ────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '4000', 10);

(async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n🚀 DataForge AI Server running on http://localhost:${PORT}`);
    console.log(`   Socket.IO  →  ws://localhost:${PORT}`);
    console.log(`   Health     →  http://localhost:${PORT}/api/health\n`);
  });
})();
