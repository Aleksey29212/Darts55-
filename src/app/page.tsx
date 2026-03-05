
import { getLeagueSettings, getAllScoringSettings } from '@/lib/settings';
import { getRankings } from '@/lib/leagues';
import type { LeagueId } from '@/lib/types';
import { LeaguePanels } from '@/components/league-panels';
import { PartnersDisplay } from '@/components/partners-display';
import { getPartners } from '@/lib/partners';
import { getTournaments } from '@/lib/tournaments';
import { PlayerSelector } from '@/components/player-selector';
import { unstable_noStore as noStore } from 'next/cache';

export default async function Home({ searchParams }: { searchParams: { league?: LeagueId }}) {
  noStore();
  const leagueSettings = await getLeagueSettings();
  const allScoringSettings = await getAllScoringSettings();
  
  const enabledLeagues = (Object.keys(leagueSettings) as LeagueId[]).filter(key => leagueSettings[key].enabled);
  const rankings = await Promise.all(enabledLeagues.map(id => getRankings(id)));
  
  const partners = await getPartners();
  const tournaments = await getTournaments();

  const allPlayers = rankings.flat().filter((p, i, a) => a.findIndex(p2 => p2.id === p.id) === i);

  const defaultTab = searchParams.league && enabledLeagues.includes(searchParams.league) ? searchParams.league : 'general';

  return (
    <main className="flex-1 flex flex-col items-center pt-8 md:pt-20 space-y-12 md:space-y-24">
      <div className="container space-y-12">
        <PlayerSelector 
          players={allPlayers} 
          rankings={rankings} 
          enabledLeagues={enabledLeagues} 
          currentLeagueId={defaultTab}
          leagueSettings={leagueSettings}
        />
        <LeaguePanels 
          enabledLeagues={enabledLeagues} 
          leagueSettings={leagueSettings}
          rankings={rankings}
          defaultTab={defaultTab}
          allScoringSettings={allScoringSettings}
        />
      </div>
      
    </main>
  );
}
