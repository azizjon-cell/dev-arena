/**
 * Auth Routes - Регистрация и логин
 * POST /api/auth/register
 * POST /api/auth/login
 * GET /api/auth/me
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN, LEVELS, XP_PER_CORRECT_CHALLENGE } = require('../config/env');
const { authenticateToken } = require('../middleware/auth');

// Регистрация
router.post('/register', async (req, res) => {
  try {
    console.log('Register request received:', { username: req.body.username, email: req.body.email });
    const { username, email, password } = req.body;

    // Валидация
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Заполните все поля'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Имя пользователя должно быть минимум 3 символа'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен быть минимум 6 символов'
      });
    }

    // Проверка существующего пользователя
    const existingUser = db.prepare(`
      SELECT id FROM users WHERE username = ? OR email = ?
    `).get(username, email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким именем или email уже существует'
      });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const result = db.prepare(`
      INSERT INTO users (username, email, password, level, xp) 
      VALUES (?, ?, ?, 1, 0)
    `).run(username, email, hashedPassword);

    const userId = result.lastInsertRowid;

    // Генерация JWT токена
    const token = jwt.sign(
      { userId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Получение данных пользователя
    const user = db.prepare(`
      SELECT id, username, email, avatar, xp, level, wins, losses, draws, streak
      FROM users WHERE id = ?
    `).get(userId);

    res.status(201).json({
      success: true,
      message: 'Регистрация успешна!',
      token,
      user
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при регистрации'
    });
  }
});

// Логин
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Введите email и пароль'
      });
    }

    // Поиск пользователя
    const user = db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).get(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    // Генерация JWT токена
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Получение полных данных пользователя
    const userData = db.prepare(`
      SELECT id, username, email, avatar, xp, level, wins, losses, draws, streak,
             theme, accentColor, editorFontSize, editorTabSize, editorWordWrap, aiHintsEnabled
      FROM users WHERE id = ?
    `).get(user.id);

    // Определение звания
    const userLevel = LEVELS.find(l => l.level === userData.level) || LEVELS[0];

    res.json({
      success: true,
      message: 'Добро пожаловать!',
      token,
      user: {
        ...userData,
        title: userLevel.title
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при входе'
    });
  }
});

// Получение текущего пользователя
router.get('/me', authenticateToken, (req, res) => {
  const userLevel = LEVELS.find(l => l.level === req.user.level) || LEVELS[0];
  
  res.json({
    success: true,
    user: {
      ...req.user,
      title: userLevel.title
    }
  });
});

// Logout (на клиенте просто удаляется токен)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Вы вышли из системы'
  });
});

module.exports = router;
