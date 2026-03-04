'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Trophy, TrendingUp, Handshake, Smartphone, Monitor, CircleHelp, Info } from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { useIsClient } from '@/hooks/use-is-client';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ScoringHelpDialog } from './scoring-help-dialog';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { ScoringSettings, AllLeagueSettings, LeagueId, SponsorshipSettings } from '@/lib/types';
import { useMobileControl } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';
import { BrandLogo } from './icons/brand-logo';

export default function Header() {
  const { isAdmin } = useAdmin();
  const isClient = useIsClient();
  const pathname = usePathname();
  const db = useFirestore();
  const { isForcedMobile, setIsForcedMobile } = useMobileControl();
  const [iconStage, setIconIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const scoringColRef = useMemoFirebase(() => db ? collection(db, 'scoring_configurations') : null, [db]);
  const { data: allScoringData } = useCollection<ScoringSettings>(scoringColRef);

  const leagueSettingsRef = useMemoFirebase(() => db ? doc(db, 'app_settings', 'leagues') : null, [db]);
  const { data: leagueSettings } = useDoc<AllLeagueSettings>(leagueSettingsRef);

  const sponsorSettingsRef = useMemoFirebase(() => db ? doc(db, 'app_settings', 'sponsorship') : null, [db]);
  const { data: sponsorSettings } = useDoc<SponsorshipSettings>(sponsorSettingsRef);

  const defaultLeagues: AllLeagueSettings = {
    general: { enabled: true, name: 'Общий рейтинг' },
    premier: { enabled: false, name: 'Премьер-лига' },
    first: { enabled: false, name: 'Первая лига' },
    cricket: { enabled: false, name: 'Крикет' },
    senior: { enabled: false, name: 'Сеньоры' },
    youth: { enabled: false, name: 'Юниоры' },
    women: { enabled: false, name: 'Женская лига' },
    evening_omsk: { enabled: false, name: 'Вечерний Омск' },
  };

  const settingsMap: Record<LeagueId, ScoringSettings> = (allScoringData || []).reduce((acc, curr) => {
    acc[curr.id as LeagueId] = curr;
    return acc;
  }, {} as Record<LeagueId, ScoringSettings>);

  const renderHintIcon = () => {
    const commonClasses = "h-7 w-7 md:h-8 md:w-8 transition-all duration-500 animate-in fade-in zoom-in-75";
    const statusClasses = "text-primary drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]";
    
    switch (iconStage) {
      case 1: return <CircleHelp className={cn(commonClasses, statusClasses)} />;
      case 2: return <Info className={cn(commonClasses, statusClasses)} />;
      default: return <BrandLogo className={commonClasses} />;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 md:h-20 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isClient && leagueSettings ? (
              <ScoringHelpDialog 
                allSettings={settingsMap} 
                leagueSettings={leagueSettings || defaultLeagues}
              >
                <button className="flex items-center justify-center p-1.5 hover:bg-white/5 rounded-full transition-all active:scale-90 group">
                  {renderHintIcon()}
                </button>
              </ScoringHelpDialog>
            ) : (
              <BrandLogo className="h-7 w-7" />
            )}
            
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity active:scale-95 duration-150" prefetch={true}>
              <span className="text-xl md:text-4xl font-headline tracking-tighter leading-none">DartBrig</span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center ml-4 bg-white/5 rounded-full p-1 border border-white/5">
              <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsForcedMobile(false)}
                  className={cn(
                      "h-8 w-10 rounded-full transition-all",
                      !isForcedMobile ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5"
                  )}
              >
                  <Monitor className="h-4 w-4" />
              </Button>
              <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsForcedMobile(true)}
                  className={cn(
                      "h-8 w-10 rounded-full transition-all",
                      isForcedMobile ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5"
                  )}
              >
                  <Smartphone className="h-4 w-4" />
              </Button>
          </div>
        </div>

        <nav className="flex items-center gap-1 md:gap-4">
          <Button variant="ghost" size="sm" asChild className={cn(pathname === '/' && 'bg-white/10 text-primary', "h-9 px-3 md:px-5 rounded-full")}>
            <Link href="/" prefetch={true}>
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline ml-2 font-bold uppercase tracking-widest text-[10px]">Рейтинги</span>
            </Link>
          </Button>
           <Button variant="ghost" size="sm" asChild className={cn(pathname.startsWith('/tournaments') && 'bg-white/10 text-primary', "h-9 px-3 md:px-5 rounded-full")}>
            <Link href="/tournaments" prefetch={true}>
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline ml-2 font-bold uppercase tracking-widest text-[10px]">Турниры</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className={cn(pathname.startsWith('/partners') && 'bg-white/10 text-primary', "h-9 px-3 md:px-5 rounded-full")}>
            <Link href="/partners" prefetch={true}>
              <Handshake className="h-4 w-4" />
              <span className="hidden sm:inline ml-2 font-bold uppercase tracking-widest text-[10px]">Партнеры</span>
            </Link>
          </Button>
          {isClient && isAdmin && (
            <Button variant="ghost" size="sm" asChild className={cn(pathname.startsWith('/admin') && 'bg-primary/20 text-primary', "h-9 px-3 md:px-5 rounded-full border border-primary/20")}>
              <Link href="/admin" prefetch={true}>
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline ml-2 font-bold uppercase tracking-widest text-[10px]">Админ</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
