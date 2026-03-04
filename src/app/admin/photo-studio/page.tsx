import { getPlayerProfiles } from "@/lib/players";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUploader } from "@/components/photo-uploader";
import { Camera } from "lucide-react";
import type { Player } from "@/lib/types";

export default async function PhotoStudioPage() {
    // Use basic player profiles instead of calculating full rankings to save resources
    const profiles = await getPlayerProfiles();
    
    // Map to Player type structure expected by PhotoUploader
    const players: Player[] = profiles.map(p => ({
        ...p,
        rank: 0,
        points: 0,
        basePoints: 0,
        bonusPoints: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        avg: 0,
        n180s: 0,
        hiOut: 0,
        bestLeg: 0,
        totalPointsFor180s: 0,
        totalPointsForHiOut: 0,
        totalPointsForAvg: 0,
        totalPointsForBestLeg: 0,
        totalPointsFor9Darter: 0,
    }));

    return (
        <div className="max-w-2xl mx-auto">
            <Card className="glassmorphism">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Camera className="text-primary"/>
                        Фотостудия
                    </CardTitle>
                    <CardDescription>
                        Загрузите или обновите аватары для игроков. Выберите игрока из списка и загрузите новую фотографию.
                    </CardDescription>
                </CardHeader>
                <PhotoUploader players={players} />
            </Card>
        </div>
    );
}
