/**
 * Practice Page - Решение задач
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../context/store';
import { challengesAPI } from '../../lib/api';
import { CodeEditor } from '../../components/editor/CodeEditor';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Code2, Play, Lightbulb, CheckCircle, XCircle, 
  Clock, ChevronLeft, ChevronRight, Target, 
  AlertTriangle, Zap, BookOpen
} from 'lucide-react';

const difficultyColors = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function PracticePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, settings } = useStore();
  
  const [challenges, setChallenges] = useState([]);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [hints, setHints] = useState([]);
  const [currentHint, setCurrentHint] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [filter, setFilter] = useState({ difficulty: '', category: '' });

  // Загрузка списка задач
  useEffect(() => {
    loadChallenges();
  }, [filter]);

  // Загрузка daily challenge
  useEffect(() => {
    const daily = searchParams.get('daily');
    if (daily === 'true') {
      loadDailyChallenge();
    }
  }, [searchParams]);

  const loadChallenges = async () => {
    setIsLoading(true);
    try {
      const { data } = await challengesAPI.getAll(filter);
      if (data.success) {
        setChallenges(data.challenges);
        if (!currentChallenge && data.challenges.length > 0) {
          selectChallenge(data.challenges[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDailyChallenge = async () => {
    setIsLoading(true);
    try {
      const { data } = await challengesAPI.getDaily();
      if (data.success && data.challenge) {
        selectChallenge(data.challenge);
      }
    } catch (error) {
      console.error('Failed to load daily challenge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectChallenge = async (challenge) => {
    setIsLoading(true);
    setResult(null);
    setHints([]);
    setCurrentHint(0);
    setShowHints(false);
    
    try {
      const { data } = await challengesAPI.getOne(challenge.slug);
      if (data.success) {
        setCurrentChallenge(data.challenge);
        setCode(data.challenge.starterCode || '');
      }
    } catch (error) {
      console.error('Failed to load challenge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentChallenge || !isAuthenticated) return;
    
    setIsSubmitting(true);
    setResult(null);
    
    try {
      const { data } = await challengesAPI.submit(currentChallenge.id, code);
      if (data.success) {
        setResult(data.result);
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetHint = async () => {
    if (!currentChallenge || !isAuthenticated) return;
    
    try {
      const { data } = await challengesAPI.getHints(currentChallenge.id, currentHint);
      if (data.success) {
        setHints([...hints, data.hint]);
        setCurrentHint(currentHint + 1);
        setShowHints(true);
      }
    } catch (error) {
      console.error('Failed to get hint:', error);
    }
  };

  const getNextChallenge = () => {
    const currentIndex = challenges.findIndex(c => c.id === currentChallenge?.id);
    if (currentIndex < challenges.length - 1) {
      selectChallenge(challenges[currentIndex + 1]);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center max-w-md">
          <Target className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Войдите для практики</h2>
          <p className="text-gray-400 mb-6">
            Регистрация бесплатна. Решайте задачи, получайте XP и повышайте уровень!
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button>Войти</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary">Регистрация</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Список задач */}
      <div className="w-80 border-r border-dark-border bg-dark-card flex flex-col">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-lg font-bold mb-4">Задачи</h2>
          
          {/* Filters */}
          <div className="flex gap-2">
            <select
              className="flex-1 px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-sm"
              value={filter.difficulty}
              onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
            >
              <option value="">Все сложности</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Challenge List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Загрузка...</div>
          ) : (
            challenges.map((challenge) => (
              <button
                key={challenge.id}
                onClick={() => selectChallenge(challenge)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                  currentChallenge?.id === challenge.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-dark-hover border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm truncate">{challenge.title}</span>
                  {challenge.solved && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${difficultyColors[challenge.difficulty]}`}>
                    {challenge.difficulty}
                  </span>
                  <span className="text-xs text-gray-500">+{challenge.xpReward} XP</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Daily Challenge */}
        <div className="p-4 border-t border-dark-border">
          <Link href="/practice?daily=true">
            <Button variant="secondary" className="w-full">
              <Target className="w-4 h-4" />
              Daily Challenge
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentChallenge ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-dark-border">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{currentChallenge.title}</h1>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm border ${difficultyColors[currentChallenge.difficulty]}`}>
                      {currentChallenge.difficulty}
                    </span>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      +{currentChallenge.xpReward} XP
                    </span>
                    {currentChallenge.bigOHint && (
                      <span className="text-gray-500 text-sm">
                        {currentChallenge.bigOHint}
                      </span>
                    )}
                  </div>
                </div>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  <Play className="w-4 h-4" />
                  {isSubmitting ? 'Проверка...' : 'Запустить'}
                </Button>
              </div>
              <p className="text-gray-300 mt-4">{currentChallenge.description}</p>
            </div>

            {/* Editor & Results */}
            <div className="flex-1 flex flex-col lg:flex-row">
              {/* Code Editor */}
              <div className="flex-1 p-4">
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  height="calc(100vh - 300px)"
                />
                
                {/* Actions */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      onClick={handleGetHint}
                      disabled={!settings.aiHintsEnabled}
                    >
                      <Lightbulb className="w-4 h-4" />
                      Подсказка
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {result?.allPassed && (
                      <Button variant="secondary" onClick={getNextChallenge}>
                        Следующая задача
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Results Panel */}
              <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-dark-border bg-dark-card p-4 overflow-y-auto">
                {/* Hints */}
                <AnimatePresence>
                  {showHints && hints.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-4"
                    >
                      <h3 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Подсказки
                      </h3>
                      <div className="space-y-2">
                        {hints.map((hint, i) => (
                          <div key={i} className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
                            {hint}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Test Results */}
                {result && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Результаты тестов</h3>
                    
                    <div className={`p-4 rounded-lg mb-4 ${
                      result.allPassed 
                        ? 'bg-green-500/10 border border-green-500/30' 
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {result.allPassed ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className="font-semibold">
                          {result.allPassed ? 'Все тесты пройдены!' : 'Тесты не пройдены'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Пройдено: {result.passedCount} / {result.totalTests}
                      </div>
                      {result.xpEarned > 0 && (
                        <div className="mt-2 text-primary font-bold">
                          +{result.xpEarned} XP заработано!
                        </div>
                      )}
                    </div>

                    {/* Test Details */}
                    <div className="space-y-2">
                      {result.testResults.map((test, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${
                            test.passed
                              ? 'bg-green-500/5 border-green-500/20'
                              : 'bg-red-500/5 border-red-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {test.passed ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span className="text-sm font-medium">Тест {test.testNumber}</span>
                          </div>
                          {test.error ? (
                            <p className="text-xs text-red-400">{test.error}</p>
                          ) : (
                            <div className="text-xs text-gray-400">
                              <div>Input: {JSON.stringify(test.input)}</div>
                              <div>Expected: {JSON.stringify(test.expected)}</div>
                              <div>Got: {JSON.stringify(test.actual)}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Code2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Выберите задачу из списка</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
