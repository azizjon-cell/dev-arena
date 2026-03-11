/**
 * User Routes - Профиль и настройки пользователя
 * GET /api/users/profile
 * PUT /api/users/profile
 * PUT /api/users/settings
 * GET /api/users/:id
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { LEVELS, THEMES, ACCENT_COLORS } = require('../config/env');

// Получение профиля текущего пользователя
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, email, avatar, xp, level, wins, losses, draws, streak, maxStreak,
             dailyChallengeCompleted, lastDailyChallenge, createdAt
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Получаем уровень и звание
    const userLevel = LEVELS.find(l => l.level === user.level) || LEVELS[0];
    const nextLevel = LEVELS.find(l => l.level === user.level + 1);
    
    // Прогресс до следующего уровня
    const xpForCurrentLevel = userLevel.xpRequired;
    const xpForNextLevel = nextLevel ? nextLevel.xpRequired : userLevel.xpRequired + 1000;
    const xpProgress = user.xp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progressPercent = Math.min(100, Math.round((xpProgress / xpNeeded) * 100));

    // Статистика решённых задач
    const solvedChallenges = db.prepare(`
      SELECT COUNT(DISTINCT challengeId) as count 
      FROM user_solutions 
      WHERE userId = ? AND isCorrect = 1
    `).get(req.user.id);

    res.json({
      success: true,
      profile: {
        ...user,
        title: userLevel.title,
        nextTitle: nextLevel ? nextLevel.title : null,
        xpToNextLevel: xpNeeded - xpProgress,
        progressPercent,
        solvedChallenges: solvedChallenges.count
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении профиля'
    });
  }
});

// Обновление профиля
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { username, avatar } = req.body;

    // Проверка уникальности username
    if (username) {
      const existing = db.prepare(`
        SELECT id FROM users WHERE username = ? AND id != ?
      `).get(username, req.user.id);

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Это имя пользователя уже занято'
        });
      }
    }

    // Обновление
    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (avatar) {
      updates.push('avatar = ?');
      values.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Нечего обновлять'
      });
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Получение обновлённого профиля
    const user = db.prepare(`
      SELECT id, username, email, avatar, xp, level, wins, losses, streak
      FROM users WHERE id = ?
    `).get(req.user.id);

    const userLevel = LEVELS.find(l => l.level === user.level) || LEVELS[0];

    res.json({
      success: true,
      message: 'Профиль обновлён',
      user: {
        ...user,
        title: userLevel.title
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении профиля'
    });
  }
});

// Обновление настроек
router.put('/settings', authenticateToken, (req, res) => {
  try {
    const { 
      theme, 
      accentColor, 
      editorFontSize, 
      editorTabSize, 
      editorWordWrap,
      aiHintsEnabled 
    } = req.body;

    const updates = [];
    const values = [];

    // Валидация theme
    if (theme && THEMES.includes(theme)) {
      updates.push('theme = ?');
      values.push(theme);
    }

    // Валидация accentColor
    if (accentColor && ACCENT_COLORS.includes(accentColor)) {
      updates.push('accentColor = ?');
      values.push(accentColor);
    }

    // Editor настройки
    if (typeof editorFontSize === 'number' && editorFontSize >= 10 && editorFontSize <= 24) {
      updates.push('editorFontSize = ?');
      values.push(editorFontSize);
    }

    if (typeof editorTabSize === 'number' && [2, 4, 8].includes(editorTabSize)) {
      updates.push('editorTabSize = ?');
      values.push(editorTabSize);
    }

    if (typeof editorWordWrap === 'number' && [0, 1].includes(editorWordWrap)) {
      updates.push('editorWordWrap = ?');
      values.push(editorWordWrap);
    }

    if (typeof aiHintsEnabled === 'number' && [0, 1].includes(aiHintsEnabled)) {
      updates.push('aiHintsEnabled = ?');
      values.push(aiHintsEnabled);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Неверные настройки'
      });
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Получение обновлённых настроек
    const user = db.prepare(`
      SELECT theme, accentColor, editorFontSize, editorTabSize, editorWordWrap, aiHintsEnabled
      FROM users WHERE id = ?
    `).get(req.user.id);

    res.json({
      success: true,
      message: 'Настройки сохранены',
      settings: user
    });

  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при сохранении настроек'
    });
  }
});

// Получение публичного профиля пользователя
router.get('/:id', (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, avatar, xp, level, wins, losses, draws, streak, maxStreak, createdAt
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const userLevel = LEVELS.find(l => l.level === user.level) || LEVELS[0];

    // Статистика
    const battleStats = db.prepare(`
      SELECT 
        COUNT(*) as totalBattles,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws
      FROM battle_history WHERE userId = ?
    `).get(user.id);

    res.json({
      success: true,
      user: {
        ...user,
        title: userLevel.title,
        totalBattles: battleStats?.totalBattles || 0
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении пользователя'
    });
  }
});

module.exports = router;
