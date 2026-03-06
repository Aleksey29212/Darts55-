

import { getTournamentById } from '@/lib/tournaments';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Medal } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { TournamentShareButton } from '@/components/tournament-share-button';
import { getLeagueSettings, getScoringSettings } from '@/lib/settings';
import { calculatePlayerPoints } from '@/lib/scoring';
import { Badge } from '@/components/ui/badge';

export default async function TournamentDetailsPage({
  params,
}: {
  params: { id: string };
}) {
    const tournamentData = await getTournamentById(params.id);

    if (!tournamentData) {
        notFound();
    }
    
    const leagueSettings = await getLeagueSettings();
    const leagueName = leagueSettings[tournamentData.league]?.name || tournamentData.league;

    // Recalculate points on the fly to ensure they are up-to-date with current settings
    const scoringSettings = await getScoringSettings(tournamentData.league);
    const playersWithCalculatedPoints = tournamentData.players.map(player => {
        // Create a copy to avoid mutating the original object from the cache
        const playerCopy = { ...player };
        calculatePlayerPoints(playerCopy, scoringSettings, tournamentData.league);
        return playerCopy;
    });

    const tournament = {
        ...tournamentData,
        players: playersWithCalculatedPoints,
    };


    return (
        <main className="flex-1 container py-8">
            <div className="mb-8 flex justify-between items-center">
                <Button asChild variant="outline">
                    <Link href="/tournaments">
                        <ArrowLeft />
                        Назад к турнирам
                    </Link>
                </Button>
                <TournamentShareButton tournament={tournament} />
            </div>
            <Card className="glassmorphism">
                <CardHeader>
                    <CardTitle className="text-2xl">{tournament.name}</CardTitle>
                    <CardDescription>Результаты от {formatDate(tournament.date as string)}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px] text-center">Место</TableHead>
                                <TableHead>Игрок</TableHead>
                                <TableHead className="text-right">Очки за место</TableHead>
                                <TableHead className="text-right">Бонусы</TableHead>
                                <TableHead className="text-right">Всего</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...tournament.players].sort((a,b) => a.rank - b.rank).map((player) => (
                                <TableRow key={player.id}>
                                    <TableCell className="font-headline text-xl text-center align-middle">
                                         <div className="flex items-center justify-center gap-2">
                                            {player.rank === 1 && <Medal className="text-gold"/>}
                                            {player.rank === 2 && <Medal className="text-silver"/>}
                                            {player.rank === 3 && <Medal className="text-bronze"/>}
                                            {player.rank}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/player/${player.id}?tournamentId=${tournament.id}`} className="flex items-center gap-4 group">
                                            <Avatar>
                                                <AvatarImage src={player.avatarUrl} alt={player.name} data-ai-hint={player.imageHint} />
                                                <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <p className="font-medium group-hover:text-primary transition-colors">{player.name}</p>
                                                <Badge variant="secondary" className="font-normal mt-1 w-fit">{player.nickname}</Badge>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{player.basePoints}</TableCell>
                                    <TableCell className="text-right font-mono text-success">
                                        {player.bonusPoints > 0 ? `+${player.bonusPoints}` : '0'}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-primary text-lg">
                                        {player.points}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    );
}
