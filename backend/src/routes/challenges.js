/**
 * Challenge Routes - Задачи для Practice и Battle
 * GET /api/challenges - список задач
 * GET /api/challenges/:slug - детали задачи
 * POST /api/challenges/:id/submit - отправка решения
 * GET /api/challenges/:id/hints - получить подсказку
 * GET /api/challenges/daily - ежедневная задача
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { XP_PER_CORRECT_CHALLENGE, XP_DAILY_BONUS } = require('../config/env');
const { evaluateCode } = require('../services/codeExecutionService');
const { getHint } = require('../services/aiMentorService');

// Получение списка задач
router.get('/', optionalAuth, (req, res) => {
  try {
    const { difficulty, category, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT id, title, slug, description, difficulty, category, xpReward, bigOHint
      FROM challenges WHERE isPublished = 1
    `;
    const params = [];

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY difficulty ASC, id ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const challenges = db.prepare(query).all(...params);

    // Если пользователь авторизован, добавляем информацию о решенных задачах
    let solvedIds = [];
    if (req.user) {
      const solved = db.prepare(`
        SELECT DISTINCT challengeId FROM user_solutions 
        WHERE userId = ? AND isCorrect = 1
      `).all(req.user.id);
      solvedIds = solved.map(s => s.challengeId);
    }

    const challengesWithStatus = challenges.map(ch => ({
      ...ch,
      solved: solvedIds.includes(ch.id)
    }));

    res.json({
      success: true,
      challenges: challengesWithStatus,
      total: challenges.length
    });

  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении задач'
    });
  }
});

// Получение одной задачи
router.get('/:slug', optionalAuth, (req, res) => {
  try {
    const challenge = db.prepare(`
      SELECT * FROM challenges WHERE slug = ? AND isPublished = 1
    `).get(req.params.slug);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }

    // Парсим JSON поля
    const parsedChallenge = {
      ...challenge,
      testCases: JSON.parse(challenge.testCases || '[]'),
      hints: JSON.parse(challenge.hints || '[]')
    };

    // Проверяем, решена ли задача
    let solved = false;
    let userSolution = null;

    if (req.user) {
      const solution = db.prepare(`
        SELECT id, code, passedTests, totalTests, isCorrect, createdAt
        FROM user_solutions 
        WHERE userId = ? AND challengeId = ? AND isCorrect = 1
        ORDER BY createdAt DESC LIMIT 1
      `).get(req.user.id, challenge.id);

      if (solution) {
        solved = true;
        userSolution = solution;
      }
    }

    res.json({
      success: true,
      challenge: parsedChallenge,
      solved,
      userSolution
    });

  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении задачи'
    });
  }
});

// Отправка решения
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const challengeId = parseInt(req.params.id);

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Код не предоставлен'
      });
    }

    // Получаем задачу
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challengeId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }

    // Выполняем код и проверяем тесты
    const testCases = JSON.parse(challenge.testCases);
    const result = await evaluateCode(code, testCases, challenge.solution);

    // Сохраняем решение
    const xpEarned = result.allPassed ? challenge.xpReward : 0;
    
    const solutionResult = db.prepare(`
      INSERT INTO user_solutions (userId, challengeId, code, passedTests, totalTests, isCorrect, executionTime, xpEarned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      challengeId,
      code,
      result.passedCount,
      testCases.length,
      result.allPassed ? 1 : 0,
      result.executionTime,
      xpEarned
    );

    // Если правильно - начисляем XP и обновляем streak
    if (result.allPassed) {
      // Проверяем, не было ли уже решено
      const existingSolution = db.prepare(`
        SELECT id FROM user_solutions 
        WHERE userId = ? AND challengeId = ? AND isCorrect = 1
      `).get(req.user.id, challengeId);

      if (!existingSolution) {
        // Первое правильное решение - начисляем XP
        addXp(req.user.id, xpEarned);
      }

      // Обновляем streak
      updateStreak(req.user.id);
    }

    res.json({
      success: true,
      result: {
        passedCount: result.passedCount,
        totalTests: testCases.length,
        allPassed: result.allPassed,
        testResults: result.testResults,
        xpEarned,
        executionTime: result.executionTime
      }
    });

  } catch (error) {
    console.error('Submit solution error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке решения'
    });
  }
});

// Получить подсказку
router.get('/:id/hints', authenticateToken, async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id);
    const { index = 0 } = req.query;

    const challenge = db.prepare(`
      SELECT title, description, hints, bigOHint FROM challenges WHERE id = ?
    `).get(challengeId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }

    const hints = JSON.parse(challenge.hints || '[]');
    
    // AI подсказка
    if (req.user.aiHintsEnabled && process.env.OPENAI_API_KEY) {
      const aiHint = await getHint(req.user.id, challenge, index);
      
      // Сохраняем разговор
      db.prepare(`
        INSERT INTO ai_conversations (userId, challengeId, message, response, type)
        VALUES (?, ?, ?, ?, 'hint')
      `).run(req.user.id, challengeId, `Подсказка ${index}`, aiHint);

      return res.json({
        success: true,
        hint: aiHint,
        bigOHint: challenge.bigOHint,
        nextHintAvailable: index < hints.length
      });
    }

    // Обычная подсказка из БД
    if (index < hints.length) {
      return res.json({
        success: true,
        hint: hints[index],
        bigOHint: challenge.bigOHint,
        nextHintAvailable: index < hints.length - 1
      });
    }

    res.json({
      success: true,
      hint: 'Попробуйте разбить задачу на меньшие части',
      bigOHint: challenge.bigOHint,
      nextHintAvailable: false
    });

  } catch (error) {
    console.error('Get hint error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении подсказки'
    });
  }
});

// Ежедневная задача
router.get('/daily', optionalAuth, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const daily = db.prepare(`
      SELECT dc.bonusXp, c.*
      FROM daily_challenges dc
      JOIN challenges c ON dc.challengeId = c.id
      WHERE dc.date = ?
    `).get(today);

    if (!daily) {
      // Берем случайную задачу
      const random = db.prepare(`
        SELECT *, 50 as bonusXp FROM challenges 
        WHERE isPublished = 1 ORDER BY RANDOM() LIMIT 1
      `).get();

      return res.json({
        success: true,
        challenge: {
          ...random,
          testCases: JSON.parse(random.testCases || '[]'),
          hints: JSON.parse(random.hints || '[]')
        },
        isDaily: false,
        bonusXp: 50
      });
    }

    // Проверяем, выполнена ли daily
    let completed = false;
    if (req.user) {
      const completedToday = db.prepare(`
        SELECT id FROM user_solutions 
        WHERE userId = ? AND challengeId = ? AND isCorrect = 1 
        AND date(createdAt) = ?
      `).get(req.user.id, daily.id, today);

      completed = !!completedToday;
    }

    res.json({
      success: true,
      challenge: {
        ...daily,
        testCases: JSON.parse(daily.testCases || '[]'),
        hints: JSON.parse(daily.hints || '[]')
      },
      isDaily: true,
      bonusXp: daily.bonusXp,
      completed
    });

  } catch (error) {
    console.error('Daily challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении daily challenge'
    });
  }
});

// Helper функции
function addXp(userId, xp) {
  // Добавляем XP
  db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(xp, userId);

  // Проверяем повышение уровня
  const user = db.prepare('SELECT xp, level FROM users WHERE id = ?').get(userId);
  const { LEVELS } = require('../config/env');
  
  let newLevel = user.level;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (user.xp >= LEVELS[i].xpRequired) {
      newLevel = LEVELS[i].level;
      break;
    }
  }

  if (newLevel > user.level) {
    db.prepare('UPDATE users SET level = ? WHERE id = ?').run(newLevel, userId);
  }
}

function updateStreak(userId) {
  const today = new Date().toISOString().split('T')[0];
  const user = db.prepare('SELECT streak, maxStreak, lastDailyChallenge FROM users WHERE id = ?').get(userId);

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  let newStreak = 1;
  
  if (user.lastDailyChallenge === yesterday) {
    newStreak = user.streak + 1;
  } else if (user.lastDailyChallenge === today) {
    newStreak = user.streak;
  }

  const newMaxStreak = Math.max(user.maxStreak, newStreak);

  db.prepare(`
    UPDATE users SET streak = ?, maxStreak = ?, lastDailyChallenge = ? WHERE id = ?
  `).run(newStreak, newMaxStreak, today, userId);
}

module.exports = router;
