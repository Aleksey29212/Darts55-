import { ImportForm } from "@/components/import-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClearTournamentsButton } from "./clear-button";
import { TournamentManagement } from "./tournament-management";
import type { LeagueId, Tournament, AllLeagueSettings, League } from "@/lib/types";
import { getTournaments } from "@/lib/tournaments";
import { getLeagueSettings } from "@/lib/settings";

export default async function TournamentsAdminPage() {
    const tournaments = await getTournaments();
    const leagueSettingsData = await getLeagueSettings();

    const leagueSettings = leagueSettingsData || {
        general: { enabled: true, name: 'Общий рейтинг' },
        premier: { enabled: false, name: 'Премьер-лига' },
        first: { enabled: false, name: 'Первая лига' },
        cricket: { enabled: false, name: 'Крикет' },
        senior: { enabled: false, name: 'Сеньоры' },
        youth: { enabled: false, name: 'Юниоры' },
        women: { enabled: false, name: 'Женская лига' },
        evening_omsk: { enabled: false, name: 'Вечерний Омск' },
    };

    const leagues: League[] = (Object.keys(leagueSettings) as LeagueId[]).map(key => ({
        id: key,
        name: leagueSettings[key].name,
        enabled: leagueSettings[key].enabled
    }));

    return (
        <div className="grid gap-8">
            <ImportForm leagues={leagues} />

            <TournamentManagement tournaments={tournaments} leagues={leagues} />
            
            <Card className="glassmorphism border-destructive">
                <CardHeader>
                    <CardTitle className="text-xl text-destructive">Опасная зона</CardTitle>
                    <CardDescription>
                        Это действие необратимо. Будьте внимательны.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Очистить ВСЕ турниры</p>
                        <p className="text-sm text-muted-foreground">Удаляет все турниры и сбрасывает статистику игроков.</p>
                    </div>
                    <ClearTournamentsButton />
                </CardContent>
            </Card>
        </div>
    );
}
