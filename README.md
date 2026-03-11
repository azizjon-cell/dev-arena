# DevArena - AI Code Battle & Learning Platform

Учись программировать, соревнуйся с другими и стань легендой кодинга!

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm или yarn

### Установка и запуск

```bash
# 1. Установите зависимости backend
cd backend
npm install

# 2. Установите зависимости frontend
cd ../frontend
npm install

# 3. Запустите backend (в одном терминале)
cd backend
npm start

# 4. Запустите frontend (в другом терминале)
cd frontend
npm run dev
```

Откройте http://localhost:3000

---

## 🏗️ Архитектура

### Backend (Node.js + Express)

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js          # Конфигурация (PORT, JWT, XP)
│   │   └── database.js     # SQLite (better-sqlite3)
│   ├── middleware/
│   │   └── auth.js         # JWT аутентификация
│   ├── routes/
│   │   ├── auth.js         # Регистрация/логин
│   │   ├── users.js        # Профиль и настройки
│   │   ├── challenges.js   # Задачи и проверка решений
│   │   ├── battles.js      # 1v1 баттлы
│   │   ├── learning.js     # Обучение (темы)
│   │   └── leaderboard.js  # Рейтинг
│   ├── services/
│   │   ├── codeExecutionService.js  # Выполнение кода (VM)
│   │   ├── aiMentorService.js       # AI подсказки (OpenAI)
│   │   └── socketService.js         # WebSocket (Socket.io)
│   └── index.js            # Точка входа
```

### Frontend (Next.js 14 + TailwindCSS)

```
frontend/
├── app/
│   ├── page.js             # Главная (Landing)
│   ├── login/page.js       # Вход
│   ├── register/page.js    # Регистрация
│   ├── practice/page.js    # Практика (решение задач)
│   ├── battle/page.js      # 1v1 баттлы
│   ├── learning/page.js    # Обучение
│   ├── profile/page.js     # Профиль и настройки
│   └── leaderboard/page.js # Рейтинг
├── components/
│   ├── ui/                 # Базовые компоненты
│   ├── editor/             # Monaco Editor
│   ├── battle/             # Компоненты баттлов
│   └── learning/           # Компоненты обучения
├── context/
│   └── store.js            # Zustand store
└── lib/
    └── api.js              # Axios клиент
```

---

## 📦 Основные функции

### 1. Auth & Gamification
- Регистрация/логин с JWT
- XP система и уровни (10 уровней)
- Daily Challenge с бонусом XP
- Streak (серия дней)

### 2. Practice Mode
- 10+ задач разной сложности
- Автоматическая проверка тестов
- AI подсказки (OpenAI API)
- Big-O подсказки

### 3. Battle Mode
- 1v1 в реальном времени (Socket.io)
- Таймер (10 минут)
- Одинаковая задача для обоих
- Определение победителя по тестам

### 4. Learning Module
- 10 тем (алгоритмы, структуры данных)
- Теория с примерами кода
- Связанные практические задачи
- Прогресс по темам

### 5. AI Mentor (опционально)
- Анализ кода пользователя
- Объяснение ошибок
- Подсказки (не решение)
- Оптимизация

Для включения добавьте OPENAI_API_KEY в .env

---

## 🔧 Настройка

### Backend (.env)
```env
PORT=5000
JWT_SECRET=your_secret_key
OPENAI_API_KEY=sk-...  # опционально
```

### Frontend
Редактируйте настройки в профиле:
- Тема (dark/light/neon/cyber)
- Акцентный цвет
- Размер шрифта редактора
- AI подсказки вкл/выкл

---

## 🎮 Использование

1. **Регистрация** - создайте аккаунт
2. **Practice** - решайте задачи, получайте XP
3. **Learning** - изучайте теорию
4. **Battle** - соревнуйтесь 1v1
5. **Profile** - смотрите статистику и настройки

---

## 📝 API Endpoints

### Auth
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `GET /api/auth/me` - текущий пользователь

### Challenges
- `GET /api/challenges` - список задач
- `GET /api/challenges/:slug` - детали задачи
- `POST /api/challenges/:id/submit` - отправить решение
- `GET /api/challenges/:id/hints` - подсказка
- `GET /api/challenges/daily` - ежедневная задача

### Battles
- `POST /api/battles/create` - создать баттл
- `POST /api/battles/join` - присоединиться
- `GET /api/battles/:id` - инфо о баттле
- `POST /api/battles/:id/submit` - отправить решение

### Learning
- `GET /api/learning/categories` - категории
- `GET /api/learning/topics` - темы
- `GET /api/learning/topics/:slug` - контент темы

### Leaderboard
- `GET /api/leaderboard` - общий топ
- `GET /api/leaderboard/weekly` - недельный топ
- `GET /api/leaderboard/wins` - по победам
- `GET /api/leaderboard/streaks` - по streak

---

## 🛠️ Технологии

**Backend:**
- Express.js
- Socket.io
- SQLite (better-sqlite3)
- JWT
- bcryptjs
- OpenAI SDK

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- Monaco Editor
- Zustand
- Framer Motion
- Socket.io Client

---

## 📄 License

MIT
