/**
 * Battle Routes - 1v1 соревнования
 * POST /api/battles/create - создать битву
 * GET /api/battles/:battleId - получить информацию о битве
 * POST /api/battles/:battleId/join - присоединиться к битве
 * POST /api/battles/:battleId/submit - отправить решение
 * GET /api/battles/:battleId/status - получить статус (для polling)
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { evaluateCode } = require('../services/codeExecutionService');
const { XP_PER_WIN, XP_PER_LOSS } = require('../config/env');

// Хранилище активных баттлов в памяти (для быстрого доступа)
const activeBattles = new Map();

// Создание битвы
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { difficulty = 'mixed' } = req.body;

    // Получаем случайную задачу указанной сложности
    let challenge;
    if (difficulty === 'mixed') {
      challenge = db.prepare(`
        SELECT * FROM challenges WHERE isPublished = 1 ORDER BY RANDOM() LIMIT 1
      `).get();
    } else {
      challenge = db.prepare(`
        SELECT * FROM challenges WHERE isPublished = 1 AND difficulty = ? ORDER BY RANDOM() LIMIT 1
      `).get(difficulty);
    }

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }

    const battleId = uuidv4().slice(0, 8).toUpperCase();

    // Создаём запись в БД
    db.prepare(`
      INSERT INTO battles (battleId, player1Id, challengeId, status, player1Status)
      VALUES (?, ?, ?, 'waiting', 'ready')
    `).run(battleId, req.user.id, challenge.id);

    // Сохраняем в память для быстрого доступа
    const battle = {
      battleId,
      player1Id: req.user.id,
      player1Username: req.user.username,
      player2Id: null,
      player2Username: null,
      challengeId: challenge.id,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        difficulty: challenge.difficulty,
        starterCode: challenge.starterCode,
        testCases: JSON.parse(challenge.testCases || '[]')
      },
      status: 'waiting',
      player1Code: '',
      player2Code: '',
      player1Status: 'ready',
      player2Status: 'pending',
      player1Score: 0,
      player2Score: 0,
      createdAt: Date.now()
    };

    activeBattles.set(battleId, battle);

    res.json({
      success: true,
      battle,
      message: 'Битва создана. Ожидание противника...'
    });

  } catch (error) {
    console.error('Create battle error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании битвы'
    });
  }
});

// Присоединение к битве
router.post('/join', authenticateToken, (req, res) => {
  try {
    const { battleId } = req.body;

    // Пробуем найти в памяти
    let battle = activeBattles.get(battleId.toUpperCase());

    // Если нет в памяти, ищем в БД
    if (!battle) {
      const dbBattle = db.prepare(`
        SELECT * FROM battles WHERE battleId = ? AND status = 'waiting'
      `).get(battleId.toUpperCase());

      if (!dbBattle) {
        return res.status(404).json({
          success: false,
          message: 'Битва не найдена или уже началась'
        });
      }

      // Проверяем, не тот же ли это игрок
      if (dbBattle.player1Id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Нельзя присоединиться к своей битве'
        });
      }

      const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(dbBattle.challengeId);

      battle = {
        battleId: dbBattle.battleId,
        player1Id: dbBattle.player1Id,
        player2Id: req.user.id,
        challengeId: dbBattle.challengeId,
        challenge: {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          difficulty: challenge.difficulty,
          starterCode: challenge.starterCode,
          testCases: JSON.parse(challenge.testCases || '[]')
        },
        status: 'active',
        player1Code: '',
        player2Code: '',
        player1Status: 'ready',
        player2Status: 'ready',
        player1Score: 0,
        player2Score: 0,
        startedAt: Date.now()
      };

      activeBattles.set(battleId.toUpperCase(), battle);

      // Обновляем в БД
      db.prepare(`
        UPDATE battles SET player2Id = ?, status = 'active', startedAt = CURRENT_TIMESTAMP 
        WHERE battleId = ?
      `).run(req.user.id, battleId.toUpperCase());

      return res.json({
        success: true,
        battle,
        message: 'Вы присоединились к битве!'
      });
    }

    // Проверяем, не тот же ли это игрок
    if (battle.player1Id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя присоединиться к своей битве'
      });
    }

    // Проверяем, не заполнен ли уже слот
    if (battle.player2Id) {
      return res.status(400).json({
        success: false,
        message: 'Битва уже заполнена'
      });
    }

    // Обновляем battle
    battle.player2Id = req.user.id;
    battle.player2Username = req.user.username;
    battle.status = 'active';
    battle.player2Status = 'ready';
    battle.startedAt = Date.now();

    // Обновляем в БД
    db.prepare(`
      UPDATE battles SET player2Id = ?, status = 'active', startedAt = CURRENT_TIMESTAMP 
      WHERE battleId = ?
    `).run(req.user.id, battleId.toUpperCase());

    res.json({
      success: true,
      battle,
      message: 'Вы присоединились к битве!'
    });

  } catch (error) {
    console.error('Join battle error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при присоединении к битве'
    });
  }
});

// Получение информации о битве
router.get('/:battleId', authenticateToken, (req, res) => {
  try {
    const battle = activeBattles.get(req.params.battleId.toUpperCase());

    if (!battle) {
      return res.status(404).json({
        success: false,
        message: 'Битва не найдена'
      });
    }

    // Возвращаем только нужную информацию
    const isPlayer1 = battle.player1Id === req.user.id;
    const isPlayer2 = battle.player2Id === req.user.id;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({
        success: false,
        message: 'Вы не участник этой битвы'
      });
    }

    res.json({
      success: true,
      battle: {
        ...battle,
        player1Code: isPlayer1 ? battle.player1Code : '', // Скрываем код противника
        player2Code: isPlayer2 ? battle.player2Code : '',
        mySide: isPlayer1 ? 'player1' : 'player2'
      }
    });

  } catch (error) {
    console.error('Get battle error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении битвы'
    });
  }
});

// Отправка кода во время битвы
router.post('/:battleId/submit', authenticateToken, async (req, res) => {
  try {
    const { code, finished } = req.body;
    const battleId = req.params.battleId.toUpperCase();

    let battle = activeBattles.get(battleId);

    if (!battle) {
      return res.status(404).json({
        success: false,
        message: 'Битва не найдена'
      });
    }

    const isPlayer1 = battle.player1Id === req.user.id;
    const isPlayer2 = battle.player2Id === req.user.id;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({
        success: false,
        message: 'Вы не участник этой битвы'
      });
    }

    // Обновляем код игрока
    if (isPlayer1) {
      battle.player1Code = code;
      battle.player1Status = finished ? 'submitted' : 'coding';
    } else {
      battle.player2Code = code;
      battle.player2Status = finished ? 'submitted' : 'coding';
    }

    // Если игрок закончил - проверяем решение
    if (finished) {
      const testCases = battle.challenge.testCases;
      const result = await evaluateCode(code, testCases);

      const score = result.passedCount;

      if (isPlayer1) {
        battle.player1Score = score;
        battle.player1Status = result.allPassed ? 'completed' : 'failed';
      } else {
        battle.player2Score = score;
        battle.player2Status = result.allPassed ? 'completed' : 'failed';
      }

      // Проверяем, закончили ли оба
      if (battle.player1Status !== 'pending' && battle.player2Status !== 'pending') {
        battle.status = 'finished';
        battle.endedAt = Date.now();

        // Определяем победителя и начисляем XP
        await finalizeBattle(battle);
      }
    }

    res.json({
      success: true,
      battle: {
        player1Status: battle.player1Status,
        player2Status: battle.player2Status,
        player1Score: battle.player1Score,
        player2Score: battle.player2Score,
        status: battle.status
      }
    });

  } catch (error) {
    console.error('Submit battle code error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при отправке кода'
    });
  }
});

// Статус битвы (для polling)
router.get('/:battleId/status', authenticateToken, (req, res) => {
  try {
    const battle = activeBattles.get(req.params.battleId.toUpperCase());

    if (!battle) {
      // Пробуем найти в БД
      const dbBattle = db.prepare(`
        SELECT b.*, u1.username as player1Username, u2.username as player2Username
        FROM battles b
        LEFT JOIN users u1 ON b.player1Id = u1.id
        LEFT JOIN users u2 ON b.player2Id = u2.id
        WHERE b.battleId = ?
      `).get(req.params.battleId.toUpperCase());

      if (!dbBattle) {
        return res.status(404).json({
          success: false,
          message: 'Битва не найдена'
        });
      }

      return res.json({
        success: true,
        battle: {
          battleId: dbBattle.battleId,
          status: dbBattle.status,
          player1Username: dbBattle.player1Username,
          player2Username: dbBattle.player2Username,
          player1Score: dbBattle.player1Score,
          player2Score: dbBattle.player2Score,
          winnerId: dbBattle.winnerId
        }
      });
    }

    const isPlayer1 = battle.player1Id === req.user.id;
    const isPlayer2 = battle.player2Id === req.user.id;

    res.json({
      success: true,
      battle: {
        battleId: battle.battleId,
        status: battle.status,
        player1Username: battle.player1Username || 'Player 1',
        player2Username: battle.player2Username || 'Waiting...',
        player1Status: battle.player1Status,
        player2Status: battle.player2Status,
        player1Score: battle.player1Score,
        player2Score: battle.player2Score,
        winnerId: battle.winnerId,
        isParticipant: isPlayer1 || isPlayer2
      }
    });

  } catch (error) {
    console.error('Battle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статуса'
    });
  }
});

// Поиск доступных битв
router.get('/', (req, res) => {
  try {
    // Получаем битвы в статусе waiting из памяти
    const waitingBattles = [];
    activeBattles.forEach((battle, id) => {
      if (battle.status === 'waiting') {
        waitingBattles.push({
          battleId: id,
          player1Username: battle.player1Username,
          challengeTitle: battle.challenge.title,
          difficulty: battle.challenge.difficulty,
          createdAt: battle.createdAt
        });
      }
    });

    res.json({
      success: true,
      battles: waitingBattles
    });

  } catch (error) {
    console.error('List battles error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении списка битв'
    });
  }
});

// Helper функция для завершения битвы
async function finalizeBattle(battle) {
  let winnerId = null;
  let result1 = 'draw';
  let result2 = 'draw';

  if (battle.player1Score > battle.player2Score) {
    winnerId = battle.player1Id;
    result1 = 'win';
    result2 = 'loss';
  } else if (battle.player2Score > battle.player1Score) {
    winnerId = battle.player2Id;
    result1 = 'loss';
    result2 = 'win';
  }

  // Начисляем XP
  const xp1 = result1 === 'win' ? XP_PER_WIN : (result1 === 'loss' ? XP_PER_LOSS : 0);
  const xp2 = result2 === 'win' ? XP_PER_WIN : (result2 === 'loss' ? XP_PER_LOSS : 0);

  // Обновляем статистику игроков
  if (result1 === 'win') {
    db.prepare('UPDATE users SET wins = wins + 1, xp = xp + ? WHERE id = ?').run(xp1, battle.player1Id);
  } else if (result1 === 'loss') {
    db.prepare('UPDATE users SET losses = losses + 1, xp = xp + ? WHERE id = ?').run(xp1, battle.player1Id);
  } else {
    db.prepare('UPDATE users SET draws = draws + 1, xp = xp + ? WHERE id = ?').run(xp1, battle.player1Id);
  }

  if (result2 === 'win') {
    db.prepare('UPDATE users SET wins = wins + 1, xp = xp + ? WHERE id = ?').run(xp2, battle.player2Id);
  } else if (result2 === 'loss') {
    db.prepare('UPDATE users SET losses = losses + 1, xp = xp + ? WHERE id = ?').run(xp2, battle.player2Id);
  } else {
    db.prepare('UPDATE users SET draws = draws + 1, xp = xp + ? WHERE id = ?').run(xp2, battle.player2Id);
  }

  // Записываем историю битв
  db.prepare(`
    INSERT INTO battle_history (battleId, userId, opponentId, challengeId, result, xpEarned)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(battle.battleId, battle.player1Id, battle.player2Id, battle.challengeId, result1, xp1);

  db.prepare(`
    INSERT INTO battle_history (battleId, userId, opponentId, challengeId, result, xpEarned)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(battle.battleId, battle.player2Id, battle.player1Id, battle.challengeId, result2, xp2);

  // Обновляем запись в БД
  db.prepare(`
    UPDATE battles SET 
      status = 'finished',
      winnerId = ?,
      player1Code = ?,
      player2Code = ?,
      player1Score = ?,
      player2Score = ?,
      player1Status = ?,
      player2Status = ?,
      endedAt = CURRENT_TIMESTAMP
    WHERE battleId = ?
  `).run(
    winnerId,
    battle.player1Code,
    battle.player2Code,
    battle.player1Score,
    battle.player2Score,
    battle.player1Status,
    battle.player2Status,
    battle.battleId
  );

  battle.winnerId = winnerId;
}

module.exports = router;
