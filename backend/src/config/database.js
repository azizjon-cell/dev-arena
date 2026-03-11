/**
 * Конфигурация базы данных (SQLite для MVP)
 * Используем better-sqlite3 для синхронной работы
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/devarena.db');
const db = new Database(dbPath);

// Включаем foreign keys
db.pragma('foreign_keys = ON');

// Инициализация таблиц
function initDatabase() {
  console.log('🗄️  Инициализация базы данных...');

  // Users таблица
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT DEFAULT '/avatars/default.png',
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      maxStreak INTEGER DEFAULT 0,
      dailyChallengeCompleted INTEGER DEFAULT 0,
      lastDailyChallenge TEXT,
      theme TEXT DEFAULT 'dark',
      accentColor TEXT DEFAULT '#00ff88',
      editorFontSize INTEGER DEFAULT 14,
      editorTabSize INTEGER DEFAULT 2,
      editorWordWrap INTEGER DEFAULT 1,
      aiHintsEnabled INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Topics таблица (для Learning Module)
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      difficulty TEXT DEFAULT 'easy',
      content TEXT,
      orderIndex INTEGER DEFAULT 0,
      isPublished INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Challenges таблица (практические задачи)
  db.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT DEFAULT 'easy',
      category TEXT,
      starterCode TEXT,
      solution TEXT,
      testCases TEXT,
      hints TEXT,
      xpReward INTEGER DEFAULT 50,
      bigOHint TEXT,
      topicId INTEGER,
      isPublished INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topicId) REFERENCES topics(id)
    )
  `);

  // User Solutions таблица
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_solutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      challengeId INTEGER NOT NULL,
      code TEXT NOT NULL,
      passedTests INTEGER DEFAULT 0,
      totalTests INTEGER DEFAULT 0,
      isCorrect INTEGER DEFAULT 0,
      executionTime INTEGER,
      xpEarned INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (challengeId) REFERENCES challenges(id)
    )
  `);

  // Battles таблица
  db.exec(`
    CREATE TABLE IF NOT EXISTS battles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      battleId TEXT UNIQUE NOT NULL,
      player1Id INTEGER,
      player2Id INTEGER,
      challengeId INTEGER NOT NULL,
      status TEXT DEFAULT 'waiting',
      player1Code TEXT,
      player2Code TEXT,
      player1Status TEXT DEFAULT 'pending',
      player2Status TEXT DEFAULT 'pending',
      player1Score INTEGER DEFAULT 0,
      player2Score INTEGER DEFAULT 0,
      winnerId INTEGER,
      startedAt TEXT,
      endedAt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player1Id) REFERENCES users(id),
      FOREIGN KEY (player2Id) REFERENCES users(id),
      FOREIGN KEY (challengeId) REFERENCES challenges(id)
    )
  `);

  // Battle History для анализа
  db.exec(`
    CREATE TABLE IF NOT EXISTS battle_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      battleId TEXT NOT NULL,
      userId INTEGER NOT NULL,
      opponentId INTEGER NOT NULL,
      challengeId INTEGER NOT NULL,
      result TEXT NOT NULL,
      xpEarned INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (opponentId) REFERENCES users(id),
      FOREIGN KEY (challengeId) REFERENCES challenges(id)
    )
  `);

  // AI Chat History для AI Mentor
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      challengeId INTEGER,
      message TEXT NOT NULL,
      response TEXT,
      type TEXT DEFAULT 'hint',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (challengeId) REFERENCES challenges(id)
    )
  `);

  // Daily Challenges
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challengeId INTEGER NOT NULL,
      date TEXT NOT NULL UNIQUE,
      bonusXp INTEGER DEFAULT 75,
      FOREIGN KEY (challengeId) REFERENCES challenges(id)
    )
  `);

  // Seed начальных данных
  seedData();

  console.log('✅ База данных инициализирована!');
}

function seedData() {
  // Проверяем, есть ли уже данные
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (userCount.count > 0) {
    console.log('📊 Данные уже существуют, пропускаем seed...');
    return;
  }

  console.log('🌱 Начальное заполнение данных...');

  // Темы для Learning Module
  const topics = [
    { title: 'Введение в алгоритмы', slug: 'intro-algorithms', category: 'algorithms', difficulty: 'easy', orderIndex: 1 },
    { title: 'Сложность алгоритмов (Big-O)', slug: 'big-o-notation', category: 'algorithms', difficulty: 'easy', orderIndex: 2 },
    { title: 'Массивы и строки', slug: 'arrays-strings', category: 'data-structures', difficulty: 'easy', orderIndex: 3 },
    { title: 'Связные списки', slug: 'linked-lists', category: 'data-structures', difficulty: 'medium', orderIndex: 4 },
    { title: 'Деревья и графы', slug: 'trees-graphs', category: 'data-structures', difficulty: 'medium', orderIndex: 5 },
    { title: 'Сортировка', slug: 'sorting', category: 'algorithms', difficulty: 'medium', orderIndex: 6 },
    { title: 'Поиск', slug: 'searching', category: 'algorithms', difficulty: 'medium', orderIndex: 7 },
    { title: 'Динамическое программирование', slug: 'dynamic-programming', category: 'algorithms', difficulty: 'hard', orderIndex: 8 },
    { title: 'Рекурсия', slug: 'recursion', category: 'algorithms', difficulty: 'medium', orderIndex: 9 },
    { title: 'Жадные алгоритмы', slug: 'greedy-algorithms', category: 'algorithms', difficulty: 'hard', orderIndex: 10 }
  ];

  const insertTopic = db.prepare(`
    INSERT INTO topics (title, slug, category, difficulty, orderIndex) 
    VALUES (?, ?, ?, ?, ?)
  `);

  topics.forEach(topic => {
    insertTopic.run(topic.title, topic.slug, topic.category, topic.difficulty, topic.orderIndex);
  });

  // Задачи для Practice и Battle
  const challenges = [
    {
      title: 'Sum of Two Numbers',
      slug: 'sum-two-numbers',
      description: 'Напишите функцию, которая принимает два числа и возвращает их сумму.',
      difficulty: 'easy',
      category: 'basics',
      starterCode: 'function sum(a, b) {\n  // Ваш код здесь\n}',
      solution: 'function sum(a, b) {\n  return a + b;\n}',
      testCases: JSON.stringify([
        { input: [1, 2], expected: 3 },
        { input: [5, 3], expected: 8 },
        { input: [-1, 1], expected: 0 },
        { input: [0, 0], expected: 0 }
      ]),
      hints: JSON.stringify([
        'Используйте оператор + для сложения двух чисел',
        'Функция должна возвращать результат сложения'
      ]),
      xpReward: 30,
      bigOHint: 'O(1) - константное время'
    },
    {
      title: 'Find Maximum',
      slug: 'find-maximum',
      description: 'Напишите функцию, которая находит максимальный элемент в массиве.',
      difficulty: 'easy',
      category: 'arrays',
      starterCode: 'function findMax(arr) {\n  // Ваш код здесь\n}',
      solution: 'function findMax(arr) {\n  if (arr.length === 0) return null;\n  return Math.max(...arr);\n}',
      testCases: JSON.stringify([
        { input: [[1, 5, 3]], expected: 5 },
        { input: [[-1, -5, -3]], expected: -1 },
        { input: [[42]], expected: 42 }
      ]),
      hints: JSON.stringify([
        'Используйте Math.max с spread оператором',
        'Рассмотрите случай пустого массива'
      ]),
      xpReward: 40,
      bigOHint: 'O(n) - линейное время'
    },
    {
      title: 'Palindrome Check',
      slug: 'palindrome-check',
      description: 'Напишите функцию, которая проверяет, является ли строка палиндромом.',
      difficulty: 'easy',
      category: 'strings',
      starterCode: 'function isPalindrome(str) {\n  // Ваш код здесь\n}',
      solution: 'function isPalindrome(str) {\n  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return cleaned === cleaned.split("").reverse().join("");\n}',
      testCases: JSON.stringify([
        { input: ['racecar'], expected: true },
        { input: ['hello'], expected: false },
        { input: ['A man a plan a canal Panama'], expected: true }
      ]),
      hints: JSON.stringify([
        'Сначала очистите строку от не букв',
        'Сравните строку с её реверсом'
      ]),
      xpReward: 50,
      bigOHint: 'O(n) - линейное время'
    },
    {
      title: 'FizzBuzz',
      slug: 'fizzbuzz',
      description: 'Напишите функцию, которая возвращает массив строк от 1 до n, где числа кратные 3 заменяются на "Fizz", кратные 5 - на "Buzz", а кратные и 3 и 5 - на "FizzBuzz".',
      difficulty: 'easy',
      category: 'basics',
      starterCode: 'function fizzBuzz(n) {\n  // Ваш код здесь\n}',
      solution: 'function fizzBuzz(n) {\n  const result = [];\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) result.push("FizzBuzz");\n    else if (i % 3 === 0) result.push("Fizz");\n    else if (i % 5 === 0) result.push("Buzz");\n    else result.push(String(i));\n  }\n  return result;\n}',
      testCases: JSON.stringify([
        { input: [3], expected: ['1', '2', 'Fizz'] },
        { input: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'] },
        { input: [15], expected: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'] }
      ]),
      hints: JSON.stringify([
        'Проверьте сначала делимость на 15 (3 и 5)',
        'Используйте цикл for'
      ]),
      xpReward: 50,
      bigOHint: 'O(n) - линейное время'
    },
    {
      title: 'Two Sum',
      slug: 'two-sum',
      description: 'Напишите функцию, которая принимает массив чисел и целевую сумму. Верните индексы двух чисел, которые в сумме дают целевую сумму.',
      difficulty: 'medium',
      category: 'arrays',
      starterCode: 'function twoSum(nums, target) {\n  // Ваш код здесь\n}',
      solution: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}',
      testCases: JSON.stringify([
        { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
        { input: [[3, 2, 4], 6], expected: [1, 2] },
        { input: [[3, 3], 6], expected: [0, 1] }
      ]),
      hints: JSON.stringify([
        'Используйте HashMap для хранения индексов',
        'Ищите дополнение (target - current)'
      ]),
      xpReward: 75,
      bigOHint: 'O(n) - линейное время, O(n) памяти'
    },
    {
      title: 'Reverse Linked List',
      slug: 'reverse-linked-list',
      description: 'Напишите функцию, которая разворачивает связный список.',
      difficulty: 'medium',
      category: 'data-structures',
      starterCode: 'function reverseList(head) {\n  // Ваш код здесь\n}',
      solution: 'function reverseList(head) {\n  let prev = null;\n  let current = head;\n  while (current) {\n    const next = current.next;\n    current.next = prev;\n    prev = current;\n    current = next;\n  }\n  return prev;\n}',
      testCases: JSON.stringify([
        { input: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
        { input: [[1, 2]], expected: [2, 1] },
        { input: [[]], expected: [] }
      ]),
      hints: JSON.stringify([
        'Используйте три указателя: prev, current, next',
        'Меняйте направление указателей по очереди'
      ]),
      xpReward: 80,
      bigOHint: 'O(n) - линейное время, O(1) памяти'
    },
    {
      title: 'Binary Search',
      slug: 'binary-search',
      description: 'Напишите функцию бинарного поиска, которая находит индекс элемента в отсортированном массиве.',
      difficulty: 'medium',
      category: 'algorithms',
      starterCode: 'function binarySearch(arr, target) {\n  // Ваш код здесь\n}',
      solution: 'function binarySearch(arr, target) {\n  let left = 0;\n  let right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}',
      testCases: JSON.stringify([
        { input: [[1, 2, 3, 4, 5], 3], expected: 2 },
        { input: [[1, 2, 3, 4, 5], 6], expected: -1 },
        { input: [[], 1], expected: -1 }
      ]),
      hints: JSON.stringify([
        'Используйте два указателя: left и right',
        'Делите массив пополам на каждой итерации'
      ]),
      xpReward: 70,
      bigOHint: 'O(log n) - логарифмическое время'
    },
    {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      description: 'Напишите функцию, которая проверяет, являются ли скобки в строке валидными.',
      difficulty: 'medium',
      category: 'strings',
      starterCode: 'function isValid(s) {\n  // Ваш код здесь\n}',
      solution: 'function isValid(s) {\n  const stack = [];\n  const map = { ")": "(", "]": "[", "}": "{" };\n  for (const char of s) {\n    if (char in map) {\n      if (stack.pop() !== map[char]) return false;\n    } else {\n      stack.push(char);\n    }\n  }\n  return stack.length === 0;\n}',
      testCases: JSON.stringify([
        { input: ['()'], expected: true },
        { input: ['()[]{}'], expected: true },
        { input: ['(]'], expected: false },
        { input: ['([)]'], expected: false }
      ]),
      hints: JSON.stringify([
        'Используйте стек для отслеживания открывающих скобок',
        'Для каждой закрывающей проверяйте верх стека'
      ]),
      xpReward: 65,
      bigOHint: 'O(n) - линейное время, O(n) памяти'
    },
    {
      title: 'Merge Sorted Arrays',
      slug: 'merge-sorted-arrays',
      description: 'Напишите функцию, которая объединяет два отсортированных массива в один отсортированный массив.',
      difficulty: 'medium',
      category: 'arrays',
      starterCode: 'function mergeSortedArrays(arr1, arr2) {\n  // Ваш код здесь\n}',
      solution: 'function mergeSortedArrays(arr1, arr2) {\n  const result = [];\n  let i = 0, j = 0;\n  while (i < arr1.length && j < arr2.length) {\n    if (arr1[i] <= arr2[j]) {\n      result.push(arr1[i++]);\n    } else {\n      result.push(arr2[j++]);\n    }\n  }\n  return [...result, ...arr1.slice(i), ...arr2.slice(j)];\n}',
      testCases: JSON.stringify([
        { input: [[1, 3, 5], [2, 4, 6]], expected: [1, 2, 3, 4, 5, 6] },
        { input: [[], [1]], expected: [1] },
        { input: [[1], []], expected: [1] }
      ]),
      hints: JSON.stringify([
        'Используйте два указателя для обхода массивов',
        'Сравнивайте элементы и добавляйте меньший'
      ]),
      xpReward: 60,
      bigOHint: 'O(n + m) - линейное время'
    },
    {
      title: 'Climbing Stairs',
      slug: 'climbing-stairs',
      description: 'Напишите функцию, которая считает количество способов подняться по лестнице из n ступенек, если можно брать 1 или 2 шага за раз.',
      difficulty: 'hard',
      category: 'dynamic-programming',
      starterCode: 'function climbStairs(n) {\n  // Ваш код здесь\n}',
      solution: 'function climbStairs(n) {\n  if (n <= 2) return n;\n  let prev1 = 2, prev2 = 1;\n  for (let i = 3; i <= n; i++) {\n    const current = prev1 + prev2;\n    prev2 = prev1;\n    prev1 = current;\n  }\n  return prev1;\n}',
      testCases: JSON.stringify([
        { input: [2], expected: 2 },
        { input: [3], expected: 3 },
        { input: [5], expected: 8 }
      ]),
      hints: JSON.stringify([
        'Это последовательность Фибоначчи',
        'Используйте динамическое программирование с O(1) памяти'
      ]),
      xpReward: 100,
      bigOHint: 'O(n) - линейное время, O(1) памяти'
    }
  ];

  const insertChallenge = db.prepare(`
    INSERT INTO challenges (title, slug, description, difficulty, category, starterCode, solution, testCases, hints, xpReward, bigOHint)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  challenges.forEach(ch => {
    insertChallenge.run(
      ch.title, ch.slug, ch.description, ch.difficulty, ch.category,
      ch.starterCode, ch.solution, ch.testCases, ch.hints, ch.xpReward, ch.bigOHint
    );
  });

  // Устанавливаем первую задачу как Daily Challenge
  const today = new Date().toISOString().split('T')[0];
  db.prepare('INSERT INTO daily_challenges (challengeId, date, bonusXp) VALUES (?, ?, ?)').run(1, today, 75);

  console.log('✅ Начальные данные загружены!');
}

module.exports = { db, initDatabase };
