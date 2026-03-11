/**
 * DevArena Backend - Main Entry Point
 * AI Code Battle & Learning Platform
 * 
 * Архитектура:
 * - Express сервер для REST API
 * - Socket.io для WebSocket (live battle)
 * - SQLite для хранения данных (MVP)
 * - JWT для аутентификации
 * - OpenAI API для AI Mentor
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Конфигурация
const { PORT } = require('./config/env');
const { initDatabase } = require('./config/database');

// Импорт роутов
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const challengeRoutes = require('./routes/challenges');
const battleRoutes = require('./routes/battles');
const learningRoutes = require('./routes/learning');
const leaderboardRoutes = require('./routes/leaderboard');

// Импорт Socket обработчиков
const { initializeSocket } = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Инициализация Socket.io с CORS
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Статические файлы (для загрузок и т.д.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    platform: 'DevArena',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.details
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Инициализация базы данных
initDatabase();

// Инициализация Socket.io
initializeSocket(io);

// Запуск сервера
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚔️  DevArena Backend Server                            ║
║   ─────────────────────────────────────────────           ║
║   🌐 Server:    http://localhost:${PORT}                    ║
║   📡 Socket.io: ws://localhost:${PORT}                      ║
║   🗄️  Database: SQLite (MVP)                             ║
║   🤖 AI Mentor: Enabled                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
