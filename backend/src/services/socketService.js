/**
 * Socket.io Service - WebSocket для Live Battle
 * Обрабатывает real-time коммуникацию между игроками
 */

const { db } = require('../config/database');
const { BATTLE_TIME_LIMIT } = require('../config/env');

// Хранилище активных комнат
const rooms = new Map();

// Инициализация Socket.io
function initializeSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Присоединение к комнате битвы
    socket.on('join-battle', (data) => {
      const { battleId, userId, username } = data;
      
      socket.join(battleId);
      socket.battleId = battleId;
      socket.userId = userId;
      socket.username = username;

      // Уведомляем всех в комнате
      io.to(battleId).emit('player-joined', {
        userId,
        username,
        timestamp: Date.now()
      });

      console.log(`👤 ${username} присоединился к битве ${battleId}`);
    });

    // Обновление кода (реальное время)
    socket.on('code-update', (data) => {
      const { battleId, code, player } = data;
      
      // Транслируем обновление другим участникам (без кода!)
      socket.to(battleId).emit('code-changed', {
        player,
        hasCode: code.length > 0,
        timestamp: Date.now()
      });
    });

    // Событие "печатает..."
    socket.on('typing', (data) => {
      const { battleId, player, isTyping } = data;
      
      socket.to(battleId).emit('player-typing', {
        player,
        isTyping
      });
    });

    // Игрок закончил решение
    socket.on('submit-solution', (data) => {
      const { battleId, player, score, allPassed } = data;
      
      io.to(battleId).emit('solution-submitted', {
        player,
        score,
        allPassed,
        timestamp: Date.now()
      });
    });

    // Запуск таймера (когда оба игрока готовы)
    socket.on('start-timer', (data) => {
      const { battleId } = data;
      
      // Запускаем обратный отсчёт
      let timeLeft = BATTLE_TIME_LIMIT;
      
      const timerInterval = setInterval(() => {
        timeLeft--;
        
        io.to(battleId).emit('timer-update', {
          timeLeft,
          timestamp: Date.now()
        });

        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          io.to(battleId).emit('battle-ended', {
            reason: 'timeout',
            timestamp: Date.now()
          });
        }
      }, 1000);

      // Сохраняем interval для возможной отмены
      rooms.set(battleId, { timerInterval });
    });

    // Пауза/возобновление (если нужно)
    socket.on('pause-battle', (data) => {
      const { battleId } = data;
      const room = rooms.get(battleId);
      
      if (room && room.timerInterval) {
        clearInterval(room.timerInterval);
        io.to(battleId).emit('battle-paused', { timestamp: Date.now() });
      }
    });

    // Чат между игроками
    socket.on('send-message', (data) => {
      const { battleId, message, player } = data;
      
      // Проверяем на спам
      if (message.length > 200) {
        socket.emit('error', { message: 'Слишком длинное сообщение' });
        return;
      }

      io.to(battleId).emit('chat-message', {
        player,
        message: message.substring(0, 200),
        timestamp: Date.now()
      });
    });

    // Предложение ничьей
    socket.on('propose-draw', (data) => {
      const { battleId, player } = data;
      io.to(battleId).emit('draw-proposed', {
        by: player,
        timestamp: Date.now()
      });
    });

    // Отмена/выход из битвы
    socket.on('leave-battle', (data) => {
      const { battleId, userId, username } = data;
      
      socket.leave(battleId);
      
      io.to(battleId).emit('player-left', {
        userId,
        username,
        timestamp: Date.now()
      });

      // Очищаем комнату
      const room = rooms.get(battleId);
      if (room && room.timerInterval) {
        clearInterval(room.timerInterval);
      }
      rooms.delete(battleId);
    });

    // Отключение
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      
      // Если игрок был в битве - уведомляем
      if (socket.battleId) {
        io.to(socket.battleId).emit('player-disconnected', {
          username: socket.username,
          userId: socket.userId,
          timestamp: Date.now()
        });
      }
    });
  });

  console.log('✅ Socket.io инициализирован');
}

module.exports = { initializeSocket };
