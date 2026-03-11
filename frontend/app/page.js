/**
 * Главная страница - Landing Page
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStore } from '../context/store';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Code2, 
  Trophy, 
  Brain, 
  Users, 
  Zap, 
  Target,
  Flame,
  Crown,
  ChevronRight,
  Sword,
  BookOpen,
  Play,
  Star
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Mentor',
    description: 'Персональный AI-помощник, который объясняет ошибки и подсказывает решения',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Sword,
    title: 'Live Battle',
    description: 'Соревнуйся в реальном времени с другими программистами',
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: BookOpen,
    title: 'Learning',
    description: 'Изучай алгоритмы и структуры данных с практикой',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Trophy,
    title: 'XP & Levels',
    description: 'Зарабай XP, повышай уровень и становись легендой',
    color: 'from-yellow-500 to-amber-500',
  },
];

const stats = [
  { value: '10K+', label: 'Активных игроков', icon: Users },
  { value: '500+', label: 'Задач', icon: Code2 },
  { value: '50+', label: 'Тем для изучения', icon: BookOpen },
  { value: '24/7', label: 'AI Mentor', icon: Brain },
];

export default function HomePage() {
  const { isAuthenticated, user } = useStore();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-lg border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-dark-bg" />
              </div>
              <span className="text-xl font-bold">
                Dev<span className="text-primary">Arena</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/practice" className="text-gray-300 hover:text-primary transition-colors">
                Практика
              </Link>
              <Link href="/learning" className="text-gray-300 hover:text-primary transition-colors">
                Обучение
              </Link>
              <Link href="/battle" className="text-gray-300 hover:text-primary transition-colors">
                Баттлы
              </Link>
              <Link href="/leaderboard" className="text-gray-300 hover:text-primary transition-colors">
                Рейтинг
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/profile">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border hover:border-primary transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{user?.username}</span>
                    <span className="text-xs text-primary">{user?.xp} XP</span>
                  </div>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <button className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
                      Войти
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="px-4 py-2 text-sm bg-primary text-dark-bg rounded-lg font-medium hover:bg-primary-dark transition-colors">
                      Регистрация
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark-card border border-dark-border mb-8">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-gray-300">AI-powered обучение программированию</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Стань <span className="text-primary neon-text">легендой</span>
              <br />кодинга
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Учись программировать с AI Mentor, соревнуйся в баттлах и прокачивай 
              свои навыки вместе с тысячами разработчиков
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/practice">
                    <button className="px-8 py-4 bg-primary text-dark-bg rounded-xl font-bold text-lg hover:bg-primary-dark transition-all glow-primary">
                      <Play className="w-5 h-5 inline mr-2" />
                      Начать практику
                    </button>
                  </Link>
                  <Link href="/battle">
                    <button className="px-8 py-4 bg-dark-card border border-dark-border rounded-xl font-bold text-lg hover:border-primary transition-all">
                      <Sword className="w-5 h-5 inline mr-2" />
                      Найти баттл
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register">
                    <button className="px-8 py-4 bg-primary text-dark-bg rounded-xl font-bold text-lg hover:bg-primary-dark transition-all glow-primary">
                      Начать бесплатно
                    </button>
                  </Link>
                  <Link href="/practice">
                    <button className="px-8 py-4 bg-dark-card border border-dark-border rounded-xl font-bold text-lg hover:border-primary transition-all">
                      Попробовать демо
                    </button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
          >
            {stats.map((stat, index) => (
              <Card key={index} className="text-center py-6">
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Всё для <span className="text-primary">прокачки</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Получи всё необходимое для развития программистских навыков
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Daily Challenge CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">Daily Challenge</h3>
                  <p className="text-gray-400">Решай ежедневную задачу и получай бонус XP</p>
                </div>
              </div>
              <Link href="/practice?daily=true">
                <Button size="lg">
                  <Flame className="w-5 h-5" />
                  Начать
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-20 bg-dark-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Топ игроков</h2>
              <p className="text-gray-400">Самые активные разработчики платформы</p>
            </div>
            <Link href="/leaderboard">
              <Button variant="secondary">
                Полный рейтинг
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((place) => (
              <Card key={place} className="text-center py-8 relative">
                {place === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                )}
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold
                  ${place === 1 ? 'bg-yellow-500/20 text-yellow-500' : 
                    place === 2 ? 'bg-gray-400/20 text-gray-400' : 
                    'bg-orange-600/20 text-orange-600'}`}
                >
                  {place}
                </div>
                <h3 className="text-lg font-semibold">Player{place}</h3>
                <p className="text-primary font-bold">{5000 - place * 500} XP</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Code2 className="w-4 h-4 text-dark-bg" />
              </div>
              <span className="font-bold">DevArena</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 DevArena. Учись, соревнуйся, побеждай.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
