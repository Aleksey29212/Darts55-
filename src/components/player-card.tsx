'use client';

import type { Player, PlayerProfile, SponsorshipSettings, SponsorInfo, LeagueId, ScoringSettings, PlayerTournamentHistory } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useAdmin } from '@/context/admin-context';
import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Save, Edit, X, Info, Zap, Handshake, Star, Sparkles, Trophy, Shield, Award, Users, Baby, Venus, Moon, Target, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TemplateId } from './template-switcher';
import { cn } from '@/lib/utils';
import { useIsClient } from '@/hooks/use-is-client';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { updatePlayerProfile } from '@/firebase/players';
import { logSponsorClickAction } from '@/app/actions';
import { doc } from 'firebase/firestore';

interface PlayerCardProps {
  player: Player;
  tournaments?: PlayerTournamentHistory[];
  template?: TemplateId;
  viewMode: 'aggregate' | 'single';
  leagueId?: LeagueId;
  scoringSettings?: ScoringSettings;
}

const leagueVisuals: Record<string, { icon: React.ElementType; color: string; bg: string; label: string; border: string }> = {
    general: { icon: Trophy, color: 'text-primary', bg: 'bg-primary/20', label: 'Общий рейтинг', border: 'border-primary/30' },
    premier: { icon: Shield, color: 'text-destructive', bg: 'bg-destructive/20', label: 'Премьер-лига', border: 'border-destructive/30' },
    first: { icon: Award, color: 'text-accent', bg: 'bg-accent/20', label: 'Первая лига', border: 'border-accent/30' },
    cricket: { icon: Star, color: 'text-gold', bg: 'bg-gold/20', label: 'Крикет', border: 'border-gold/30' },
    senior: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/20', label: 'Сеньоры', border: 'border-blue-500/30' },
    youth: { icon: Baby, color: 'text-emerald-500', bg: 'bg-emerald-500/20', label: 'Юниоры', border: 'border-emerald-500/30' },
    women: { icon: Venus, color: 'text-pink-500', bg: 'bg-pink-500/20', label: 'Женская лига', border: 'border-pink-500/30' },
    evening_omsk: { icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/20', label: 'Вечерний Омск', border: 'border-indigo-500/30' },
};

const StatItem = ({ label, value, name, description, isHighlighted }: { label: string; value: string | number; name: string, description?: string, isHighlighted?: boolean }) => {
    const baseClasses = cn(
        "flex flex-col items-center justify-center p-4 md:p-6 rounded-3xl gap-2 min-h-[90px] md:min-h-[130px] border-2 transition-all duration-500",
        isHighlighted ? "border-primary bg-primary/10 shadow-2xl shadow-primary/10 scale-105 z-10" : "border-white/5 bg-white/2 hover:border-white/20 hover:bg-white/5"
    );
    
    const valueClasses = cn(
        "text-2xl md:text-5xl font-black font-headline tracking-tighter leading-none",
        (name === 'avg' || name === 'points') ? 'text-primary text-glow' : 'text-foreground'
    );
    
    const content = (
      <div className={baseClasses}>
          <p className="text-[9px] md:text-[11px] font-black text-muted-foreground/40 flex items-center justify-center gap-2 text-center uppercase tracking-[0.3em]">
              {label}
              {description && <Info className="h-3 w-3 opacity-20 hidden md:block" />}
          </p>
          <p className={valueClasses}>{value}</p>
      </div>
    );

    if (description) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <div className="cursor-help w-full">{content}</div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-center glassmorphism p-5 border-white/10">
                    <p className="text-xs font-bold leading-relaxed">{description}</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    return content;
}

function AchievementBadges({ player, tournaments, viewMode }: { player: Player, tournaments?: PlayerTournamentHistory[], viewMode: 'aggregate' | 'single' }) {
    const latestTournament = (tournaments && tournaments.length > 0) ? tournaments[0] : null;
    
    const stats = viewMode === 'single' ? {
        hiOut: player.hiOut,
        n180s: player.n180s,
        bestLeg: player.bestLeg
    } : {
        hiOut: latestTournament?.hiOut || 0,
        n180s: latestTournament?.n180s || 0,
        bestLeg: latestTournament?.bestLeg || 0
    };

    const achievements = [];
    
    if (stats.hiOut >= 100) {
        achievements.push({ 
            id: 'hiout',
            label: '100+ OUT', 
            icon: Target, 
            color: 'bg-gold/10 text-gold border-gold/20',
            tooltip: `Результат последнего тура: ${stats.hiOut}`
        });
    }
    
    if (stats.n180s > 0) {
        achievements.push({ 
            id: '180s',
            label: 'MAXIMUM', 
            icon: Flame, 
            color: 'bg-red-500/10 text-red-500 border-red-500/20',
            tooltip: `Максимумов (180) за последний тур: ${stats.n180s}`
        });
    }
    
    if (stats.bestLeg > 0 && stats.bestLeg <= 15) {
        achievements.push({ 
            id: 'leg',
            label: 'BEST LEG', 
            icon: Zap, 
            color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            tooltip: `Лучший лег последнего тура: ${stats.bestLeg} дротиков`
        });
    }

    if (achievements.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-4">
            {achievements.map((ach) => (
                <Tooltip key={ach.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Badge 
                            variant="outline" 
                            className={cn(
                                "gap-2 px-3 py-1.5 text-[9px] md:text-[11px] uppercase font-black tracking-[0.2em] border-2 backdrop-blur-md animate-in fade-in zoom-in duration-500 cursor-help", 
                                ach.color
                            )}
                        >
                            <ach.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            {ach.label}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="glassmorphism p-3 border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest">{ach.tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    );
}

function SponsorPill({ sponsor, playerId, playerName }: { sponsor: SponsorInfo, playerId: string, playerName: string }) {
    const handleSponsorClick = () => {
        if (sponsor.name && sponsor.link) {
            logSponsorClickAction(playerId, playerName, sponsor.name);
        }
    };

    return (
        <div className="group/sponsor relative">
            <div className="h-12 md:h-20 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full flex items-center px-2 py-2 gap-3 md:gap-5 pr-6 shadow-2xl hover:border-primary/50 hover:bg-white/10 transition-all duration-500">
                <div className="h-8 w-8 md:h-16 md:w-16 relative bg-white rounded-full p-1.5 overflow-hidden flex-shrink-0 shadow-inner">
                    <Image src={sponsor.logoUrl} alt={sponsor.name} fill className="object-contain p-1.5" unoptimized />
                </div>
                <div className="flex flex-col min-w-0">
                    <h4 className="font-headline text-[10px] md:text-sm uppercase truncate tracking-[0.1em] leading-none mb-1">{sponsor.name}</h4>
                    <p className="text-[7px] md:text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Official Partner</p>
                </div>
                {sponsor.link && (
                    <a 
                        href={sponsor.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={handleSponsorClick}
                        className="absolute inset-0 z-10"
                        aria-label={`Visit ${sponsor.name}`}
                    />
                )}
            </div>
        </div>
    );
}

export function PlayerCard({ player, tournaments, template = 'classic', leagueId = 'general', viewMode }: PlayerCardProps) {
  const { isAdmin, setIsDirty } = useAdmin();
  const db = useFirestore();
  const [isEditing, setIsEditing] = useState(false);
  const [editablePlayer, setEditablePlayer] = useState<PlayerProfile>(player);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const { toast } = useToast();
  const isClient = useIsClient();
  const [randomSlogan, setRandomSlogan] = useState("");

  const sponsorSettingsRef = useMemoFirebase(() => db ? doc(db, 'app_settings', 'sponsorship') : null, [db]);
  const { data: globalSponsorSettings } = useDoc<SponsorshipSettings>(sponsorSettingsRef);

  const activeLeague = leagueVisuals[leagueId] || leagueVisuals.general;
  const isOmsk = leagueId === 'evening_omsk';

  useEffect(() => {
    setEditablePlayer(player);
  }, [player]);

  useEffect(() => {
    const slogans = ["Поддержите талант!", "Станьте частью команды", "Ваш успех — наша цель", "Инвестируйте в мастерство", "Развиваем дартс вместе"];
    setRandomSlogan(slogans[Math.floor(Math.random() * slogans.length)]);
  }, [player.id]);

  useEffect(() => {
    setIsDirty(isFormDirty);
    return () => setIsDirty(false);
  }, [isFormDirty, setIsDirty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditablePlayer(prev => ({ ...prev, [name]: value }));
    setIsFormDirty(true);
  };
  
  const handleSave = async () => {
    if (!db) return;
    updatePlayerProfile(db, editablePlayer);
    toast({ title: 'Профиль обновлен', description: 'Изменения вступят в силу немедленно.' });
    setIsFormDirty(false);
    setIsEditing(false);
  }

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditablePlayer(player);
    setIsFormDirty(false);
  };

  const currentPlayerData = isEditing ? editablePlayer : player;
  const backgroundImageUrl = currentPlayerData.backgroundUrl || `https://images.unsplash.com/photo-1544098485-2a216e2133c1`;
  const hasAnySponsor = currentPlayerData.sponsors && currentPlayerData.sponsors.length > 0;
  const showRecruitmentCta = !hasAnySponsor && globalSponsorSettings?.showGlobalSponsorCta !== false;

  const groupVkLink = globalSponsorSettings?.groupVkLink || 'https://vk.com/dartbrig';
  const tgLink = globalSponsorSettings?.groupTelegramLink || 'https://t.me/+guTrCGUrh4gxNGZi';

  return (
    <TooltipProvider>
    <Card className={cn(
        "glassmorphism overflow-hidden transition-all duration-1000 border-2 shadow-[0_50px_100px_rgba(0,0,0,0.7)] group/card w-full",
        template === 'modern' && 'flex flex-col md:flex-row min-h-[800px]',
        template === 'dynamic' && 'border-primary/20 shadow-primary/10'
    )}>
        {/* HERO SECTION */}
        <div className={cn(
            "relative overflow-hidden border-b-2 border-white/5 w-full",
            template === 'classic' && "min-h-[500px] md:min-h-[700px]",
            template === 'modern' && "p-8 md:p-16 md:w-[45%] flex flex-col items-center justify-center border-b-0 md:border-r-2 border-white/10 bg-black/40 min-h-[400px]",
            template === 'dynamic' && "min-h-[500px] md:min-h-[700px]"
        )}>
            {/* Background Image Container */}
            <div className="absolute inset-0 z-0 w-full h-full bg-background pointer-events-none">
                <Image 
                    src={backgroundImageUrl}
                    alt="hero-bg"
                    fill
                    className="object-cover object-center opacity-40 grayscale-[0.5] transition-all [transition-duration:5000ms] group-hover/card:scale-110 group-hover/card:grayscale-0"
                    unoptimized
                    priority
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* League Marker - Positioned high to avoid overlap */}
            <div className="absolute top-8 left-8 md:top-12 md:left-12 z-50 flex items-center gap-3 px-4 py-2 md:px-6 md:py-3 rounded-full bg-black/70 backdrop-blur-3xl border border-white/10 shadow-2xl">
                <div className={cn("p-1.5 md:p-2 rounded-full shadow-lg", activeLeague.bg, activeLeague.color)}>
                    <activeLeague.icon className="h-4 w-4 md:h-6 md:w-6" />
                </div>
                <span className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] text-white whitespace-nowrap">{activeLeague.label}</span>
            </div>

            {/* Content Container - Increased top padding to avoid league overlap */}
            <div className={cn(
                "relative transition-all duration-1000 p-6 sm:p-12 md:p-20 z-30 w-full h-full",
                template === 'classic' && "flex flex-col justify-end items-center md:items-start gap-6 md:gap-12 pt-48 md:pt-64 pb-12",
                template === 'modern' && "flex flex-col items-center justify-center gap-8 md:gap-12 pt-48",
                template === 'dynamic' && "flex flex-col justify-end items-center pt-48 md:pt-64"
            )}>
                <div className="relative">
                    <div className="absolute -inset-4 bg-primary/30 blur-3xl rounded-full opacity-40 animate-pulse" />
                    <Avatar className={cn(
                        "transition-all duration-1000 shadow-[0_30px_80px_rgba(0,0,0,0.8)] relative z-10",
                        "h-32 w-32 sm:h-48 sm:w-48 md:h-72 md:w-72 border-4 md:border-[12px] border-primary/90",
                        template === 'dynamic' && "h-36 w-32 md:h-80 md:w-80 border-white/20"
                    )}>
                        <AvatarImage src={currentPlayerData.avatarUrl} alt={currentPlayerData.name} className="object-cover" />
                        <AvatarFallback className="text-4xl md:text-9xl font-headline bg-muted">{currentPlayerData.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
                
                 <div className={cn(
                     "relative z-20 w-full",
                     template === 'modern' ? 'text-center' : 'flex flex-col items-center md:items-start gap-2 md:gap-4'
                 )}>
                    <h1 className={cn(
                        "font-headline text-white uppercase tracking-tight leading-none text-center md:text-left",
                        "drop-shadow-[0_15px_40px_rgba(0,0,0,1)] [text-shadow:_0_8px_25px_rgba(0,0,0,1)]",
                        currentPlayerData.name.length > 15 ? "text-2xl sm:text-4xl md:text-6xl" : "text-3xl sm:text-6xl md:text-8xl"
                    )}>
                        {currentPlayerData.name}
                    </h1>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-5">
                        <Badge variant="secondary" className="font-black px-3 py-1 md:px-6 md:py-3 text-[11px] md:text-xl uppercase tracking-[0.2em] border-2 border-primary/40 bg-black/90 shadow-2xl">
                            {currentPlayerData.nickname}
                        </Badge>
                        <AchievementBadges player={player} tournaments={tournaments} viewMode={viewMode} />
                    </div>
                </div>
            </div>

            {/* Global Rank Badge */}
            <div className="absolute top-8 right-8 md:top-12 md:right-12 z-40">
                <div className="flex flex-col items-center justify-center min-w-[70px] md:min-w-[140px] p-3 md:p-8 rounded-2xl md:rounded-[3rem] backdrop-blur-3xl border-2 border-white/10 bg-white/5 shadow-2xl rotate-3">
                    <span className="text-[8px] md:text-[14px] font-black uppercase text-muted-foreground/60 tracking-[0.4em] mb-2">RANK</span>
                    <div className="flex items-baseline">
                        <span className="text-xl md:text-3xl font-headline text-primary/50 mr-1">#</span>
                        <span className="text-3xl md:text-8xl font-headline text-white leading-none">{player.rank > 0 ? player.rank : '-'}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* CONTENT SECTION */}
        <CardContent className={cn("p-6 sm:p-12 md:p-20 relative z-20", template === 'dynamic' && "pt-24 md:pt-64")}>
             {isClient && isAdmin && !isEditing && (
                 <Button onClick={() => setIsEditing(true)} variant="outline" className="mb-12 w-full h-16 border-2 border-dashed border-primary/20 hover:border-primary/50 text-xs font-black uppercase tracking-[0.4em] transition-all">
                    <Edit className="mr-4 h-5 w-5"/> EDIT PROFESSIONAL PROFILE
                 </Button>
             )}

             {isEditing && (
                 <div className="space-y-8 mb-16 p-10 border-2 border-primary/30 rounded-[3rem] bg-primary/5 animate-in slide-in-from-top-8 duration-700 shadow-3xl">
                    <div className="flex items-center gap-4 border-b border-primary/20 pb-6">
                        <div className="p-3 bg-primary/20 rounded-2xl"><Edit className="text-primary h-6 w-6" /></div>
                        <h3 className="font-headline text-2xl md:text-4xl uppercase text-primary tracking-tighter">PRO EDITOR MODE</h3>
                    </div>
                    <div className="grid gap-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3"><Label className="text-[11px] uppercase font-black text-muted-foreground tracking-[0.3em]">Player Nickname</Label><Input name="nickname" value={editablePlayer.nickname} onChange={handleInputChange} className="h-14 bg-black/40 border-white/10 text-lg font-bold" /></div>
                            <div className="space-y-3"><Label className="text-[11px] uppercase font-black text-muted-foreground tracking-[0.3em]">Short Biography</Label><Textarea name="bio" value={editablePlayer.bio} onChange={handleInputChange} className="min-h-[120px] bg-black/40 border-white/10 text-base leading-relaxed" /></div>
                        </div>
                        <div className="flex gap-6">
                            <Button onClick={handleSave} className="flex-1 h-16 text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/30"><Save className="mr-3 h-5 w-5" /> SAVE PRO DATA</Button>
                            <Button onClick={handleCancelEditing} variant="destructive" className="flex-1 h-16 text-xs font-black uppercase tracking-widest"><X className="mr-3 h-5 w-5" /> CANCEL</Button>
                        </div>
                    </div>
                 </div>
             )}
            
            <div className="space-y-12">
                <div className="space-y-12">
                    {hasAnySponsor ? (
                        <div className="space-y-6 md:space-y-8">
                            <h3 className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.4em] text-primary/60 flex items-center gap-4">
                                <Handshake className="h-5 w-5" /> OFFICIAL PARTNERS
                            </h3>
                            <div className="flex flex-wrap gap-4 md:gap-6">
                                {(currentPlayerData.sponsors || []).map((s, i) => (
                                    <SponsorPill key={`${s.name}-${i}`} sponsor={s} playerId={currentPlayerData.id} playerName={currentPlayerData.name} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        showRecruitmentCta && (
                            <div className="p-8 md:p-12 rounded-[3rem] border-2 border-dashed border-accent/30 bg-accent/[0.03] flex flex-col sm:flex-row items-center justify-between gap-8 shadow-3xl">
                                <div className="flex items-center gap-6 md:gap-8 text-center sm:text-left">
                                    <div className="p-5 bg-accent/20 rounded-full shadow-2xl"><Sparkles className="h-8 w-8 md:h-12 md:w-12 text-accent animate-pulse" /></div>
                                    <div>
                                        <h4 className="font-headline text-xs md:text-base uppercase tracking-[0.3em] text-accent mb-2">Станьте спонсором</h4>
                                        <p className="text-sm md:text-2xl font-bold leading-tight italic text-foreground/80">«{currentPlayerData.sponsorCtaText || randomSlogan}»</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 w-full sm:w-auto">
                                    <Button size="lg" variant="outline" className="flex-1 sm:flex-none h-14 md:h-20 px-10 text-[10px] md:text-xs font-black tracking-widest border-2 hover:bg-accent/10" asChild><a href={tgLink} target="_blank" rel="noopener noreferrer">TG PRO</a></Button>
                                    <Button size="lg" className="flex-1 sm:flex-none h-14 md:h-20 px-10 bg-accent text-accent-foreground text-[10px] md:text-xs font-black tracking-widest shadow-2xl shadow-accent/30" asChild><a href={groupVkLink} target="_blank" rel="noopener noreferrer">VK PRO</a></Button>
                                </div>
                            </div>
                        )
                    )}

                    <div className="space-y-6">
                        <h3 className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 border-b border-white/5 pb-3">BIOGRAPHY & CAREER</h3>
                        <p className="text-base md:text-xl text-foreground/90 leading-relaxed font-medium italic border-l-8 border-primary/40 pl-8 py-4 bg-white/[0.01] rounded-r-3xl">{currentPlayerData.bio || 'Официальная информация о карьере игрока находится в процессе наполнения.'}</p>
                    </div>
                    
                    <div className="space-y-8">
                        <h3 className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">SEASON ANALYTICS: <span className="text-foreground">{activeLeague.label}</span></h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-8">
                            <StatItem label="PTS TOTAL" name="points" value={(Number(player.points) || 0).toFixed(isOmsk ? 1 : 0)} />
                            <StatItem label="TOURS" name="matchesPlayed" value={player.matchesPlayed} />
                            <StatItem label="TOP-8" name="wins" value={player.wins} />
                            <StatItem label="AVG SET" name="avg" value={(Number(player.avg) || 0).toFixed(1)} isHighlighted={isOmsk} />
                            <StatItem label="MAX 180" name="n180s" value={player.n180s} />
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
    </TooltipProvider>
  );
}
