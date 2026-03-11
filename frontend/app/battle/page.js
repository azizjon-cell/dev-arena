/**
 * Battle Page - 1v1 соревнования
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useStore } from '../../context/store';
import { battlesAPI } from '../../lib/api';
import { CodeEditor } from '../../components/editor/CodeEditor';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Sword, Users, Clock, Play, Trophy, 
  ChevronRight, X, Zap, CheckCircle, XCircle,
  User, Ghost
} from 'lucide-react';

let socket = null;

export default function BattlePage() {
  const router = useRouter();
  const { isAuthenticated, user, settings } = useStore();
  
  const [mode, setMode] = useState('lobby'); // lobby, waiting, battle, result
  const [availableBattles, setAvailableBattles] = useState([]);
  const [currentBattle, setCurrentBattle] = useState(null);
  const [battleId, setBattleId] = useState('');
  const [code, setCode] = useState('');
  const [mySide, setMySide] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [opponentTyping, setOpponentTyping] = useState(false);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');

  // Инициализация socket
  useEffect(() => {
    if (!isAuthenticated || mode !== 'battle') return;

    socket = io('http://localhost:5000', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('join-battle', {
        battleId: currentBattle.battleId,
        userId: user.id,
        username: user.username,
      });
    });

    socket.on('player-joined', (data) => {
      console.log('Player joined:', data);
    });

    socket.on('player-typing', (data) => {
      setOpponentTyping(data.isTyping);
    });

    socket.on('solution-submitted', (data) => {
      // Обновляем статус противника
      console.log('Opponent submitted:', data);
    });

    socket.on('timer-update', (data) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on('battle-ended', (data) => {
      if (data.reason === 'timeout') {
        handleFinishBattle();
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, mode]);

  // Polling для статуса баттла
  useEffect(() => {
    if (mode !== 'battle' || !currentBattle) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await battlesAPI.getStatus(currentBattle.battleId);
        if (data.success) {
          if (data.battle.status === 'finished') {
            setResult({
              myScore: mySide === 'player1' ? data.battle.player1Score : data.battle.player2Score,
              opponentScore: mySide === 'player1' ? data.battle.player2Score : data.battle.player1Score,
              winnerId: data.battle.winnerId,
            });
            setMode('result');
          }
        }
      } catch (error) {
        console.error('Failed to get status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [mode, currentBattle]);

  // Загрузка доступных баттлов
  const loadAvailableBattles = async () => {
    try {
      const { data } = await battlesAPI.getAvailable();
      if (data.success) {
        setAvailableBattles(data.battles);
      }
    } catch (error) {
      console.error('Failed to load battles:', error);
    }
  };

  useEffect(() => {
    if (mode === 'lobby') {
      loadAvailableBattles();
      const interval = setInterval(loadAvailableBattles, 5000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  // Создание баттла
  const createBattle = async () => {
    try {
      const { data } = await battlesAPI.create(difficulty);
      if (data.success) {
        setCurrentBattle(data.battle);
        setCode(data.battle.challenge.starterCode || '');
        setMySide('player1');
        setMode('waiting');
        setBattleId(data.battle.battleId);
        
        // Начинаем ожидание противника
        pollForOpponent(data.battle.battleId);
      }
    } catch (error) {
      console.error('Failed to create battle:', error);
    }
  };

  // Ожидание противника (polling)
  const pollForOpponent = async (battleId) => {
    const checkInterval = setInterval(async () => {
      try {
        const { data } = await battlesAPI.getStatus(battleId);
        if (data.success && data.battle.status === 'active') {
          clearInterval(checkInterval);
          setMode('battle');
        }
      } catch (error) {
        console.error('Failed to check battle:', error);
      }
    }, 2000);
  };

  // Присоединение к баттлу
  const joinBattle = async (battleId) => {
    try {
      const { data } = await battlesAPI.join(battleId);
      if (data.success) {
        setCurrentBattle(data.battle);
        setCode(data.battle.challenge.starterCode || '');
        setMySide('player2');
        setBattleId(battleId);
        setMode('battle');
      }
    } catch (error) {
      console.error('Failed to join battle:', error);
    }
  };

  // Отправка кода
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    
    // Уведомляем о печати
    if (socket) {
      socket.emit('typing', {
        battleId: currentBattle.battleId,
        player: mySide,
        isTyping: true,
      });
    }
  };

  // Завершение (сдача решения)
  const handleFinishBattle = async () => {
    setIsSubmitting(true);
    try {
      const { data } = await battlesAPI.submitCode(currentBattle.battleId, code, true);
      if (data.success) {
        setResult({
          myScore: data.battle[mySide === 'player1' ? 'player1Score' : 'player2Score'],
          opponentScore: data.battle[mySide === 'player1' ? 'player2Score' : 'player1Score'],
          winnerId: data.battle.winnerId,
        });
        setMode('result');
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Форматирование времени
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center max-w-md">
          <Sword className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Войдите для баттла</h2>
          <p className="text-gray-400 mb-6">
            Соревнуйтесь 1v1 в реальном времени и докажите, что вы лучший!
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/login')}>Войти</Button>
            <Button variant="secondary" onClick={() => router.push('/register')}>
              Регистрация
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="border-b border-dark-border bg-dark-card p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sword className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Battle Arena</h1>
          </div>
          
          {mode === 'battle' && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className={`text-2xl font-mono font-bold ${
                  timeLeft < 60 ? 'text-red-400' : 'text-white'
                }`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Button onClick={handleFinishBattle} disabled={isSubmitting}>
                <Trophy className="w-4 h-4" />
                Завершить
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Lobby Mode */}
        {mode === 'lobby' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Battle */}
            <Card>
              <CardHeader>
                <CardTitle>Создать баттл</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Сложность</label>
                    <div className="flex gap-2">
                      {['easy', 'medium', 'hard'].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`flex-1 py-2 rounded-lg border transition-colors ${
                            difficulty === d
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-dark-border text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {d === 'easy' ? 'Легко' : d === 'medium' ? 'Средне' : 'Сложно'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={createBattle} className="w-full">
                    <Sword className="w-4 h-4" />
                    Создать комнату
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Available Battles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Доступные баттлы
                  <Users className="w-5 h-5 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableBattles.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Ghost className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Нет доступных баттлов</p>
                    <p className="text-sm">Создайте свой или подождите других игроков</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableBattles.map((battle) => (
                      <div
                        key={battle.battleId}
                        className="p-3 bg-dark-bg rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{battle.player1Username}</div>
                          <div className="text-sm text-gray-400">{battle.challengeTitle}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            battle.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                            battle.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {battle.difficulty}
                          </span>
                          <Button size="sm" onClick={() => joinBattle(battle.battleId)}>
                            Присоединиться
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Waiting Mode */}
        {mode === 'waiting' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ожидание противника</h2>
              <p className="text-gray-400 mb-4">
                Поделитесь кодом комнаты с другом:
              </p>
              <div className="bg-dark-bg p-4 rounded-lg font-mono text-2xl tracking-widest mb-4">
                {battleId}
              </div>
              <p className="text-sm text-gray-500">
                Или ждите случайного противника...
              </p>
              <Button 
                variant="secondary" 
                className="mt-4"
                onClick={() => setMode('lobby')}
              >
                Отмена
              </Button>
            </Card>
          </div>
        )}

        {/* Battle Mode */}
        {mode === 'battle' && currentBattle && (
          <div className="flex gap-4">
            {/* Challenge Info */}
            <div className="w-80">
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">{currentBattle.challenge.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 mb-4">
                    {currentBattle.challenge.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-1 rounded ${
                      currentBattle.challenge.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                      currentBattle.challenge.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {currentBattle.challenge.difficulty}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Opponent Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {mySide === 'player1' ? 'Противник' : 'Вы'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {opponentTyping ? (
                    <div className="flex items-center gap-2 text-primary">
                      <span className="animate-pulse">Печатает...</span>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      {mySide === 'player1' ? 'Ожидание игрока...' : 'Готов к бою!'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Editor */}
            <div className="flex-1">
              <CodeEditor
                value={code}
                onChange={handleCodeChange}
                height="calc(100vh - 200px)"
              />
            </div>
          </div>
        )}

        {/* Result Mode */}
        {mode === 'result' && result && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="text-center max-w-md">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                result.winnerId === user.id 
                  ? 'bg-green-500/20' 
                  : result.myScore === result.opponentScore
                  ? 'bg-yellow-500/20'
                  : 'bg-red-500/20'
              }`}>
                {result.winnerId === user.id ? (
                  <Trophy className="w-12 h-12 text-green-400" />
                ) : result.myScore === result.opponentScore ? (
                  <Users className="w-12 h-12 text-yellow-400" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-400" />
                )}
              </div>
              
              <h2 className="text-3xl font-bold mb-2">
                {result.winnerId === user.id 
                  ? 'Победа!' 
                  : result.myScore === result.opponentScore
                  ? 'Ничья!'
                  : 'Поражение'}
              </h2>
              
              <div className="flex items-center justify-center gap-8 my-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{result.myScore}</div>
                  <div className="text-sm text-gray-400">Ваш счёт</div>
                </div>
                <div className="text-2xl text-gray-500">vs</div>
                <div className="text-center">
                  <div className="text-4xl font-bold">{result.opponentScore}</div>
                  <div className="text-sm text-gray-400">Счёт противника</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={() => {
                  setMode('lobby');
                  setCurrentBattle(null);
                  setResult(null);
                }}>
                  Новый баттл
                </Button>
                <Button variant="secondary" onClick={() => router.push('/practice')}>
                  К практике
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
