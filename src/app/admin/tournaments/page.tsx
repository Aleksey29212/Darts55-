'use client';

import { ImportForm } from "@/components/import-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClearTournamentsButton } from "./clear-button";
import { TournamentManagement } from "./tournament-management";
import type { LeagueId, Tournament, AllLeagueSettings, League } from "@/lib/types";
import { useCollection, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function TournamentsAdminPage() {
    const db = useFirestore();

    const tournamentsQuery = useMemoFirebase(() => db ? collection(db, 'tournaments') : null, [db]);
    const { data: tournaments, isLoading: isLoadingTournaments } = useCollection<Tournament>(tournamentsQuery);

    const leagueSettingsRef = useMemoFirebase(() => db ? doc(db, 'app_settings', 'leagues') : null, [db]);
    const { data: leagueSettingsData, isLoading: isLoadingLeagues } = useDoc<AllLeagueSettings>(leagueSettingsRef);

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

    const isLoading = isLoadingTournaments || isLoadingLeagues;

    return (
        <div className="grid gap-8">
            <ImportForm leagues={leagues} />

            {isLoading ? (
                <Card className="glassmorphism">
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            ) : (
                <TournamentManagement tournaments={tournaments || []} leagues={leagues} />
            )}
            
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
