'use client';

import type { Player, SponsorshipSettings, SponsorInfo, LeagueId } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { TrendingUp, ChevronRight, Handshake, Target } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface PlayerRankingsProps {
  players: Player[];
  leagueId?: LeagueId;
}

function MobileRankings({ players, leagueId }: { players: Player[], leagueId?: LeagueId }) {
    const db = useFirestore();
    const isOmsk = leagueId === 'evening_omsk';
    const sponsorSettingsRef = useMemoFirebase(() => db ? doc(db, 'app_settings', 'sponsorship') : null, [db]);
    const { data: globalSponsorSettings } = useDoc<SponsorshipSettings>(sponsorSettingsRef);

    return (
        <div className="w-full space-y-3 px-2 pb-8">
            {players.map((player) => {
                const isTop3 = player.rank > 0 && player.rank <= 3;
                const sponsors: SponsorInfo[] = (player.sponsors || []).slice(0, 3);
                const hasAnySponsor = sponsors.length > 0;

                return (
                    <div 
                        key={player.id}
                        className={cn(
                            "relative group rounded-2xl bg-card/40 backdrop-blur-2xl border border-white/5 shadow-xl overflow-hidden transition-all duration-300 active:scale-[0.98]",
                            isTop3 && "border-primary/30 bg-primary/5"
                        )}
                    >
                        <Link 
                            href={`/player/${player.id}${leagueId ? `?league=${leagueId}` : ''}`}
                            className="flex items-center gap-4 p-4"
                        >
                            <div className="flex flex-col items-center justify-center w-10 shrink-0">
                                <span className={cn(
                                    "font-headline text-3xl leading-none",
                                    player.rank === 1 ? "text-gold text-glow" : 
                                    player.rank === 2 ? "text-silver" : 
                                    player.rank === 3 ? "text-bronze" : "text-muted-foreground/20"
                                )}>{player.rank > 0 ? player.rank : '-'}</span>
                            </div>

                            <div className="flex items-center gap-4 flex-grow min-w-0">
                                <div className="relative shrink-0">
                                    <Avatar className={cn("h-14 w-14 border-2 shadow-2xl", isTop3 ? "border-primary/50" : "border-white/10")}>
                                        <AvatarImage src={player.avatarUrl} alt={player.name} data-ai-hint={player.imageHint} />
                                        <AvatarFallback className="bg-muted text-sm font-headline">{player.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {hasAnySponsor && (
                                        <div className="absolute -bottom-1 -right-1 bg-primary border-2 border-background rounded-full p-1 shadow-lg">
                                            <Handshake className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-headline text-[13px] text-foreground truncate uppercase tracking-tight leading-none mb-1.5">
                                        {player.name}
                                    </span>
                                    <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] truncate">
                                        {player.nickname}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center min-w-[90px] bg-primary rounded-2xl px-4 py-2.5 border border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
                                <span className="text-2xl font-headline text-white leading-none">
                                    {Number(player.points || 0).toFixed(isOmsk ? 1 : 0)}
                                </span>
                                <p className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em] mt-1.5 leading-none">PTS</p>
                            </div>
                        </Link>
                    </div>
                )
            })}
        </div>
    );
}

export function PlayerRankings({ players, leagueId }: PlayerRankingsProps) {
  const isMobile = useIsMobile();
  const isOmsk = leagueId === 'evening_omsk';

  return (
    <Card className="glassmorphism overflow-hidden border-2 border-white/5 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/2 p-6 md:p-16">
        <div className="space-y-2 md:space-y-4">
          <CardTitle className="text-xl md:text-6xl flex items-center gap-4 md:gap-8">
            <div className="p-3 md:p-6 rounded-2xl md:rounded-[2rem] bg-primary/20 shadow-inner">
                <TrendingUp className="h-5 w-5 md:h-12 md:w-12 text-primary" />
            </div>
            <span className="font-headline uppercase tracking-tighter">Рейтинг Серии</span>
          </CardTitle>
          <CardDescription className="text-[8px] md:text-base uppercase font-black tracking-[0.4em] text-muted-foreground/40 flex items-center gap-3">
            <Target className="h-3 w-3 md:h-5 md:w-5 text-primary/30" />
            {isOmsk ? 'Система: AVG × Множитель Стадии' : 'Сводные данные регулярного сезона'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isMobile ? (
            <MobileRankings players={players} leagueId={leagueId} />
        ) : (
            <TooltipProvider>
            <div className="overflow-x-auto">
                <Table className="min-w-[1100px]">
                    <TableHeader>
                    <TableRow className="border-b border-white/5 bg-white/2 h-24">
                        <TableHead className="w-[120px] text-center font-black uppercase tracking-[0.4em] text-muted-foreground/30 text-[12px]">POS</TableHead>
                        <TableHead className="font-black uppercase tracking-[0.4em] text-muted-foreground/30 text-[12px]">ИГРОК PRO SERIES</TableHead>
                        <TableHead className="text-right font-black uppercase tracking-[0.4em] text-primary text-[12px]">БАЛЛЫ</TableHead>
                        <TableHead className="text-right font-black uppercase tracking-[0.4em] text-muted-foreground/30 text-[12px]">AVG</TableHead>
                        <TableHead className="text-right font-black uppercase tracking-[0.4em] text-muted-foreground/30 text-[12px]">ТУРЫ</TableHead>
                        <TableHead className="text-right font-black uppercase tracking-[0.4em] text-muted-foreground/30 text-[12px]">ТОП-8</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {players.map((player) => (
                        <TableRow key={player.id} className="h-28 even:bg-white/[0.01] border-white/5 transition-all duration-500 hover:bg-primary/10 group/row">
                            <TableCell className="text-center align-middle font-headline text-4xl text-muted-foreground/10 group-hover/row:text-primary/30 transition-colors">
                                {player.rank > 0 ? player.rank : '-'}
                            </TableCell>
                            <TableCell>
                            <Link href={`/player/${player.id}${leagueId ? `?league=${leagueId}` : ''}`} className="flex items-center gap-8 group/link">
                                <div className="relative shrink-0">
                                    <Avatar className="h-16 w-16 border-2 border-white/5 group-hover/link:border-primary transition-all duration-700 shadow-2xl scale-110">
                                        <AvatarImage src={player.avatarUrl} alt={player.name} className="object-cover" />
                                        <AvatarFallback className="text-xl bg-muted font-headline">{player.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {(player.sponsors?.length || 0) > 0 && (
                                        <div className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-1.5 shadow-2xl border-2 border-background">
                                            <Handshake className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-headline text-2xl text-foreground group-hover/link:text-primary transition-colors duration-500 uppercase tracking-tight leading-none mb-2">{player.name}</span>
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">{player.nickname}</span>
                                </div>
                            </Link>
                            </TableCell>
                            <TableCell className="text-right font-headline font-black text-primary text-glow text-3xl lg:text-5xl">
                                {player.points.toFixed(isOmsk ? 2 : 0)}
                            </TableCell>
                            <TableCell className="text-right font-headline text-foreground/80 text-2xl lg:text-3xl">
                                {player.avg.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-headline text-muted-foreground/40 text-xl">
                                {player.matchesPlayed}
                            </TableCell>
                            <TableCell className="text-right text-primary font-headline text-3xl opacity-60 group-hover/row:opacity-100 transition-opacity">
                                {player.wins}
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
            </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
