'use client';

import { useState, useEffect, useRef } from 'react';
import type { LeagueId, Player, AllLeagueSettings, ScoringSettings } from '@/lib/types';
import { LeaderboardHero } from '@/components/leaderboard-hero';
import { PlayerRankings } from '@/components/player-rankings';
import { cn } from '@/lib/utils';
import { Trophy, Shield, Star, Award, Users, Baby, Venus, Sparkles, Moon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface LeaguePanelsProps {
  enabledLeagues: LeagueId[];
  leagueSettings: AllLeagueSettings;
  rankings: Player[][];
  defaultTab: LeagueId;
  allScoringSettings: Record<LeagueId, ScoringSettings>;
}

const leagueVisuals: Record<string, { icon: React.ElementType; color: string; border: string; bg: string; iconBg: string; text: string }> = {
    general: { icon: Trophy, color: 'text-primary', border: 'border-primary/50', bg: 'bg-primary/10', iconBg: 'bg-primary', text: 'text-primary-foreground' },
    premier: { icon: Shield, color: 'text-destructive', border: 'border-destructive/50', bg: 'bg-destructive/10', iconBg: 'bg-destructive', text: 'text-white' },
    first: { icon: Award, color: 'text-accent', border: 'border-accent/50', bg: 'bg-accent/10', iconBg: 'bg-accent', text: 'text-black' },
    cricket: { icon: Star, color: 'text-gold', border: 'border-gold/50', bg: 'bg-gold/10', iconBg: 'bg-gold', text: 'text-black' },
    senior: { icon: Users, color: 'text-blue-500', border: 'border-blue-500/50', bg: 'bg-blue-500/10', iconBg: 'bg-blue-500', text: 'text-white' },
    youth: { icon: Baby, color: 'text-emerald-500', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', iconBg: 'bg-emerald-500', text: 'text-white' },
    women: { icon: Venus, color: 'text-pink-500', border: 'border-pink-500/50', bg: 'bg-pink-500/10', iconBg: 'bg-pink-500', text: 'text-white' },
    evening_omsk: { icon: Moon, color: 'text-indigo-400', border: 'border-indigo-500/50', bg: 'bg-indigo-900/20', iconBg: 'bg-indigo-600', text: 'text-white' },
};

export function LeaguePanels({ enabledLeagues, leagueSettings, rankings, defaultTab, allScoringSettings }: LeaguePanelsProps) {
    const [selectedLeague, setSelectedLeague] = useState(defaultTab);
    const [progress, setProgress] = useState(0);
    const isMobile = useIsMobile();
    const isAutoRotating = useRef(true);
    const rotationInterval = 6000;
    const progressUpdateInterval = 50;

    useEffect(() => {
        if (!isMobile || !isAutoRotating.current || enabledLeagues.length <= 1) return;

        let startTime = Date.now();
        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = (elapsed / rotationInterval) * 100;
            
            if (newProgress >= 100) {
                setProgress(0);
                startTime = Date.now();
                setSelectedLeague((prev) => {
                    const currentIndex = enabledLeagues.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % enabledLeagues.length;
                    return enabledLeagues[nextIndex];
                });
            } else {
                setProgress(newProgress);
            }
        }, progressUpdateInterval);

        return () => clearInterval(timer);
    }, [isMobile, enabledLeagues]);

    const handleLeagueClick = (leagueId: LeagueId) => {
        setSelectedLeague(leagueId);
        isAutoRotating.current = false;
        setProgress(0);
    };
    
    return (
        <div className="w-full space-y-8 md:space-y-16">
            {/* Sticky League Selectors */}
            <div className="sticky top-[calc(3.5rem+32px+80px)] md:top-[calc(5rem+32px+100px)] z-30 bg-background/60 backdrop-blur-xl border-b border-white/5 py-4 md:py-6 shadow-xl">
                <div className="flex flex-wrap justify-center gap-2 md:gap-4 px-4">
                    {enabledLeagues.map(leagueId => {
                        const visual = leagueVisuals[leagueId] || leagueVisuals.general;
                        const Icon = visual.icon;
                        const isSelected = selectedLeague === leagueId;

                        return (
                            <button
                                key={leagueId}
                                onClick={() => handleLeagueClick(leagueId)}
                                className={cn(
                                    'px-3 py-2 md:px-6 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 flex items-center gap-2 md:gap-3 group relative overflow-hidden border',
                                    isSelected 
                                        ? cn('shadow-lg scale-105 z-10 border-white/20 bg-white/5 ring-2 ring-primary/10')
                                        : 'bg-card/20 backdrop-blur-md border-white/5 hover:border-white/10 active:scale-95'
                                )}
                            >
                                <div className={cn(
                                    'p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all duration-300',
                                    isSelected ? cn(visual.iconBg, "shadow-md") : 'bg-white/5'
                                )}>
                                    <Icon className={cn(
                                        "h-3 w-3 md:h-5 md:w-5 shrink-0 transition-colors",
                                        isSelected ? visual.text : 'text-muted-foreground/40'
                                    )} />
                                </div>
                                <div className="flex flex-col items-start min-w-0">
                                    <span className={cn(
                                        "text-[9px] md:text-sm font-headline uppercase tracking-tight truncate",
                                        isSelected ? "text-foreground" : "text-muted-foreground/40"
                                    )}>{leagueSettings[leagueId].name}</span>
                                </div>
                                
                                {isSelected && (
                                    <div className={cn(
                                        "absolute bottom-0 left-0 right-0 h-0.5",
                                        visual.iconBg
                                    )}>
                                        {isMobile && isAutoRotating.current && (
                                            <div 
                                                className="h-full bg-white/40 transition-all duration-75 ease-linear" 
                                                style={{ width: `${progress}%` }} 
                                            />
                                        )}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
            
            <div className="space-y-12 md:space-y-24">
                {enabledLeagues.map((leagueId, index) => {
                    if (selectedLeague !== leagueId) return null;
                    const players = rankings[index];
                    const activePlayers = players.filter(p => p.matchesPlayed > 0);
                    const topPlayers = activePlayers.filter(p => p.rank > 0 && p.rank <= 3).sort((a,b) => a.rank - b.rank);
                    
                    return (
                        <div key={leagueId} className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-12 md:space-y-24">
                            {topPlayers.length > 0 && <LeaderboardHero players={topPlayers} leagueId={leagueId} />}
                            <div className="pt-4">
                                <PlayerRankings players={activePlayers} leagueId={leagueId} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
