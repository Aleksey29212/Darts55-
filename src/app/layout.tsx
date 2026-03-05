import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Russo_One } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AdminProvider } from '@/context/admin-context';
import { AdminLoginTrigger } from '@/components/admin-login';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import Header from '@/components/header';
import { ThemeApplier } from '@/components/theme-applier';
import { getThemeSettings } from '@/lib/settings';
import { MobileProvider } from '@/hooks/use-mobile';
import { VisitLogger } from '@/components/visit-logger';
import { DartsMarquee } from '@/components/darts-marquee';
import { getPartners } from '@/lib/partners';
import { PartnersDisplay } from '@/components/partners-display';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
});

const russoOne = Russo_One({
  subsets: ['latin', 'cyrillic'],
  weight: '400',
  variable: '--font-russo-one',
});

export const metadata: Metadata = {
  title: 'DartBrig Pro - Рейтинговая система',
  description: 'Профессиональная рейтинговая система для дартс-сообщества. Отслеживайте свой прогресс, участвуйте в турнирах и становитесь лучшим!',
  openGraph: {
    title: 'DartBrig Pro - Рейтинговая система',
    description: 'Рейтинги, турниры и статистика игроков в дартс.',
    url: 'https://darts55.ru',
    siteName: 'DartBrig Pro',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544098485-2a216e2133c1?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Дартс',
      },
    ],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DartBrig Pro - Рейтинговая система',
    description: 'Рейтинги, турниры и статистика игроков в дартс.',
    images: ['https://images.unsplash.com/photo-1544098485-2a216e2133c1?w=1200&h=630&fit=crop'],
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemeSettings();
  const partners = await getPartners();
  
  return (
    <html lang="ru" className="dark">
      <body className={cn("min-h-screen bg-background font-body antialiased", inter.variable, russoOne.variable)}>
          <FirebaseClientProvider>
            <AdminProvider>
              <MobileProvider>
                <ThemeApplier initialTheme={theme} />
                <div className="relative flex min-h-screen flex-col">
                  <Header />
                  <div className="sticky top-14 md:top-20 z-40 w-full border-b border-white/5 bg-background/90 backdrop-blur-xl shadow-lg">
                    <DartsMarquee />
                    <PartnersDisplay partners={partners} variant="compact" />
                  </div>
                  <div className="flex-1">{children}</div>
                </div>
                <Toaster />
                <AdminLoginTrigger />
                <VisitLogger />
              </MobileProvider>
            </AdminProvider>
          </FirebaseClientProvider>
      </body>
    </html>
  );
}
