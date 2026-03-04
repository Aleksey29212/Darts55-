'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerRadarChart } from './player-radar-chart';
import { PlayerRatingChart } from './player-rating-chart';
import type { Player, PlayerTournamentHistory } from '@/lib/types';
import { Activity, Target, Sparkles } from 'lucide-react';

interface PlayerAnalyticsTabsProps {
  player: Player;
  tournaments: PlayerTournamentHistory[];
  viewMode: 'aggregate' | 'single';
}

export function PlayerAnalyticsTabs({ player, tournaments, viewMode }: PlayerAnalyticsTabsProps) {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="glassmorphism border-2 border-white/5 shadow-2xl overflow-hidden min-h-[550px]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-xl font-headline uppercase tracking-tighter flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5 animate-pulse" />
                PRO Analytics
            </CardTitle>
          </div>
          <div className="w-full h-12 bg-black/40 border border-white/5 rounded-md animate-pulse" />
        </CardHeader>
        <CardContent className="pt-4 flex flex-col items-center justify-center h-[400px]">
           <Activity className="h-12 w-12 text-muted-foreground/20 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphism border-2 border-white/5 shadow-2xl overflow-hidden min-h-[550px]">
      <Tabs defaultValue="dynamics" className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-xl font-headline uppercase tracking-tighter flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                PRO Analytics
            </CardTitle>
          </div>
          <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/5 p-1 h-12">
            <TabsTrigger value="dynamics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-500">
              <Activity className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Динамика</span>
            </TabsTrigger>
            <TabsTrigger value="radar" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-500">
              <Target className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Паутина</span>
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        
        <CardContent className="pt-4">
          <TabsContent value="dynamics" className="animate-in fade-in slide-in-from-left-4 duration-500 mt-0">
            <div className="bg-black/20 rounded-3xl p-2 md:p-4 border border-white/5">
                <PlayerRatingChart tournaments={tournaments} isStandalone={false} />
            </div>
            <p className="mt-4 text-center text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                Анализ роста баллов в текущем сезоне
            </p>
          </TabsContent>
          
          <TabsContent value="radar" className="animate-in fade-in slide-in-from-right-4 duration-500 mt-0">
            <div className="bg-black/20 rounded-3xl p-2 md:p-4 border border-white/5">
                <PlayerRadarChart player={player} viewMode={viewMode} />
            </div>
            <p className="mt-4 text-center text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                Радар профессиональных навыков (Spider Web)
            </p>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}