/**
 * Learning Routes - Обучение и теория
 * GET /api/learning/topics - список тем
 * GET /api/learning/topics/:slug - содержание темы
 * GET /api/learning/categories - категории
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

// Список категорий
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category FROM topics WHERE isPublished = 1
    `).all();

    const categoryInfo = {
      'algorithms': { name: 'Алгоритмы', icon: '⚡', color: '#00ff88' },
      'data-structures': { name: 'Структуры данных', icon: '📊', color: '#4ecdc4' },
      'basics': { name: 'Основы', icon: '📚', color: '#ffe66d' },
      'strings': { name: 'Строки', icon: '🔤', color: '#a855f7' },
      'dynamic-programming': { name: 'Динамическое программирование', icon: '🎯', color: '#ff6b6b' }
    };

    const result = categories.map(c => ({
      slug: c.category,
      ...(categoryInfo[c.category] || { name: c.category, icon: '📖', color: '#3b82f6' })
    }));

    res.json({
      success: true,
      categories: result
    });

  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении категорий'
    });
  }
});

// Список тем
router.get('/topics', optionalAuth, (req, res) => {
  try {
    const { category, difficulty } = req.query;

    let query = `
      SELECT id, title, slug, description, category, difficulty, orderIndex
      FROM topics WHERE isPublished = 1
    `;
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY orderIndex ASC';

    const topics = db.prepare(query).all(...params);

    // Если пользователь авторизован, показываем прогресс
    let progress = {};
    if (req.user) {
      // Получаем темы с задачами и отмечаем решенные
      const topicProgress = db.prepare(`
        SELECT DISTINCT t.id, COUNT(DISTINCT c.id) as totalChallenges,
               SUM(CASE WHEN us.isCorrect = 1 THEN 1 ELSE 0 END) as solvedChallenges
        FROM topics t
        LEFT JOIN challenges c ON c.topicId = t.id
        LEFT JOIN user_solutions us ON us.challengeId = c.id AND us.userId = ?
        WHERE t.isPublished = 1
        GROUP BY t.id
      `).all(req.user.id);

      topicProgress.forEach(p => {
        progress[p.id] = {
          total: p.totalChallenges,
          solved: p.solvedChallenges || 0
        };
      });
    }

    const topicsWithProgress = topics.map(topic => ({
      ...topic,
      progress: progress[topic.id] || { total: 0, solved: 0 }
    }));

    res.json({
      success: true,
      topics: topicsWithProgress
    });

  } catch (error) {
    console.error('Topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении тем'
    });
  }
});

// Получение одной темы с задачами
router.get('/topics/:slug', optionalAuth, (req, res) => {
  try {
    const topic = db.prepare(`
      SELECT * FROM topics WHERE slug = ? AND isPublished = 1
    `).get(req.params.slug);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Тема не найдена'
      });
    }

    // Получаем связанные задачи
    const challenges = db.prepare(`
      SELECT id, title, slug, difficulty, xpReward
      FROM challenges WHERE topicId = ? AND isPublished = 1
      ORDER BY difficulty ASC
    `).all(topic.id);

    // Если пользователь авторизован, проверяем решенные задачи
    let solvedIds = [];
    if (req.user && challenges.length > 0) {
      const solved = db.prepare(`
        SELECT DISTINCT challengeId FROM user_solutions 
        WHERE userId = ? AND isCorrect = 1 AND challengeId IN (${challenges.map(() => '?').join(',')})
      `).all(req.user.id, ...challenges.map(c => c.id));
      
      solvedIds = solved.map(s => s.challengeId);
    }

    const challengesWithStatus = challenges.map(c => ({
      ...c,
      solved: solvedIds.includes(c.id)
    }));

    res.json({
      success: true,
      topic: {
        ...topic,
        challenges: challengesWithStatus
      }
    });

  } catch (error) {
    console.error('Topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении темы'
    });
  }
});

// Получение контента темы (для чтения теории)
router.get('/topics/:slug/content', (req, res) => {
  try {
    const topic = db.prepare(`
      SELECT title, content, category, difficulty FROM topics WHERE slug = ?
    `).get(req.params.slug);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Тема не найдена'
      });
    }

    // Генерируем контент если его нет
    const content = topic.content || generateDefaultContent(topic.title, topic.category);

    res.json({
      success: true,
      content: {
        title: topic.title,
        category: topic.category,
        difficulty: topic.difficulty,
        content
      }
    });

  } catch (error) {
    console.error('Topic content error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении контента'
    });
  }
});

// Генерация дефолтного контента для тем
function generateDefaultContent(title, category) {
  const contents = {
    'intro-algorithms': `
# Введение в алгоритмы

## Что такое алгоритм?
Алгоритм — это последовательность инструкций для решения конкретной задачи.

## Пример простого алгоритма
\`\`\`javascript
function findMax(arr) {
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}
\`\`\`

## Почему это важно?
- Алгоритмы — основа программирования
- Правильный алгоритм экономит время и ресурсы
- На собеседованиях часто спрашивают алгоритмы
    `,
    'big-o-notation': `
# Сложность алгоритмов (Big-O)

## Что такое Big-O?
Big-O нотация описывает верхнюю границу времени выполнения алгоритма.

## Основные сложности

| Сложность | Название | Пример |
|-----------|----------|--------|
| O(1) | Константная | Доступ к массиву по индексу |
| O(log n) | Логарифмическая | Бинарный поиск |
| O(n) | Линейная | Простой цикл |
| O(n²) | Квадратичная | Вложенные циклы |

## Практический пример
\`\`\`javascript
// O(n) - линейный поиск
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

// O(log n) - бинарный поиск
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
\`\`\`
    `,
    'arrays-strings': `
# Массивы и строки

## Массивы
Массив — это упорядоченная коллекция элементов.

### Базовые операции
- Доступ по индексу: O(1)
- Добавление в конец: O(1)
- Добавление в начало: O(n)
- Поиск: O(n)

## Строки
Строка — это последовательность символов.

### Частые операции
- Доступ по индексу: O(1)
- Конкатенация: O(n)
- Поиск подстроки: O(n * m)
    `,
    'recursion': `
# Рекурсия

## Что такое рекурсия?
Рекурсия — это когда функция вызывает саму себя.

## Пример: Факториал
\`\`\`javascript
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
\`\`\`

## Базовый случай и рекурсивный случай
- **Базовый случай**: условие выхода из рекурсии
- **Рекурсивный случай**: вызов функции с меньшим аргументом

## Правило
Каждый рекурсивный вызов должен приближать к базовому случаю!
    `
  };

  return contents[title.toLowerCase().replace(/\s+/g, '-')] || `
# ${title}

Добро пожаловать в раздел "${title}"!

Здесь вы найдёте теоретический материал и практические задачи для закрепления знаний.

## Основные концепции
Изучите теорию и решите связанные задачи для полного понимания темы.

## Практика
Переходите к задачам в разделе ниже для практического закрепления материала.
  `;
}

module.exports = router;
