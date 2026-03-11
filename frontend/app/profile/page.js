/**
 * Profile Page - Профиль пользователя
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStore } from '../../context/store';
import { usersAPI } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { 
  User, Settings, Trophy, Flame, Code2, 
  TrendingUp, Star, Crown, Edit2, Save, X,
  Sun, Moon, Palette
} from 'lucide-react';

const THEMES = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'neon', label: 'Neon', icon: Star },
  { value: 'cyber', label: 'Cyber', icon: Palette },
];

const ACCENT_COLORS = [
  '#00ff88', '#4ecdc4', '#ff6b6b', '#ffe66d', '#a855f7', '#3b82f6'
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, settings, updateSettings, logout } = useStore();
  
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', avatar: '' });
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const loadProfile = async () => {
    try {
      const { data } = await usersAPI.getProfile();
      if (data.success) {
        setProfile(data.profile);
        setEditForm({ 
          username: data.profile.username, 
          avatar: data.profile.avatar 
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data } = await usersAPI.updateProfile(editForm);
      if (data.success) {
        setProfile({ ...profile, ...data.user });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Профиль</h1>
          <Button variant="secondary" onClick={handleLogout}>
            Выйти
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Информация
                </span>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    label="Имя пользователя"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      <Save className="w-4 h-4" />
                      Сохранить
                    </Button>
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4" />
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                      {profile.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{profile.username}</h3>
                      <p className="text-primary">{profile.title}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <div className="text-2xl font-bold text-primary">{profile.xp}</div>
                      <div className="text-sm text-gray-400">XP</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{profile.level}</div>
                      <div className="text-sm text-gray-400">Уровень</div>
                    </div>
                  </div>

                  {/* Progress to next level */}
                  <div className="pt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Прогресс до следующего уровня</span>
                      <span className="text-primary">{profile.progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${profile.progressPercent}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {profile.xpToNextLevel} XP до {profile.nextTitle}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Статистика
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-2xl font-bold text-green-400">{profile.wins}</div>
                  <div className="text-sm text-gray-400">Побед</div>
                </div>
                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="text-2xl font-bold text-red-400">{profile.losses}</div>
                  <div className="text-sm text-gray-400">Поражений</div>
                </div>
                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="text-2xl font-bold text-yellow-400">{profile.draws}</div>
                  <div className="text-sm text-gray-400">Ничьих</div>
                </div>
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <div className="text-2xl font-bold text-orange-400">{profile.streak}</div>
                  </div>
                  <div className="text-sm text-gray-400">Streak</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-border">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Решено задач:</span>
                  <span className="font-medium">{profile.solvedChallenges}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">Лучший streak:</span>
                  <span className="font-medium">{profile.maxStreak}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Настройки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Theme */}
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Тема</label>
                  <div className="flex gap-2">
                    {THEMES.map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.value}
                          onClick={() => setLocalSettings({ ...localSettings, theme: theme.value })}
                          className={`flex-1 p-3 rounded-lg border transition-colors ${
                            localSettings.theme === theme.value
                              ? 'border-primary bg-primary/10'
                              : 'border-dark-border hover:border-gray-500'
                          }`}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-1" />
                          <span className="text-xs">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Акцентный цвет</label>
                  <div className="flex gap-2">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setLocalSettings({ ...localSettings, accentColor: color })}
                        className={`w-10 h-10 rounded-lg transition-transform ${
                          localSettings.accentColor === color 
                            ? 'ring-2 ring-white scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Editor Settings */}
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Размер шрифта</label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={localSettings.editorFontSize}
                    onChange={(e) => setLocalSettings({ 
                      ...localSettings, 
                      editorFontSize: parseInt(e.target.value) 
                    })}
                    className="w-full"
                  />
                  <div className="text-center text-sm mt-1">{localSettings.editorFontSize}px</div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-3">Tab size</label>
                  <select
                    value={localSettings.editorTabSize}
                    onChange={(e) => setLocalSettings({ 
                      ...localSettings, 
                      editorTabSize: parseInt(e.target.value) 
                    })}
                    className="w-full px-4 py-2 rounded-lg bg-dark-bg border border-dark-border"
                  >
                    <option value={2}>2 пробела</option>
                    <option value={4}>4 пробела</option>
                    <option value={8}>8 пробелов</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="wordWrap"
                    checked={localSettings.editorWordWrap}
                    onChange={(e) => setLocalSettings({ 
                      ...localSettings, 
                      editorWordWrap: e.target.checked 
                    })}
                    className="w-5 h-5 rounded bg-dark-bg border-dark-border"
                  />
                  <label htmlFor="wordWrap" className="text-sm">Перенос строк в редакторе</label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="aiHints"
                    checked={localSettings.aiHintsEnabled}
                    onChange={(e) => setLocalSettings({ 
                      ...localSettings, 
                      aiHintsEnabled: e.target.checked 
                    })}
                    className="w-5 h-5 rounded bg-dark-bg border-dark-border"
                  />
                  <label htmlFor="aiHints" className="text-sm">AI подсказки</label>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-dark-border">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
