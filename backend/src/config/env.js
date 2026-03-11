/**
 * Конфигурация окружения
 * Все настройки приложения
 */

module.exports = {
  // Сервер
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'devarena_super_secret_key_2024',
  JWT_EXPIRES_IN: '7d',

  // OpenAI API (для AI Mentor)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  
  // Battle настройки
  BATTLE_TIME_LIMIT: 600, // 10 минут в секундах
  BATTLE_WAIT_TIMEOUT: 120, // 2 минуты ожидание игрока
  
  // XP и Gamification
  XP_PER_WIN: 100,
  XP_PER_LOSS: 25,
  XP_PER_CORRECT_CHALLENGE: 50,
  XP_DAILY_BONUS: 75,
  XP_STREAK_BONUS: 10, // бонус за каждый день streak

  // Уровни
  LEVELS: [
    { level: 1, xpRequired: 0, title: 'Novice' },
    { level: 2, xpRequired: 100, title: 'Apprentice' },
    { level: 3, xpRequired: 300, title: 'Junior' },
    { level: 4, xpRequired: 600, title: 'Developer' },
    { level: 5, xpRequired: 1000, title: 'Mid-Level' },
    { level: 6, xpRequired: 1500, title: 'Senior' },
    { level: 7, xpRequired: 2200, title: 'Expert' },
    { level: 8, xpRequired: 3000, title: 'Master' },
    { level: 9, xpRequired: 4000, title: 'Grandmaster' },
    { level: 10, xpRequired: 5500, title: 'Legend' }
  ],

  // Темы оформления
  THEMES: ['dark', 'light', 'neon', 'cyber'],
  ACCENT_COLORS: ['#00ff88', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a855f7', '#3b82f6']
};
