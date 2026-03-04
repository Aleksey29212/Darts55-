'use client';

import type { VisitStats } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Calendar, CalendarDays, CalendarClock, Handshake, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function StatCard({ title, value, icon: Icon, description }: { title: string, value: number, icon: React.ElementType, description: string }) {
  return (
    <div className="p-6 rounded-lg border bg-card/50 flex items-start gap-4 hover:border-primary/50 transition-colors">
      <div className="bg-primary/20 text-primary p-3 rounded-lg">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold">{value.toLocaleString('ru-RU')}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  )
}

export function AnalyticsDashboard({ initialStats }: { initialStats: VisitStats }) {
  const stats = initialStats;

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard title="Сегодня" value={stats.day} icon={CalendarClock} description="Сессий за последние 24 часа" />
            <StatCard title="Неделя" value={stats.week} icon={Calendar} description="Сессий за последние 7 дней" />
            <StatCard title="Год" value={stats.year} icon={CalendarDays} description="Сессий за последние 365 дней" />
            <StatCard title="Всего" value={stats.total} icon={Users} description="Всего сессий за все время" />
        </div>

        <Card className="glassmorphism">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Handshake className="text-primary" />
                    Статистика спонсоров игроков
                </CardTitle>
                <CardDescription>
                    Количество переходов по ссылкам спонсоров в карточках игроков.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {stats.sponsorClicks.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Игрок</TableHead>
                                <TableHead>Спонсор</TableHead>
                                <TableHead className="text-right">Переходов</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.sponsorClicks.map((stat, i) => (
                                <TableRow key={`${stat.playerId}-${stat.sponsorName}-${i}`}>
                                    <TableCell className="font-medium">{stat.playerName}</TableCell>
                                    <TableCell>{stat.sponsorName}</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-primary">
                                        {stat.clicks}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center py-8 text-muted-foreground italic">Данных о переходах пока нет.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
