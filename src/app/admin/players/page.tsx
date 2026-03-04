import { PlayerManagement } from "@/components/player-management";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlayerProfiles } from "@/lib/players";
import { ExportButton } from "./export-button";
import { ClearButton } from "./clear-button";

export default async function PlayersPage() {
    const players = await getPlayerProfiles();

    return (
        <Card className="glassmorphism">
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl">Управление игроками</CardTitle>
                    <CardDescription>
                        Просмотр и редактирование профилей всех зарегистрированных игроков.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <ExportButton />
                    <ClearButton />
                </div>
            </CardHeader>
            <CardContent>
                <PlayerManagement players={players} />
            </CardContent>
        </Card>
    );
}
