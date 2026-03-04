import { getTournaments } from '@/lib/tournaments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Trophy } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

export default async function TournamentsPage() {
    const tournaments = await getTournaments();

    return (
        <main className="flex-1 container py-8">
            <Card className="glassmorphism">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Trophy className="h-8 w-8 text-primary" />
                        <CardTitle className="text-2xl">Архив турниров</CardTitle>
                    </div>
                    <CardDescription>Просмотр результатов всех импортированных турниров.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Название турнира</TableHead>
                                <TableHead>Дата</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tournaments.length > 0 ? tournaments.sort((a,b) => {
                                 const dateA = a.date instanceof Timestamp ? a.date.toMillis() : new Date(a.date).getTime();
                                 const dateB = b.date instanceof Timestamp ? b.date.toMillis() : new Date(b.date).getTime();
                                 return dateB - dateA;
                            }).map((tournament) => (
                                <TableRow key={tournament.id}>
                                    <TableCell className="font-medium">{tournament.name}</TableCell>
                                    <TableCell>{formatDate(tournament.date as string)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/tournaments/${tournament.id}`}>
                                                Посмотреть результаты
                                                <ArrowRight />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                        Еще не импортировано ни одного турнира. Перейдите в панель администратора, чтобы импортировать.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    );
}
