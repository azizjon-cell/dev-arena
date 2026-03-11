/**
 * Global Store - Zustand
 * Управление глобальным состоянием приложения
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, usersAPI } from '../lib/api';

export const useStore = create(
  persist(
    (set, get) => ({
      // Auth State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Settings
      settings: {
        theme: 'dark',
        accentColor: '#00ff88',
        editorFontSize: 14,
        editorTabSize: 2,
        editorWordWrap: true,
        aiHintsEnabled: true,
      },

      // UI State
      sidebarOpen: true,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login({ email, password });
          if (data.success) {
            localStorage.setItem('token', data.token);
            set({ 
              user: data.user, 
              token: data.token, 
              isAuthenticated: true,
              settings: {
                theme: data.user.theme || 'dark',
                accentColor: data.user.accentColor || '#00ff88',
                editorFontSize: data.user.editorFontSize || 14,
                editorTabSize: data.user.editorTabSize || 2,
                editorWordWrap: data.user.editorWordWrap !== 0,
                aiHintsEnabled: data.user.aiHintsEnabled !== 0,
              }
            });
            return { success: true };
          }
        } catch (error) {
          return { 
            success: false, 
            message: error.response?.data?.message || 'Ошибка входа' 
          };
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true });
        try {
          console.log('Attempting registration:', { username, email });
          const { data } = await authAPI.register({ username, email, password });
          console.log('Registration response:', data);
          if (data.success) {
            localStorage.setItem('token', data.token);
            set({ 
              user: data.user, 
              token: data.token, 
              isAuthenticated: true 
            });
            return { success: true };
          }
        } catch (error) {
          console.error('Registration error:', error);
          console.error('Error response:', error.response?.data);
          return { 
            success: false, 
            message: error.response?.data?.message || error.message || 'Ошибка регистрации' 
          };
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        try {
          const { data } = await usersAPI.getProfile();
          if (data.success) {
            set({ user: data.profile });
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      },

      updateSettings: async (newSettings) => {
        try {
          const { data } = await usersAPI.updateSettings(newSettings);
          if (data.success) {
            set((state) => ({ 
              settings: { ...state.settings, ...data.settings } 
            }));
          }
        } catch (error) {
          console.error('Failed to update settings:', error);
        }
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'devarena-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        settings: state.settings,
      }),
    }
  )
);
