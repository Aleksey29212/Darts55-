'use client';

import { ScoringForm } from '@/components/scoring-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AllLeagueSettings, LeagueId, ScoringSettings } from '@/lib/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Shield, Star, Award, Users, Baby, PersonStanding, Moon } from 'lucide-react';


const leagueVisuals: Record<string, { icon: React.ElementType; color: string }> = {
    general: { icon: Trophy, color: 'text-primary' },
    premier: { icon: Shield, color: 'text-destructive' },
    first: { icon: Award, color: 'text-accent' },
    cricket: { icon: Star, color: 'text-gold' },
    senior: { icon: Users, color: 'text-blue-500' },
    youth: { icon: Baby, color: 'text-emerald-500' },
    women: { icon: PersonStanding, color: 'text-pink-500' },
    evening_omsk: { icon: Moon, color: 'text-indigo-400' },
};


interface ScoringClientPageProps {
    allScoringSettings: Record<LeagueId, ScoringSettings>;
    leagueSettings: AllLeagueSettings;
}

export function ScoringClientPage({ allScoringSettings, leagueSettings }: ScoringClientPageProps) {
  const enabledLeagues = (Object.keys(leagueSettings) as LeagueId[]).filter(key => leagueSettings[key].enabled);
  const [selectedLeague, setSelectedLeague] = useState<LeagueId>(enabledLeagues[0] || 'general');

  if (enabledLeagues.length === 0) {
      return (
         <div className="max-w-4xl mx-auto">
            <Card className="glassmorphism">
                <CardHeader>
                <CardTitle className="text-2xl">Настройка подсчета очков</CardTitle>
                <CardDescription>
                    Сначала включите хотя бы одну лигу в разделе "Управление лигами", чтобы настроить для нее очки.
                </CardDescription>
                </CardHeader>
            </Card>
        </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="text-2xl">Настройка подсчета очков</CardTitle>
          <CardDescription>
            Определите систему начисления очков для каждой лиги. Изменения повлияют на все будущие расчеты рейтинга.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {enabledLeagues.map(leagueId => {
              const visual = leagueVisuals[leagueId] || leagueVisuals.general;
              const Icon = visual.icon;
              const isSelected = selectedLeague === leagueId;
              return (
                <button
                  key={leagueId}
                  onClick={() => setSelectedLeague(leagueId)}
                  className={cn(
                    'p-4 rounded-lg text-left transition-all duration-200 flex items-center gap-3 active:scale-95',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary',
                    isSelected
                      ? 'bg-primary/10 border border-primary'
                      : 'bg-card/50 border border-border hover:border-primary/50'
                  )}
                >
                  <Icon className={cn(
                      "h-6 w-6 shrink-0 text-muted-foreground",
                      isSelected ? visual.color : 'group-hover:text-foreground'
                  )} />
                  <p className={cn("font-semibold text-xs md:text-sm", isSelected ? "text-primary" : "text-muted-foreground")}>{leagueSettings[leagueId].name}</p>
                </button>
              )
            })}
          </div>

          <div className="mt-6">
            {enabledLeagues.map(leagueId => (
              selectedLeague === leagueId && (
                <div key={leagueId} className="animate-in fade-in-50 duration-300">
                    <ScoringForm 
                        leagueId={leagueId}
                        defaultValues={allScoringSettings[leagueId]} 
                    />
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
