import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLeagueSettings } from '@/lib/settings';
import { LeagueSettingsForm } from './league-form';

export default async function LeaguesPage() {
  const leagueSettings = await getLeagueSettings();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="text-2xl">Управление лигами</CardTitle>
          <CardDescription>
            Включайте или отключайте отображение лиг на главной странице и задавайте им названия.
          </CardDescription>
        </CardHeader>
        <LeagueSettingsForm defaultValues={leagueSettings} />
      </Card>
    </div>
  );
}
