

import { getAllScoringSettings, getLeagueSettings, getSponsorshipSettings } from '@/lib/settings';
import { calculateRankingsInternal } from '@/lib/leagues';
import type { LeagueId } from '@/lib/types';
import { getTournaments } from '@/lib/tournaments';
import { getPlayerProfiles } from '@/lib/players';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, Sparkles } from 'lucide-react';
import { PlayerSelector } from '@/components/player-selector';
import { getPartners } from '@/lib/partners';
import { PartnersDisplay } from '@/components/partners-display';
import { LeaguePanels } from '@/components/league-panels';
import { DartsMarquee } from '@/components/darts-marquee';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: { league?: LeagueId };
}) {
  let leagueSettings, tournamentsData, playerProfiles, allScoringSettings, partners, sponsorshipSettings;

  try {
    [
      leagueSettings,
      tournamentsData,
      playerProfiles,
      allScoringSettings,
      partners,
      sponsorshipSettings
    ] = await Promise.all([
      getLeagueSettings(),
      getTournaments(),
      getPlayerProfiles(),
      getAllScoringSettings(),
      getPartners(),
      getSponsorshipSettings()
    ]);
  } catch (error) {
    console.error('Critical failure fetching homepage data:', error);
    return (
      <main className="flex-1 container py-8 flex items-center justify-center">
        <Card className="glassmorphism max-w-lg w-full text-center p-12">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-destructive mb-4">Ошибка загрузки данных</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Произошла ошибка при подключении к базе данных. Пожалуйста, попробуйте обновить страницу позже.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!tournamentsData || tournamentsData.length === 0) {
    return (
      <main className="flex-1 container py-8 flex items-center justify-center">
        <Card className="glassmorphism max-w-lg w-full text-center p-12">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary text-glow mb-4">Система DartBrig Pro готова</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              В данный момент активные турниры не найдены. Пожалуйста, ожидайте обновления данных или свяжитесь с организаторами.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const enabledLeagues = (Object.keys(leagueSettings) as LeagueId[]).filter(key => leagueSettings[key] && leagueSettings[key].enabled);
  const defaultTab = searchParams?.league && enabledLeagues.includes(searchParams.league) ? searchParams.league : enabledLeagues[0] || 'general';

  const rankings = enabledLeagues.map(leagueId => 
    calculateRankingsInternal(leagueId, playerProfiles, tournamentsData, allScoringSettings)
  );

  const allActivePlayers = rankings
    .flat()
    .filter(p => p && p.matchesPlayed > 0)
    .filter((p, index, self) => index === self.findIndex(t => t.id === p.id));

  return (
    <main className="flex-1 flex flex-col min-h-screen">
       {/* Sticky Top Control Bar */}
       <div className="sticky top-14 md:top-20 z-40 flex flex-col w-full shadow-2xl">
          <DartsMarquee />
          <div className="bg-background/80 backdrop-blur-xl border-b border-white/5">
            <PartnersDisplay partners={partners} tournaments={tournamentsData} variant="compact" />
          </div>
       </div>
       
       <div className="container py-4 md:py-8 space-y-8 md:space-y-16">
          <div className="max-w-4xl mx-auto">
            <PlayerSelector 
                players={allActivePlayers} 
                rankings={rankings} 
                enabledLeagues={enabledLeagues}
                currentLeagueId={defaultTab}
                leagueSettings={leagueSettings}
            />
          </div>

          <LeaguePanels 
              enabledLeagues={enabledLeagues}
              leagueSettings={leagueSettings}
              rankings={rankings}
              defaultTab={defaultTab}
              allScoringSettings={allScoringSettings}
          />

          <section className="py-6 md:py-12">
            <Card className="glassmorphism border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden max-w-4xl mx-auto">
                <div className="absolute -right-8 -top-8 opacity-5">
                    <MessageCircle className="h-40 w-40" />
                </div>
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/20 p-2 rounded-xl w-fit mb-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg md:text-2xl font-headline uppercase tracking-tighter">Разместить информацию?</CardTitle>
                    <CardDescription className="text-[10px] md:text-sm max-w-md mx-auto">
                        Мы всегда рады новым турнирам и партнерам. Свяжитесь с нами для размещения.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row justify-center gap-2 pb-6">
                    <Button size="default" className="px-6 py-4 font-bold rounded-xl shadow-lg shadow-primary/10 group h-10 md:h-12" asChild>
                        <a href={sponsorshipSettings.groupVkLink} target="_blank" rel="noopener noreferrer">
                            <Send className="mr-2 h-4 w-4" />
                            Написать в ВК
                        </a>
                    </Button>
                    <Button size="default" variant="outline" className="px-6 py-4 font-bold rounded-xl border-primary/20 h-10 md:h-12" asChild>
                        <a href={sponsorshipSettings.groupTelegramLink} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Канал
                        </a>
                    </Button>
                </CardContent>
            </Card>
          </section>
       </div>
    </main>
  );
}
