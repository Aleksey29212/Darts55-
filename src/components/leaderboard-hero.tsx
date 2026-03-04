'use client';

import type { Player, LeagueId } from '@/lib/types';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardHeroProps {
  players: Player[];
  leagueId?: LeagueId;
}

const rankClasses = {
  1: {
    card: 'border-gold shadow-[0_0_50px_theme(colors.gold/0.2)] scale-110 z-20 bg-gradient-to-b from-gold/10 to-card md:-translate-y-8',
    icon: 'text-gold',
    size: 'basis-[38%] md:w-[35%]',
    avatar: 'h-16 w-16 sm:h-24 sm:w-24 md:h-40 md:w-40',
    avatarBorder: 'border-gold',
    name: 'text-[10px] sm:text-base md:text-4xl',
    pointsPlaque: 'bg-gold text-black font-black px-2 sm:px-4 md:px-8 py-1 md:py-3 rounded-full md:rounded-2xl shadow-2xl',
  },
  2: {
    card: 'glassmorphism border-silver/30 shadow-[0_0_30px_theme(colors.silver/0.1)] z-10 md:translate-y-4',
    icon: 'text-silver',
    size: 'basis-[28%] md:w-1/4',
    avatar: 'h-12 w-12 sm:h-20 sm:w-20 md:h-32 md:w-32',
    avatarBorder: 'border-silver',
    name: 'text-[9px] sm:text-sm md:text-3xl',
    pointsPlaque: 'bg-silver/20 text-silver font-bold px-1.5 md:px-6 py-1 md:py-2 rounded-full md:rounded-xl shadow-inner',
  },
  3: {
    card: 'glassmorphism border-bronze/30 shadow-[0_0_30px_theme(colors.bronze/0.1)] z-10 md:translate-y-8',
    icon: 'text-bronze',
    size: 'basis-[28%] md:w-1/4',
    avatar: 'h-12 w-12 sm:h-20 sm:w-20 md:h-32 md:w-32',
    avatarBorder: 'border-bronze',
    name: 'text-[9px] sm:text-sm md:text-3xl',
    pointsPlaque: 'bg-bronze/20 text-bronze font-bold px-1.5 md:px-6 py-1 md:py-2 rounded-full md:rounded-xl shadow-inner',
  },
};

function TopPlayerCard({ player, leagueId }: { player: Player, leagueId?: LeagueId }) {
    const rankStyle = rankClasses[player.rank as keyof typeof rankClasses] || rankClasses[3];

    return (
        <Link href={`/player/${player.id}${leagueId ? `?league=${leagueId}` : ''}`} className={cn("transition-all duration-700", rankStyle.size)} prefetch={true}>
            <Card className={cn("text-center h-full flex flex-col justify-between overflow-hidden relative active:scale-95 transition-all duration-300 border-2 rounded-[2rem] md:rounded-[4rem]", rankStyle.card)}>
                 {player.rank === 1 && (
                     <div className="absolute top-0 left-0 right-0 h-1 md:h-2 bg-gold animate-pulse" />
                 )}
                 <CardContent className="p-3 sm:p-6 md:p-12 flex flex-col items-center justify-center gap-2 md:gap-8">
                    <div className="relative">
                        <Avatar className={cn('border-2 md:border-[10px] shadow-3xl', rankStyle.avatar, rankStyle.avatarBorder)}>
                            <AvatarImage src={player.avatarUrl} alt={player.name} className="object-cover" />
                            <AvatarFallback className="text-xl md:text-5xl font-headline bg-muted">{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                         {player.rank === 1 ? (
                             <Crown className={cn("absolute -top-3 -right-3 md:-top-10 md:-right-10 h-6 w-6 md:h-20 md:w-20 transform rotate-12 drop-shadow-2xl", rankStyle.icon)} strokeWidth={2.5}/>
                         ) : (
                             <div className={cn("absolute -bottom-2 -right-2 h-5 w-5 md:h-12 md:w-12 rounded-full bg-background border-2 flex items-center justify-center shadow-xl", player.rank === 2 ? 'border-silver' : 'border-bronze')}>
                                 <span className={cn("text-[10px] md:text-xl font-black", rankStyle.icon)}>{player.rank}</span>
                             </div>
                         )}
                    </div>
                    <div className="space-y-1 w-full">
                        <h3 className={cn("font-headline uppercase leading-none truncate tracking-tight text-white", rankStyle.name)}>
                            {player.name.split(' ')[0]}
                        </h3>
                        <p className="text-[6px] sm:text-[10px] md:text-sm text-muted-foreground/40 font-black uppercase tracking-[0.2em] opacity-80">
                            &quot;{player.nickname}&quot;
                        </p>
                    </div>
                     <div className={cn("font-headline tracking-tighter leading-none shadow-2xl", rankStyle.pointsPlaque, player.rank === 1 ? "text-xs md:text-4xl" : "text-[10px] md:text-2xl")}>
                        {player.points.toFixed(0)}
                     </div>
                 </CardContent>
            </Card>
        </Link>
    )
}

export function LeaderboardHero({ players, leagueId }: LeaderboardHeroProps) {
  if (!players || players.length === 0) {
    return null;
  }
  
  const [p1, p2, p3] = players;
  
  return (
    <div className="w-full space-y-12 md:space-y-24 px-2">
      <div className="text-center space-y-3">
        <h2 className="text-lg md:text-6xl font-headline text-white text-glow drop-shadow-2xl uppercase tracking-tighter">Лидеры Дивизиона</h2>
        <div className="h-1 w-12 md:w-32 bg-primary/40 mx-auto rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
      </div>
      
      <div className="flex justify-center items-end gap-2 md:gap-12 max-w-5xl mx-auto pb-12">
          {p2 && <TopPlayerCard player={p2} leagueId={leagueId} />}
          {p1 && <TopPlayerCard player={p1} leagueId={leagueId} />}
          {p3 && <TopPlayerCard player={p3} leagueId={leagueId} />}
      </div>
    </div>
  );
}
