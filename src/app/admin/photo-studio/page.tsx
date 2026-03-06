import { getPlayerProfiles } from "@/lib/players";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUploader } from "@/components/photo-uploader";
import { Camera } from "lucide-react";
import type { PlayerProfile } from "@/lib/types";

export default async function PhotoStudioPage() {
    // Use basic player profiles instead of calculating full rankings to save resources
    const players: PlayerProfile[] = await getPlayerProfiles();
    
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
