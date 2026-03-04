
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trophy, Shield, Award, Star, Users, Baby, Venus, CircleHelp, Moon } from 'lucide-react';
import type { ScoringSettings, LeagueId, AllLeagueSettings } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BrandLogo } from './icons/brand-logo';

interface ScoringHelpDialogProps {
  allSettings: Record<LeagueId, ScoringSettings>;
  leagueSettings: AllLeagueSettings;
  children?: ReactNode;
}

const leagueIcons: Record<string, any> = {
    general: Trophy,
    premier: Shield,
    first: Award,
    cricket: Star,
    senior: Users,
    youth: Baby,
    women: Venus,
    evening_omsk: Moon,
};

export function ScoringHelpDialog({ allSettings, leagueSettings, children }: ScoringHelpDialogProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const enabledLeagues = (Object.keys(leagueSettings) as LeagueId[]).filter(id => leagueSettings[id].enabled);

  const renderLeagueContent = (id: LeagueId) => {
    const settings = allSettings[id];
    if (!settings) return null;

    const sections = [];
    const pointVal = settings.pointValue || 5;

    if (id === 'evening_omsk') {
        sections.push({
            title: 'Уникальная система «Вечерний Омск»',
            content: `Начисление баллов основано на Вашем среднем наборе (AVG) в туре и достигнутой стадии плей-офф.\n\nАктуальные множители стадии:\n- 1-е место: AVG × ${settings.pointsFor1st.toFixed(2)}\n- 2-е место: AVG × ${settings.pointsFor2nd.toFixed(2)}\n- 1/2 финала (3-4 места): AVG × ${settings.pointsFor3rd_4th.toFixed(2)}\n- 1/4 финала (5-8 места): AVG × ${settings.pointsFor5th_8th.toFixed(2)}\n- Резерв/Остальные: ${settings.participationPoints} баллов фиксированно`,
        });
        sections.push({
            title: 'Турнирный формат',
            content: 'Турнир включает 8 отборочных туров и 1 финальный (9-й). Для выхода в финал необходимо принять участие как минимум в любых 5 отборочных турах. В финал выходят ТОП-12 (16) игроков рейтинга.',
        });
        sections.push({
            title: 'Призовые и монетизация',
            content: `1 балл = ${pointVal} рублей.\n\nПо итогам 9-го тура восемь лучших игроков смогут обналичить накопленные баллы за свои 5 лучших выступлений (включая результат финала).`,
        });
    } else {
        sections.push({
          title: 'Приоритет в рейтинге',
          content: 'При равенстве очков, место игрока определяется по критериям:\n1. Основные очки.\n2. Средний набор (AVG).\n3. Количество "побед" (ТОП-8).\n4. Количество сыгранных матчей.',
        });

        const basePointsDescription = [
          `1-е место: ${settings.pointsFor1st} очков`,
          `2-е место: ${settings.pointsFor2nd} очков`,
          `3-4 места: ${settings.pointsFor3rd_4th} очков`,
          `5-8 места: ${settings.pointsFor5th_8th} очков`,
          `9-16 места: ${settings.pointsFor9th_16th} очков`,
          `Остальные: ${settings.participationPoints} очков`,
        ].join('\n');
        
        sections.push({
          title: 'Основные очки за место',
          content: basePointsDescription,
        });
    }

    const activeBonuses = [];
    if (settings.enable180Bonus && settings.bonusPer180 > 0) {
      activeBonuses.push(`- За каждый "максимум" (180): +${settings.bonusPer180} очков.`);
    }
    if (settings.enableHiOutBonus && settings.hiOutBonus > 0) {
      activeBonuses.push(`- За чекаут ${settings.hiOutThreshold} и выше: +${settings.hiOutBonus} очков.`);
    }
    if (settings.enableAvgBonus && settings.avgBonus > 0) {
      activeBonuses.push(`- За средний набор (AVG) ${settings.avgThreshold} и выше: +${settings.avgBonus} очков.`);
    }
    if (settings.enableShortLegBonus && settings.shortLegBonus > 0) {
      activeBonuses.push(`- За "короткий" лег (≤ ${settings.shortLegThreshold} дротиков): +${settings.shortLegBonus} очков.`);
    }
    if (settings.enable9DarterBonus && settings.bonusFor9Darter > 0) {
        activeBonuses.push(`- За "идеальный" лег (9 дротиков): +${settings.bonusFor9Darter} очков.`);
    }

    if (activeBonuses.length > 0) {
      sections.push({
        title: 'Активные бонусы',
        content: activeBonuses.join('\n'),
      });
    }

    if (id !== 'general' && id !== 'evening_omsk') {
        sections.push({
            title: 'Статус в общем зачете',
            content: settings.includeInGeneral 
                ? '🏆 Очки из этой лиги учитываются в глобальном рейтинге.' 
                : '⏸ Независимая лига. Очки не суммируются в общем зачете.',
        });
    }

    return (
        <div className="space-y-4 pt-4">
            {sections.map((section, index) => (
                <div key={index} className="p-3 rounded-xl bg-muted/30 border border-border/50 shadow-sm">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-primary mb-1.5">{section.title}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{section.content}</p>
                </div>
            ))}
        </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <CircleHelp className="text-primary h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glassmorphism max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl uppercase font-headline tracking-tighter">
            <BrandLogo className="h-8 w-8" />
            Система начисления баллов
          </DialogTitle>
          <DialogDescription className="text-base">
            Выберите лигу для просмотра правил распределения очков и бонусов.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={enabledLeagues[0] || "general"} className="w-full mt-4">
            <ScrollArea className="w-full whitespace-nowrap">
                <TabsList className="flex w-fit bg-muted/20 p-1 border border-border/50 h-auto">
                    {enabledLeagues.map(id => {
                        const Icon = leagueIcons[id] || Trophy;
                        return (
                            <TabsTrigger 
                                key={id} 
                                value={id} 
                                className="gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg"
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="font-bold text-[10px] uppercase tracking-tighter whitespace-nowrap">
                                    {leagueSettings[id].name}
                                </span>
                            </TabsTrigger>
                        )
                    })}
                </TabsList>
            </ScrollArea>

            <ScrollArea className="h-[50vh] mt-2 pr-4">
                {enabledLeagues.map(id => (
                    <TabsContent key={id} value={id} className="animate-in fade-in duration-300">
                        {renderLeagueContent(id)}
                    </TabsContent>
                ))}
            </ScrollArea>
        </Tabs>

        <div className="mt-6 pt-4 border-t-2 border-primary/10 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em]">DartBrig Pro Core v2.6</p>
            <div className="flex gap-4 text-[9px] text-muted-foreground font-medium italic">
                <p>разраб. Рядченко А. Андякин К.</p>
                <p>тест. Онищук С.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
