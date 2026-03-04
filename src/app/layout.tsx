
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AdminProvider } from '@/context/admin-context';
import { Inter } from 'next/font/google';
import { FirebaseClientProvider, MobileProvider } from '@/firebase';
import Header from '@/components/header';
import { getBackgroundUrl, getThemeSettings, DEFAULT_THEME } from '@/lib/settings';
import { AdminLoginTrigger } from '@/components/admin-login';
import { VisitLogger } from '@/components/visit-logger';
import { ThemeApplier } from '@/components/theme-applier';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'DartBrig Pro',
  description: 'Professional Darts Tournament Management',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DartBrig Pro',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let backgroundUrl = '';
  let themeSettings = DEFAULT_THEME;

  // This try-catch prevents the app from crashing on the server if Firebase isn't configured.
  // It will log the error and fall back to default styling.
  try {
    [backgroundUrl, themeSettings] = await Promise.all([
      getBackgroundUrl(),
      getThemeSettings()
    ]);
  } catch (e) {
    console.error('Critical: Failed to load layout settings from Firestore. Check server environment variables.', e);
  }
  
  return (
    <html lang="ru" className={cn("dark", inter.variable)} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Russo+One&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased min-h-screen bg-background relative selection:bg-primary/30')}>
        {backgroundUrl && (
          <div
            className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat transition-all duration-1000"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
          />
        )}
        <div className="fixed inset-0 z-[-1] bg-background/90 backdrop-blur-[2px]" />

        <FirebaseClientProvider>
          <ThemeApplier initialTheme={themeSettings} />
          <MobileProvider>
            <AdminProvider>
              <div className={cn('flex min-h-screen flex-col')}>
                <Header />
                <div className="flex-1 w-full max-w-[1920px] mx-auto">
                  {children}
                </div>
                <footer className="container flex-shrink-0">
                  <div className="h-12 flex items-center justify-center border-t border-white/5 mt-8">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">© 2025 DartBrig Pro • Professional Series</p>
                  </div>
                </footer>
              </div>
              <Toaster />
              <AdminLoginTrigger />
            </AdminProvider>
          </MobileProvider>
        </FirebaseClientProvider>
        <VisitLogger />
      </body>
    </html>
  );
}
