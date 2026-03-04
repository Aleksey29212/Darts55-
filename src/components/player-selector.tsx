'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Player, LeagueId, AllLeagueSettings } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { View, Link as LinkIcon, Link2Off, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface PlayerSelectorProps {
  players: Player[];
  rankings: Player[][];
  enabledLeagues: LeagueId[];
  currentLeagueId: LeagueId;
  leagueSettings: AllLeagueSettings;
}

export function PlayerSelector({ 
    players, 
    rankings, 
    enabledLeagues, 
    currentLeagueId,
    leagueSettings 
}: PlayerSelectorProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(true);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentLeagueIndex = enabledLeagues.indexOf(currentLeagueId);
  const currentLeaguePlayers = useMemo(() => {
      if (currentLeagueIndex === -1) return [];
      return rankings[currentLeagueIndex] || [];
  }, [rankings, currentLeagueIndex]);

  const filteredPlayers = useMemo(() => {
      if (!isSynced) return players;
      const leaguePlayerIds = new Set(currentLeaguePlayers.map(p => p.id));
      return players.filter(p => leaguePlayerIds.has(p.id));
  }, [players, currentLeaguePlayers, isSynced]);

  const handleViewCard = () => {
    if (selectedPlayerId) {
      const leagueParam = isSynced ? `?league=${currentLeagueId}` : '';
      router.push(`/player/${selectedPlayerId}${leagueParam}`);
    }
  };

  const leagueName = leagueSettings[currentLeagueId]?.name || 'Лига';

  // Fix for Hydration Error: Defer rendering Radix Select until mounted
  if (!isClient) {
    return (
        <Card className="glassmorphism border-2 border-white/5 shadow-2xl overflow-hidden">
            <CardHeader className="pb-4">
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="flex gap-4">
                <Skeleton className="h-14 flex-grow rounded-xl" />
                <Skeleton className="h-14 w-32 rounded-xl" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="glassmorphism border-2 border-white/5 shadow-2xl overflow-hidden group/selector">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover/selector:opacity-100 transition-opacity duration-1000" />
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between gap-4">
            <div>
                <CardTitle className="font-headline text-xl md:text-3xl uppercase tracking-tighter">Просмотр карточки игрока</CardTitle>
                <CardDescription className="text-xs md:text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <Filter className="h-3 w-3 text-primary/40" />
                    {isSynced ? `Поиск ограничен участниками лиги: ${leagueName}` : 'Поиск по всей базе данных серии'}
                </CardDescription>
            </div>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsSynced(!isSynced)}
                            className={cn(
                                "h-12 w-12 rounded-2xl transition-all duration-500 border-2 active:scale-90",
                                isSynced 
                                    ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_20px_rgba(var(--primary),0.2)]" 
                                    : "bg-muted/20 border-white/5 text-muted-foreground grayscale"
                            )}
                        >
                            {isSynced ? <LinkIcon className="h-6 w-6" /> : <Link2Off className="h-6 w-6" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="glassmorphism p-4 border-white/10 max-w-[200px]">
                        <p className="text-xs font-bold leading-relaxed">
                            {isSynced 
                                ? "Синхронизация ВКЛ: Только игроки текущей лиги." 
                                : "Синхронизация ВЫКЛ: Поиск по всем игрокам."}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative z-10">
        <div className="flex-grow">
            <Select onValueChange={setSelectedPlayerId} value={selectedPlayerId || undefined}>
                <SelectTrigger className="h-12 md:h-14 bg-black/40 border-white/10 text-lg rounded-xl focus:ring-primary/50 transition-all">
                    <SelectValue placeholder={isSynced ? `Выберите игрока из ${leagueName}...` : "Поиск по всей серии..."} />
                </SelectTrigger>
                <SelectContent className="glassmorphism border-white/10 max-h-[300px]">
                    {filteredPlayers.length > 0 ? (
                        filteredPlayers.sort((a,b) => a.name.localeCompare(b.name)).map((player) => (
                            <SelectItem key={player.id} value={player.id} className="py-3 focus:bg-primary/20">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{player.name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5">
                                        {player.nickname}
                                    </span>
                                </div>
                            </SelectItem>
                        ))
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground italic">
                            В этой лиге пока нет активных игроков
                        </div>
                    )}
                </SelectContent>
            </Select>
        </div>
        <Button 
            onClick={handleViewCard} 
            disabled={!selectedPlayerId}
            className="h-12 md:h-14 px-8 rounded-xl font-headline uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <View className="mr-2 h-5 w-5" />
          Просмотр
        </Button>
      </CardContent>
    </Card>
  );
}
