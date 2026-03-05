'use client';

import { PlayerCard } from '@/components/player-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { TemplateSwitcher, type TemplateId } from '@/components/template-switcher';
import { useState } from 'react';
import type { Player, PlayerTournamentHistory, ScoringSettings, LeagueId } from '@/lib/types';
import { TournamentHistory } from '@/components/tournament-history';
import { useIsClient } from '@/hooks/use-is-client';
import { ShareButtons } from '@/components/share-buttons';
import { PlayerAnalyticsCarousel } from '@/components/player-analytics-carousel';

export function PlayerPageClient({
  player,
  tournaments,
  viewMode,
  pageSubtitle,
  contextId,
  leagueId,
  scoringSettings,
  leagueName,
}: {
  player: Player;
  tournaments: PlayerTournamentHistory[];
  viewMode: 'aggregate' | 'single';
  pageSubtitle: string | null;
  contextId?: string | null;
  scoringSettings: ScoringSettings;
  leagueName: string;
  leagueId?: LeagueId;
}) {
  const { isAdmin } = useAdmin();
  const [template, setTemplate] = useState<TemplateId>('classic');
  const isClient = useIsClient();

  const backLink = viewMode === 'single' && contextId ? `/tournaments/${contextId}` : (leagueId ? `/?league=${leagueId}` : '/');
  const backText = viewMode === 'single' ? 'Назад к турниру' : 'Назад к рейтингам';

  return (
    <main className="flex-1 container py-8">
      <div className="flex justify-between items-start mb-8">
        <Button asChild variant="outline">
          <Link href={backLink}>
            <ArrowLeft />
            {backText}
          </Link>
        </Button>
      </div>

      {pageSubtitle && (
        <div className="mb-4 p-4 bg-muted/50 rounded-lg text-center">
          <h2 className="font-semibold text-muted-foreground">{pageSubtitle}</h2>
        </div>
      )}
      
      <div className="grid lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3">
          <PlayerCard 
            player={player} 
            tournaments={tournaments}
            template={template} 
            viewMode={viewMode} 
            leagueId={leagueId} 
            scoringSettings={scoringSettings}
          />
        </div>
        <div className="lg:col-span-2 space-y-8 lg:sticky lg:top-24">
          {/* Analytics Block - Reverted to Carousel */}
          <PlayerAnalyticsCarousel player={player} tournaments={tournaments} viewMode={viewMode} />
          
          {isClient && isAdmin && <TemplateSwitcher selectedTemplate={template} onTemplateChange={setTemplate} />}
          <ShareButtons player={player} />
          {viewMode === 'aggregate' && (
            <TournamentHistory tournaments={tournaments} />
          )}
        </div>
      </div>
    </main>
  );
}
