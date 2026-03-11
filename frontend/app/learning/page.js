/**
 * Learning Page - Обучение и теория
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../context/store';
import { learningAPI } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  BookOpen, ChevronRight, CheckCircle, Lock,
  Code2, Lightbulb, Target, Zap, Brain
} from 'lucide-react';

const categoryColors = {
  'algorithms': 'from-purple-500 to-pink-500',
  'data-structures': 'from-cyan-500 to-blue-500',
  'basics': 'from-green-500 to-emerald-500',
  'strings': 'from-yellow-500 to-orange-500',
  'dynamic-programming': 'from-red-500 to-rose-500',
};

const categoryIcons = {
  'algorithms': Zap,
  'data-structures': Brain,
  'basics': BookOpen,
  'strings': Code2,
  'dynamic-programming': Target,
};

export default function LearningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useStore();
  
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicContent, setTopicContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка категорий
  useEffect(() => {
    loadCategories();
  }, []);

  // Загрузка тем при выборе категории
  useEffect(() => {
    if (selectedCategory) {
      loadTopics(selectedCategory);
    }
  }, [selectedCategory]);

  // Загрузка контента темы
  useEffect(() => {
    const topicSlug = searchParams.get('topic');
    if (topicSlug) {
      loadTopicContent(topicSlug);
    }
  }, [searchParams]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const { data } = await learningAPI.getCategories();
      if (data.success) {
        setCategories(data.categories);
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].slug);
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopics = async (category) => {
    try {
      const { data } = await learningAPI.getTopics({ category });
      if (data.success) {
        setTopics(data.topics);
      }
    } catch (error) {
      console.error('Failed to load topics:', error);
    }
  };

  const loadTopicContent = async (slug) => {
    try {
      const { data } = await learningAPI.getTopicContent(slug);
      if (data.success) {
        setTopicContent(data.content);
      }
    } catch (error) {
      console.error('Failed to load topic content:', error);
    }
  };

  const selectTopic = (topic) => {
    setSelectedTopic(topic);
    router.push(`/learning?topic=${topic.slug}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center max-w-md">
          <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Войдите для обучения</h2>
          <p className="text-gray-400 mb-6">
            Изучайте алгоритмы и структуры данных с практикой
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
    <div className="min-h-screen flex">
      {/* Sidebar - Categories */}
      <div className="w-72 border-r border-dark-border bg-dark-card flex flex-col">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Обучение
          </h2>
        </div>

        {/* Categories */}
        <div className="p-2">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] || BookOpen;
            return (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.slug)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                  selectedCategory === category.slug
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-dark-hover border border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[category.slug] || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{category.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Topics List */}
        <div className="w-80 border-r border-dark-border bg-dark-card">
          <div className="p-4 border-b border-dark-border">
            <h3 className="font-semibold">Темы</h3>
          </div>
          
          <div className="p-2 overflow-y-auto">
            {topics.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Загрузка тем...
              </div>
            ) : (
              topics.map((topic, index) => (
                <button
                  key={topic.id}
                  onClick={() => selectTopic(topic)}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                    selectedTopic?.id === topic.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-dark-hover border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{index + 1}. {topic.title}</span>
                    {topic.progress?.solved > 0 && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      topic.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      topic.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {topic.difficulty}
                    </span>
                    {topic.progress && (
                      <span className="text-xs text-gray-500">
                        {topic.progress.solved}/{topic.progress.total} задач
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          {topicContent ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Topic Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <span>{selectedCategory}</span>
                  <ChevronRight className="w-4 h-4" />
                  <span>{topicContent.title}</span>
                </div>
                <h1 className="text-3xl font-bold mb-4">{topicContent.title}</h1>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm border ${
                    topicContent.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    topicContent.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    {topicContent.difficulty}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-invert max-w-none">
                <div 
                  className="text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: topicContent.content
                      .replace(/```javascript\n([\s\S]*?)```/g, '<pre class="bg-dark-bg p-4 rounded-lg overflow-x-auto"><code>$1</code></pre>')
                      .replace(/```([\s\S]*?)```/g, '<pre class="bg-dark-bg p-4 rounded-lg"><code>$1</code></pre>')
                      .replace(/# (.*)/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
                      .replace(/## (.*)/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
                      .replace(/\n\n/g, '</p><p class="mb-4">')
                      .replace(/`(.*?)`/g, '<code class="bg-dark-bg px-2 py-1 rounded text-primary">$1</code>')
                      .replace(/\* (.*)/g, '<li class="ml-4 mb-2">$1</li>')
                  }}
                />
              </div>

              {/* Go to Practice */}
              {selectedTopic && (
                <div className="mt-8 p-6 bg-dark-card rounded-xl border border-dark-border">
                  <h3 className="text-lg font-semibold mb-2">Практика</h3>
                  <p className="text-gray-400 mb-4">
                    Перейдите к практическим задачам по этой теме
                  </p>
                  <Link href="/practice">
                    <Button>
                      <Lightbulb className="w-4 h-4" />
                      К задачам
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Выберите тему для изучения</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
