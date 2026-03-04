'use client';

import * as React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { PlayerRadarChart } from './player-radar-chart';
import { PlayerRatingChart } from './player-rating-chart';
import type { Player, PlayerTournamentHistory } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Activity, Target, ChevronLeft, ChevronRight } from 'lucide-react';

interface PlayerAnalyticsCarouselProps {
  player: Player;
  tournaments: PlayerTournamentHistory[];
  viewMode: 'aggregate' | 'single';
}

export function PlayerAnalyticsCarousel({ player, tournaments, viewMode }: PlayerAnalyticsCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const models = [
    { id: 'progress', name: 'Динамика прогресса', icon: Activity },
    { id: 'radar', name: 'Радар силы PRO', icon: Target },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header with selector indicator */}
      <div className="flex items-center justify-between px-2">
        <div className="flex gap-2">
          {models.map((model, index) => (
            <div
              key={model.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                current === index ? "w-8 bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : "w-2 bg-white/10"
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">
          {models[current].icon && React.createElement(models[current].icon, { className: "h-3 w-3" })}
          {models[current].name}
        </div>
      </div>

      <Carousel setApi={setApi} className="w-full group/carousel">
        <CarouselContent>
          {/* Slide 1: Progress Chart */}
          <CarouselItem>
            <div className="glassmorphism p-4 md:p-8 rounded-[3rem] border-white/5 bg-black/40 min-h-[500px] flex flex-col justify-center overflow-hidden">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-center text-primary mb-6">Line of Professional Growth</h3>
               <PlayerRatingChart tournaments={tournaments} isStandalone={false} />
            </div>
          </CarouselItem>

          {/* Slide 2: Radar Chart */}
          <CarouselItem>
            <div className="glassmorphism p-4 md:p-8 rounded-[3rem] border-white/5 bg-black/40 min-h-[500px] flex flex-col justify-center overflow-hidden">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-center text-primary mb-6">Professional Radar Strength</h3>
               <PlayerRadarChart player={player} viewMode={viewMode} />
            </div>
          </CarouselItem>
        </CarouselContent>
        
        {/* Custom Navigation */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
            <button 
                type="button"
                onClick={() => api?.scrollPrev()} 
                className="p-2 rounded-full bg-white/5 hover:bg-primary/20 hover:text-primary transition-all border border-white/10 active:scale-90"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
                type="button"
                onClick={() => api?.scrollNext()} 
                className="p-2 rounded-full bg-white/5 hover:bg-primary/20 hover:text-primary transition-all border border-white/10 active:scale-90"
            >
                <ChevronRight className="h-6 w-6" />
            </button>
        </div>
      </Carousel>
      
      {/* Visual Tip */}
      <p className="text-center text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] pt-4">
        Используйте стрелки или свайп для смены модели анализа
      </p>
    </div>
  );
}
