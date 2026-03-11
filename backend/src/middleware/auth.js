/**
 * JWT Authentication Middleware
 * Проверяет токен и добавляет данные пользователя в request
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { db } = require('../config/database');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Токен доступа не предоставлен'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Получаем актуальные данные пользователя из БД
    const user = db.prepare(`
      SELECT id, username, email, avatar, xp, level, wins, losses, draws, streak,
             theme, accentColor, editorFontSize, editorTabSize, editorWordWrap, aiHintsEnabled
      FROM users WHERE id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Добавляем пользователя в request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Токен истёк'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Неверный токен'
    });
  }
}

// Optional auth - не обязательный, но добавляет user если есть токен
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Игнорируем ошибку, продолжаем без user
  }
  
  next();
}

module.exports = { authenticateToken, optionalAuth };
