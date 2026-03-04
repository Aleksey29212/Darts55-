'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';
import type { Player } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';

const chartConfig = {
  value: {
    label: 'Значение',
    color: 'hsl(var(--primary))',
  },
};

const calculateAggregateStats = (player: Player) => {
    const winRate = player.matchesPlayed > 0 ? (player.wins / player.matchesPlayed) * 100 : 0;
    
    // Power: Набор (AVG + бонусы за 180)
    const power = Math.min(100, (Number(player.avg) || 0) + (Number(player.n180s) || 0) * 2);
    
    // Finishing: Чекаут (Hi-out / 1.7)
    const finishing = Math.min(100, (Number(player.hiOut) || 0) / 1.7);
    
    // Experience: Опыт (20 турниров = 100%)
    const experience = Math.min(100, (Number(player.matchesPlayed) || 0) * 5);
    
    // Success: Стабильность выхода в ТОП-8
    const top8Factor = Math.min(100, winRate);
    
    // Leg: Качество лучшего лега (100 * 36 / (x - 9 + 36))
    const legQuality = player.bestLeg > 0 ? (100 * 36) / (player.bestLeg - 9 + 36) : 0;

    return [
        { subject: 'СКОРОСТЬ', value: power, fullMark: 100 },
        { subject: 'ОПЫТ', value: experience, fullMark: 100 },
        { subject: 'ПОБЕДЫ', value: top8Factor, fullMark: 100 },
        { subject: 'ФИНИШ', value: finishing, fullMark: 100 },
        { subject: 'ТОЧНОСТЬ', value: legQuality, fullMark: 100 },
    ];
};

const calculateSingleTournamentStats = (player: Player) => {
    const avg = Math.min(100, Number(player.avg));
    const powerScoring = Math.min(100, (Number(player.n180s) || 0) * 25);
    const finishing = Math.min(100, (Number(player.hiOut) || 0) / 1.7);
    const legQuality = player.bestLeg > 0 ? (100 * 36) / (player.bestLeg - 9 + 36) : 0;

    return [
        { subject: 'AVG SET', value: avg, fullMark: 100 },
        { subject: '180 MAX', value: powerScoring, fullMark: 100 },
        { subject: 'BEST LEG', value: legQuality, fullMark: 100 },
        { subject: 'HI-OUT', value: finishing, fullMark: 100 },
    ];
}


export function PlayerRadarChart({ player, viewMode }: { player: Player, viewMode: 'aggregate' | 'single' }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const radarData = useMemo(() => {
    if (viewMode === 'single') {
        return calculateSingleTournamentStats(player);
    }
    return calculateAggregateStats(player);
  }, [player, viewMode]);

  if (!mounted) {
    return <div className="mx-auto aspect-square h-[300px] w-full flex items-center justify-center text-muted-foreground italic text-xs">Загрузка радара силы...</div>;
  }

  return (
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-[300px] md:h-[400px] w-full"
      >
        <RadarChart
          data={radarData}
          outerRadius="75%"
        >
          <ChartTooltip
            cursor={false}
            content={
                <ChartTooltipContent 
                    indicator="dot" 
                    className="glassmorphism border-primary/20 font-bold"
                />
            }
          />
          <PolarGrid gridType="polygon" className="stroke-white/10" strokeWidth={1} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ 
                fill: 'hsl(var(--muted-foreground))', 
                fontSize: 10, 
                fontWeight: 900,
                letterSpacing: '0.1em'
            }} 
          />
          <Radar
            name="Сила PRO"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            strokeWidth={4}
            fillOpacity={0.4}
            dot={{ 
                r: 5, 
                fill: 'hsl(var(--primary))', 
                stroke: 'hsl(var(--background))', 
                strokeWidth: 2,
                className: "drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            }}
          />
        </RadarChart>
      </ChartContainer>
  );
}
