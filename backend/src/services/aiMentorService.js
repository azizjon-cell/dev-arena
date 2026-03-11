/**
 * AI Mentor Service - AI помощник для анализа кода и подсказок
 * Использует OpenAI API для генерации подсказок и объяснений
 */

const { OPENAI_API_KEY } = require('../config/env');
const { db } = require('../config/database');

// Проверка доступности OpenAI
const isOpenAIAvailable = OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-');

// Системный промпт для AI Mentor
const SYSTEM_PROMPT = `Ты — AI Mentor в DevArena, платформе для изучения алгоритмов и соревнований по программированию.

Твоя роль:
- Помогать пользователям понять их ошибки
- Давать подсказки, но НЕ решать задачу за них
- Объяснять концепции простым языком
- Предлагать оптимизации кода
- Подсказывать направление решения

Правила:
1. НЕ давай готовое решение
2. Направляй пользователя к ответу
3. Объясняй, ПОЧЕМУ что-то не работает
4. Предлагай альтернативные подходы
5. Если пользователь просит решение — вежливо откажи

Стиль:
- Будь дружелюбным и мотивирующим
- Используй примеры кода для объяснений
- Объясняй сложные вещи простыми словами
- Поощряй пользователя продолжать
`;

// Получить подсказку для задачи
async function getHint(userId, challenge, hintIndex) {
  if (!isOpenAIAvailable) {
    return getDefaultHint(challenge, hintIndex);
  }

  const hints = JSON.parse(challenge.hints || '[]');
  const previousHint = hintIndex > 0 ? hints[hintIndex - 1] : null;

  const prompt = `
Задача: ${challenge.title}
Сложность: ${challenge.difficulty}
Описание: ${challenge.description}
${challenge.bigOHint ? `Подсказка по сложности: ${challenge.bigOHint}` : ''}

${previousHint ? `Предыдущая подсказка: ${previousHint}` : ''}

Пользователь запросил подсказку #${hintIndex + 1}.
Дай направление для решения, но НЕ давай готовое решение.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('OpenAI API error:', error);
    return getDefaultHint(challenge, hintIndex);
  }
}

// Анализ кода пользователя
async function analyzeCode(userId, code, challenge) {
  if (!isOpenAIAvailable) {
    return getCodeAnalysisFallback(code, challenge);
  }

  const prompt = `
Проанализируй код пользователя для задачи:
Задача: ${challenge.title}
Описание: ${challenge.description}

Код пользователя:
\`\`\`javascript
${code}
\`\`\`

Проанализируй:
1. Есть ли синтаксические ошибки?
2. Логика решения правильная?
3. Какие могут быть проблемы?
4. Предложи направление для исправления (без готового решения)
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Сохраняем анализ в историю
    db.prepare(`
      INSERT INTO ai_conversations (userId, challengeId, message, response, type)
      VALUES (?, ?, ?, ?, 'analysis')
    `).run(userId, challenge.id, 'Анализ кода', analysis);

    return analysis;

  } catch (error) {
    console.error('Code analysis error:', error);
    return getCodeAnalysisFallback(code, challenge);
  }
}

// Объяснение ошибки
async function explainError(userId, error, code) {
  if (!isOpenAIAvailable) {
    return `Ошибка: ${error}. Проверь синтаксис кода и убедись, что все переменные определены.`;
  }

  const prompt = `
Пользователь получил ошибку при выполнении кода:

Ошибка: ${error}

Код:
\`\`\`javascript
${code}
\`\`\`

Объясни:
1. Что означает эта ошибка
2. Почему она возникла
3. Как её исправить (направление, не готовое решение)
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    return `Ошибка: ${error}. Проверь синтаксис кода.`;
  }
}

// Оптимизация кода
async function suggestOptimization(userId, code, challenge) {
  if (!isOpenAIAvailable) {
    return `Текущая сложность: ${challenge.bigOHint || 'неизвестно'}. Попробуй найти более эффективный подход.`;
  }

  const prompt = `
Проанализируй код и предложи оптимизацию:

Задача: ${challenge.title}
Сложность: ${challenge.bigOHint || 'неизвестно'}

Код:
\`\`\`javascript
${code}
\`\`\`

Предложи:
1. Текущая сложность
2. Возможная оптимизация
3. Направление для улучшения (без готового кода)
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    return 'Не удалось получить оптимизацию. Попробуй подумать о более эффективном подходе.';
  }
}

// Fallback подсказки (когда нет OpenAI)
function getDefaultHint(challenge, hintIndex) {
  const hints = JSON.parse(challenge.hints || '[]');
  
  if (hintIndex < hints.length) {
    return hints[hintIndex];
  }

  // Генерируем подсказку на основе задачи
  const hintTemplates = {
    easy: [
      'Попробуй внимательно перечитать условие задачи.',
      'Разбей задачу на smaller части.',
      'Проверь, все ли edge cases учтены.',
      'Попробуй написать решение на бумаге сначала.'
    ],
    medium: [
      'Попробуй использовать дополнительную структуру данных.',
      'Подумай о временной сложности.',
      'Рассмотри разные подходы к решению.',
      'Проверь граничные случаи.'
    ],
    hard: [
      'Попробуй динамическое программирование.',
      'Рассмотри жадный подход.',
      'Попробуй рекурсию с мемоизацией.',
      'Разбей задачу на подзадачи.'
    ]
  };

  const templateHints = hintTemplates[challenge.difficulty] || hintTemplates.easy;
  return templateHints[hintIndex % templateHints.length];
}

// Fallback анализ кода
function getCodeAnalysisFallback(code, challenge) {
  const analysis = [];

  // Базовая проверка синтаксиса
  try {
    new Function(code);
    analysis.push('✓ Синтаксис кода выглядит корректно.');
  } catch (e) {
    analysis.push(`✗ Синтаксическая ошибка: ${e.message}`);
  }

  // Проверка на наличие return
  if (!code.includes('return')) {
    analysis.push('⚠ Функция может не возвращать результат.');
  }

  // Проверка на цикл
  if (!code.includes('for') && !code.includes('while') && !code.includes('map') && !code.includes('reduce')) {
    analysis.push('💡 Подумай, нужен ли цикл для перебора элементов.');
  }

  // Добавляем подсказку по сложности
  if (challenge.bigOHint) {
    analysis.push(`📊 Подсказка по сложности: ${challenge.bigOHint}`);
  }

  return analysis.join('\n\n');
}

module.exports = {
  getHint,
  analyzeCode,
  explainError,
  suggestOptimization,
  isOpenAIAvailable
};
