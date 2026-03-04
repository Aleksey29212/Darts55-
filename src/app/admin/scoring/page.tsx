import { getAllScoringSettings, getLeagueSettings } from '@/lib/settings';
import { ScoringClientPage } from './scoring-client-page';

export default async function ScoringPage() {
  const allScoringSettings = await getAllScoringSettings();
  const leagueSettings = await getLeagueSettings();

  return (
    <ScoringClientPage 
        allScoringSettings={allScoringSettings}
        leagueSettings={leagueSettings}
    />
  );
}
