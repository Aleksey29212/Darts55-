'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AdminContextType {
  isAdmin: boolean;
  isAuthChecked: boolean;
  login: (password: string) => void;
  logout: () => void;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

// Используем NEXT_PUBLIC_ переменную напрямую для клиентской части
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
const SESSION_STORAGE_KEY = 'db_admin_react';

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true') {
        setIsAdmin(true);
      }
    } catch (e) {
      // Session storage may be disabled in some environments
    } finally {
      setIsAuthChecked(true);
    }
  }, []);

  const login = useCallback((password: string) => {
    if (!ADMIN_PASSWORD) {
        toast({
            title: 'Ошибка конфигурации',
            description: 'Пароль администратора не настроен в переменных окружения.',
            variant: 'destructive',
        });
        return;
    }

    if (password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        setIsAdmin(true);
        toast({
          title: 'Успешный вход',
          description: 'Режим администратора включен.',
        });
        router.push('/admin');
      } catch (e) {
         toast({
            title: 'Ошибка',
            description: 'Не удалось сохранить сессию. Возможно, ваш браузер блокирует sessionStorage.',
            variant: 'destructive',
         });
      }
    } else {
      toast({
        title: 'Ошибка входа',
        description: 'Неверный пароль.',
        variant: 'destructive',
      });
    }
  }, [toast, router]);

  const logout = useCallback(() => {
    if (isDirty && !window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите выйти из системы?')) {
        return;
    }
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setIsAdmin(false);
      setIsDirty(false);
      toast({
        title: 'Выход',
        description: 'Режим администратора выключен.',
      });
      // Жесткая перезагрузка для полной очистки состояния безопасности
      window.location.href = '/';
    } catch (e) {
        window.location.href = '/';
    }
  }, [isDirty, toast]);

  const value = { isAdmin, isAuthChecked, login, logout, isDirty, setIsDirty };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
