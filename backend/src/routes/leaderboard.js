/**
 * Leaderboard Routes - Таблица лидеров
 * GET /api/leaderboard - общий топ
 * GET /api/leaderboard/weekly - недельный топ
 * GET /api/leaderboard/friends - топ друзей
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { LEVELS } = require('../config/env');

// Общий топ
router.get('/', optionalAuth, (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const users = db.prepare(`
      SELECT id, username, avatar, xp, level, wins, losses, streak
      FROM users
      ORDER BY xp DESC
      LIMIT ?
    `).parseInt(limit);

    // Получаем топ пользователей
    const topUsers = db.prepare(`
      SELECT id, username, avatar, xp, level, wins, losses, streak
      FROM users
      ORDER BY xp DESC
      LIMIT ?
    `).all(parseInt(limit));

    // Добавляем титулы и позиции
    const leaderboard = topUsers.map((user, index) => {
      const userLevel = LEVELS.find(l => l.level === user.level) || LEVELS[0];
      return {
        rank: index + 1,
        ...user,
        title: userLevel.title
      };
    });

    // Если пользователь авторизован, находим его позицию
    let userRank = null;
    if (req.user) {
      const rank = db.prepare(`
        SELECT COUNT(*) + 1 as rank FROM users WHERE xp > ?
      `).get(req.user.xp);

      userRank = rank.rank;
    }

    res.json({
      success: true,
      leaderboard,
      userRank
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении лидерборда'
    });
  }
});

// Недельный топ (по XP за последние 7 дней)
router.get('/weekly', optionalAuth, (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Получаем пользователей с XP за последнюю неделю
    const topUsers = db.prepare(`
      SELECT u.id, u.username, u.avatar, u.level,
             COALESCE(SUM(bh.xpEarned), 0) as weeklyXp,
             COUNT(bh.id) as battlesPlayed
      FROM users u
      LEFT JOIN battle_history bh ON bh.userId = u.id 
        AND bh.createdAt >= datetime('now', '-7 days')
      GROUP BY u.id
      ORDER BY weeklyXp DESC
      LIMIT ?
    `).all(parseInt(limit));

    const leaderboard = topUsers.map((user, index) => {
      const userLevel = LEVELS.find(l => l.level === user.level) || LEVELS[0];
      return {
        rank: index + 1,
        username: user.username,
        avatar: user.avatar,
        xp: user.weeklyXp,
        title: userLevel.title,
        battlesPlayed: user.battlesPlayed
      };
    });

    res.json({
      success: true,
      leaderboard,
      period: 'weekly'
    });

  } catch (error) {
    console.error('Weekly leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении недельного топа'
    });
  }
});

// Топ по победам
router.get('/wins', (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const topUsers = db.prepare(`
      SELECT id, username, avatar, wins, losses, level
      FROM users
      ORDER BY wins DESC
      LIMIT ?
    `).all(parseInt(limit));

    const leaderboard = topUsers.map((user, index) => {
      const userLevel = LEVELS.find(l => l.level === user.level) || LEVELS[0];
      const winRate = user.wins + user.losses > 0 
        ? Math.round((user.wins / (user.wins + user.losses)) * 100) 
        : 0;
      
      return {
        rank: index + 1,
        username: user.username,
        avatar: user.avatar,
        wins: user.wins,
        losses: user.losses,
        winRate,
        title: userLevel.title
      };
    });

    res.json({
      success: true,
      leaderboard,
      type: 'wins'
    });

  } catch (error) {
    console.error('Wins leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении топа по победам'
    });
  }
});

// Топ по streak
router.get('/streaks', (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const topUsers = db.prepare(`
      SELECT id, username, avatar, streak, maxStreak, level
      FROM users
      ORDER BY maxStreak DESC
      LIMIT ?
    `).all(parseInt(limit));

    const leaderboard = topUsers.map((user, index) => {
      const userLevel = LEVELS.find(l => l.level === user.level) || LEVELS[0];
      return {
        rank: index + 1,
        username: user.username,
        avatar: user.avatar,
        currentStreak: user.streak,
        maxStreak: user.maxStreak,
        title: userLevel.title
      };
    });

    res.json({
      success: true,
      leaderboard,
      type: 'streaks'
    });

  } catch (error) {
    console.error('Streaks leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении топа по streak'
    });
  }
});

module.exports = router;
