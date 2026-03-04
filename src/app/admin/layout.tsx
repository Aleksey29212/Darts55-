
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/logo';
import {
  LayoutDashboard,
  Shield,
  Calculator,
  Users,
  Home,
  Trophy,
  Wand2,
  Camera,
  Library,
  Handshake,
  Image as ImageIcon,
  BarChart,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import React, { useEffect } from 'react';

const adminNavItems = [
  { href: '/admin', label: 'Панель управления', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Аналитика', icon: BarChart },
  { href: '/admin/leagues', label: 'Управление лигами', icon: Library },
  { href: '/admin/tournaments', label: 'Турниры', icon: Trophy },
  { href: '/admin/scoring', label: 'Подсчет очков', icon: Calculator },
  { href: '/admin/players', label: 'Игроки', icon: Users },
  { href: '/admin/style-studio', label: 'Студия стилей', icon: Wand2 },
  { href: '/admin/photo-studio', label: 'Фотостудия', icon: Camera },
  { href: '/admin/partners', label: 'Партнеры', icon: Handshake },
  { href: '/admin/background', label: 'Фон страницы', icon: ImageIcon },
  { href: '/admin/system', label: 'Система', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, isAuthChecked, isDirty, setIsDirty, logout } = useAdmin();

  useEffect(() => {
    if (isAuthChecked && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isAuthChecked, router]);

  const handleLeaveAdminPanel = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDirty) {
      if (!window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите покинуть панель администратора?')) {
        e.preventDefault();
      } else {
        setIsDirty(false);
      }
    }
  };

  const handleAdminNav = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDirty) {
       if (!window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите покинуть эту страницу?')) {
        e.preventDefault();
      }
    }
  }

  if (!isAuthChecked || !isAdmin) {
    return null; // Prevent rendering anything until auth is checked or if not authorized
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b">
          <div className="flex items-center justify-between p-2">
            <Link href="/" aria-label="Home" onClick={handleLeaveAdminPanel} prefetch={true}>
              <Logo />
            </Link>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {adminNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin')} className="font-medium transition-transform active:scale-95" tooltip={item.label}>
                  <Link href={item.href} onClick={handleAdminNav} prefetch={true}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <div className="mt-auto p-2 space-y-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="font-medium transition-transform active:scale-95" tooltip="Вернуться в приложение">
                <Link href="/" onClick={handleLeaveAdminPanel} prefetch={true}>
                  <Home/>
                  <span>Вернуться</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={logout} 
                className="font-medium text-destructive hover:text-destructive hover:bg-destructive/10 transition-transform active:scale-95" 
                tooltip="Выйти из системы"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 p-4 md:p-8">
           <div className="flex items-center gap-4 mb-8">
            <SidebarTrigger className="md:hidden"/>
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-semibold">Панель администратора</h1>
          </div>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
