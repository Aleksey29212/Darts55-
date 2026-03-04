'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PlayerTournamentHistory } from '@/lib/types';
import { History, Medal, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


export function TournamentHistory({ tournaments }: { tournaments: PlayerTournamentHistory[] }) {
  if (tournaments.length === 0) {
    return (
        <Card className="glassmorphism">
             <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <History className="text-primary"/>
                    История выступлений
                </CardTitle>
                <CardDescription>
                    У этого игрока пока нет истории матчей в выбранной лиге.
                </CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <Card className="glassmorphism">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
            <History className="text-primary"/>
            История матчей
        </CardTitle>
        <CardDescription>
            Турниры, учтенные в текущем рейтинге.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Турнир / Дата</TableHead>
              <TableHead>Лига</TableHead>
              <TableHead className="text-center">Место</TableHead>
              <TableHead className="text-right">Очки</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.map((t) => (
              <TableRow key={t.tournamentId} className="hover:bg-primary/5 transition-colors group">
                <TableCell>
                  <Link href={`/player/${t.playerId}?tournamentId=${t.tournamentId}`} className="block">
                    <p className="font-bold group-hover:text-primary transition-colors leading-snug">{t.tournamentName}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-primary font-black">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span className="text-[11px] tracking-widest">{formatDate(t.tournamentDate)}</span>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter whitespace-nowrap">{t.leagueName}</Badge>
                </TableCell>
                <TableCell className="font-headline text-lg text-center align-middle">
                  <div className="flex items-center justify-center gap-2">
                    {t.playerRank === 1 && <Medal className="text-gold h-4 w-4"/>}
                    {t.playerRank === 2 && <Medal className="text-silver h-4 w-4"/>}
                    {t.playerRank === 3 && <Medal className="text-bronze h-4 w-4"/>}
                    <span className={t.playerRank <= 3 ? "font-black" : ""}>{t.playerRank}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-black text-primary font-mono text-lg">
                    +{t.playerPoints.toFixed(t.leagueName.includes('Омск') ? 2 : 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
