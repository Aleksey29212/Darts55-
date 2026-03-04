
'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, CartesianGrid, XAxis, YAxis, Line, ComposedChart } from 'recharts';
import type { PlayerTournamentHistory } from '@/lib/types';
import { Activity, Calendar } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useMemo, useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';

const chartConfig = {
  points: {
    label: 'Баллы',
    color: 'hsl(var(--primary))',
  }
};

interface PlayerRatingChartProps {
    tournaments: PlayerTournamentHistory[];
    isStandalone?: boolean;
}

export function PlayerRatingChart({ tournaments, isStandalone = true }: PlayerRatingChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    const data = [{
      name: 'Старт сезона',
      displayDate: '0.0.0',
      points: 0,
      fullDate: 'Начало карьеры',
      isForecast: false
    }];

    if (!tournaments || tournaments.length === 0) return data;

    const sortedTournaments = [...tournaments].sort((a, b) => {
      const dateA = a.tournamentDate instanceof Timestamp ? a.tournamentDate.toMillis() : new Date(a.tournamentDate).getTime();
      const dateB = b.tournamentDate instanceof Timestamp ? b.tournamentDate.toMillis() : new Date(b.tournamentDate).getTime();
      return dateA - dateB;
    });

    let cumulativePoints = 0;
    
    sortedTournaments.forEach(t => {
      cumulativePoints += t.playerPoints;
      data.push({
        name: t.tournamentName,
        displayDate: formatDate(t.tournamentDate),
        points: Math.round(cumulativePoints * 100) / 100,
        fullDate: formatDate(t.tournamentDate),
        isForecast: false
      });
    });

    const lastPoint = data[data.length - 1];
    data.push({
      name: 'Будущие победы',
      displayDate: '...',
      points: Math.round((lastPoint?.points || 0) * 1.25 * 100) / 100,
      fullDate: 'Прогноз развития',
      isForecast: true
    });

    return data;
  }, [tournaments]);

  if (!tournaments || tournaments.length === 0) {
    return (
        <div className="h-[350px] w-full flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] bg-muted/5 gap-6">
            <div className="p-6 bg-primary/10 rounded-full">
                <Activity className="h-12 w-12 text-primary/40" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.4em] text-muted-foreground/30">История матчей пока пуста</p>
        </div>
    );
  }

  const chartContent = (
    <div className={cn("w-full h-full", isStandalone ? "bg-background/40 backdrop-blur-md p-4 md:p-8 pt-12" : "")}>
        {mounted ? (
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 40 }}
            >
              <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} />
              <XAxis
                dataKey="displayDate"
                tickLine={true}
                axisLine={false}
                tickMargin={15}
                fontSize={11}
                minTickGap={20}
                stroke="hsl(var(--muted-foreground))"
                angle={-45}
                textAnchor="end"
                height={70}
                className="font-bold"
              />
              <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={15}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                  domain={[0, 'auto']}
                  className="font-mono"
              />
              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5 5' }}
                content={
                  <ChartTooltipContent
                    className="glassmorphism border-primary/20 min-w-[220px] p-5 shadow-3xl"
                    formatter={(value, name, item, index) => {
                      const payload = item.payload || {};
                      return (
                        <div key={`tooltip-pts-${index}`} className="flex flex-col gap-4">
                          <div className="border-b border-white/10 pb-3">
                              <p className="font-headline text-[12px] text-primary uppercase leading-tight mb-1 truncate">
                                  {payload.name}
                              </p>
                              <div className="flex items-center gap-1.5 opacity-60">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-[10px] font-bold tracking-widest">{payload.fullDate}</span>
                              </div>
                          </div>
                          <div className={cn(
                              "flex justify-between items-center p-3 rounded-xl border",
                              payload.isForecast ? "bg-accent/10 border-accent/20" : "bg-primary/10 border-primary/20"
                          )}>
                              <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                                  {payload.isForecast ? 'ПОТЕНЦИАЛ' : 'НАКОПЛЕНО'}
                              </span>
                              <div className="flex items-center gap-1">
                                  <span className={cn("font-black text-2xl text-glow", payload.isForecast ? "text-accent" : "text-primary")}>
                                      {Number(value).toFixed(1)}
                                  </span>
                                  <span className="text-[10px] font-bold opacity-40">PTS</span>
                              </div>
                          </div>
                        </div>
                      );
                    }}
                    indicator="dot"
                  />
                }
              />
              
              <Area
                type="monotone"
                dataKey="points"
                stroke="hsl(var(--primary))"
                strokeWidth={6}
                fill="url(#colorPoints)"
                connectNulls={true}
                animationDuration={3000}
                activeDot={{ 
                    r: 10, 
                    strokeWidth: 4, 
                    stroke: 'hsl(var(--background))', 
                    fill: 'hsl(var(--primary))', 
                    className: "shadow-[0_0_30px_rgba(255,255,255,0.6)]" 
                }}
              />

              <Line
                type="monotone"
                dataKey="points"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                strokeDasharray="12 8"
                dot={false}
                activeDot={false}
                opacity={0.5}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="h-[350px] w-full flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] bg-muted/5 gap-6">
            <p className="text-sm font-black uppercase tracking-[0.4em] text-muted-foreground/30">Визуализация профессионального роста...</p>
          </div>
        )}
    </div>
  );

  if (!isStandalone) return chartContent;

  return (
    <Card className="glassmorphism border-2 border-primary/10 shadow-2xl overflow-hidden">
      <CardContent className="p-0">
        {chartContent}
      </CardContent>
    </Card>
  );
}
