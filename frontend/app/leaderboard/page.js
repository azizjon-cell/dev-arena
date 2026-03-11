/**
 * Leaderboard Page - Таблица лидеров
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStore } from '../../context/store';
import { leaderboardAPI } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Trophy, Crown, Flame, TrendingUp, Users,
  Medal, Star, ChevronRight
} from 'lucide-react';

const tabs = [
  { id: 'global', label: 'Общий', icon: Trophy },
  { id: 'weekly', label: 'Неделя', icon: TrendingUp },
  { id: 'wins', label: 'Победы', icon: Medal },
  { id: 'streaks', label: 'Streak', icon: Flame },
];

export default function LeaderboardPage() {
  const { isAuthenticated, user } = useStore();
  
  const [activeTab, setActiveTab] = useState('global');
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'weekly':
          response = await leaderboardAPI.getWeekly();
          break;
        case 'wins':
          response = await leaderboardAPI.getWins();
          break;
        case 'streaks':
          response = await leaderboardAPI.getStreaks();
          break;
        default:
          response = await leaderboardAPI.getGlobal();
      }
      
      if (response.data.success) {
        setLeaderboard(response.data.leaderboard);
        setUserRank(response.data.userRank);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/30';
    if (rank === 2) return 'bg-gray-400/10 border-gray-400/30';
    if (rank === 3) return 'bg-orange-600/10 border-orange-600/30';
    return 'bg-dark-card border-dark-border';
  };

  return (
    <div className="min-h-screen bg-dark-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-500" />
            Рейтинг
          </h1>
          <p className="text-gray-400">Топ игроков DevArena</p>
        </div>

        {/* User Rank Card */}
        {isAuthenticated && userRank && userRank <= 100 && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">Ваша позиция</div>
                  <div className="text-sm text-gray-400">{user?.username}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">#{userRank}</div>
                <div className="text-sm text-gray-400">в общем зачёте</div>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-dark-bg'
                    : 'bg-dark-card border border-dark-border hover:border-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Leaderboard List */}
        <Card>
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">
              Загрузка рейтинга...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Пока нет данных</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {leaderboard.map((player, index) => {
                const rank = index + 1;
                const isCurrentUser = isAuthenticated && player.id === user?.id;
                
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 ${
                      isCurrentUser ? 'bg-primary/10' : ''
                    } ${getRankColor(rank)} rounded-lg mb-2`}
                  >
                    {/* Rank */}
                    <div className="w-12 flex justify-center">
                      {getRankIcon(rank)}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-dark-bg flex items-center justify-center text-lg font-bold text-primary">
                      {player.username?.[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        {player.username}
                        {player.title && (
                          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {player.title}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {activeTab === 'wins' && `${player.wins} побед`}
                        {activeTab === 'streaks' && `${player.maxStreak} дней`}
                        {activeTab === 'weekly' && `${player.battlesPlayed || 0} баттлов`}
                        {activeTab === 'global' && `${player.xp} XP`}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      {activeTab === 'global' && (
                        <div className="text-xl font-bold text-primary">{player.xp}</div>
                      )}
                      {activeTab === 'wins' && (
                        <div className="text-xl font-bold text-green-400">{player.wins}</div>
                      )}
                      {activeTab === 'streaks' && (
                        <div className="flex items-center gap-1 text-xl font-bold text-orange-400">
                          <Flame className="w-5 h-5" />
                          {player.maxStreak}
                        </div>
                      )}
                      {activeTab === 'weekly' && (
                        <div className="text-xl font-bold text-primary">{player.xp}</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/practice">
            <Button variant="secondary">
              <TrendingUp className="w-4 h-4" />
              К практике
            </Button>
          </Link>
          <Link href="/battle">
            <Button>
              <Trophy className="w-4 h-4" />
              Начать баттл
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
