'use client';

import { Target, Globe, Zap, ExternalLink, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';

// Профессиональный справочник чекаутов (пути закрытия)
const CHECKOUT_GUIDE: Record<number, { label?: string; path: string }> = {
  170: { label: '"THE BIG FISH"', path: 'T20 T20 BULL' },
  167: { label: 'MASTERCLASS', path: 'T20 T19 BULL' },
  164: { label: 'SURGICAL', path: 'T20 T18 BULL' },
  161: { label: 'PRECISION', path: 'T20 T17 BULL' },
  160: { label: 'CLASSIC', path: 'T20 T20 D20' },
  158: { path: 'T20 T20 D19' },
  157: { path: 'T20 T19 D20' },
  156: { path: 'T20 T20 D18' },
  155: { path: 'T20 T19 D19' },
  154: { path: 'T20 T18 D20' },
  153: { path: 'T20 T19 D18' },
  152: { path: 'T20 T20 D16' },
  151: { path: 'T20 T17 D20' },
  150: { path: 'T20 T20 D15' },
  149: { path: 'T20 T19 D16' },
  148: { path: 'T20 T16 D20' },
  147: { path: 'T20 T17 D18' },
  146: { path: 'T20 T18 D16' },
  145: { path: 'T20 T15 D20' },
  144: { path: 'T20 T20 D12' },
  143: { path: 'T20 T17 D16' },
  142: { path: 'T20 T14 D20' },
  141: { label: 'MAX OUT', path: 'T20 T19 D12' },
  140: { path: 'T20 T20 D10' },
  138: { path: 'T20 T18 D12' },
  135: { path: 'T20 T15 D15' },
  132: { path: 'T20 T16 D12' },
  130: { label: 'THE BIG HUNDRED', path: 'T20 T20 D5' },
  121: { label: 'BULL FINISH', path: 'T20 T11 D15' },
  120: { label: 'SHANGHAI', path: 'T20 20 D20' },
  110: { path: 'T20 10 D20' },
  107: { path: 'T19 10 D20' },
  104: { path: 'T18 10 D20' },
  101: { path: 'T17 10 D20' },
  100: { label: 'CENTURY', path: 'T20 D20' },
  90: { path: 'T20 D15' },
  80: { label: 'TOPS TOPS', path: 'T20 D10' },
  70: { path: 'T10 D20' },
  60: { path: '20 D20' },
  50: { label: 'BULLSEYE', path: '18 D16' },
  40: { label: 'TOPS', path: 'D20' },
};

const BOGEY_NUMBERS = [169, 168, 166, 165, 163, 162, 159];

export function DartsMarquee() {
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
        setLastUpdate(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const marqueeItems = useMemo(() => {
    const items = [];
    // Собираем чекауты
    for (let i = 170; i >= 40; i--) {
      if (BOGEY_NUMBERS.includes(i)) continue;
      const data = CHECKOUT_GUIDE[i];
      if (data) {
        items.push({ 
          type: 'checkout',
          val: i,
          label: data.label,
          path: data.path,
          text: `${i} OUT`
        });
      }
    }
    return items;
  }, []);

  const pdcNews = [
    { text: 'PDC NEWS: World Championship 2025 Tickets on Sale', url: 'https://www.pdc.tv/news' },
    { text: 'PDC EVENT: Premier League Finals — London O2 Arena', url: 'https://www.pdc.tv/news' },
  ];

  return (
    <div className="w-full bg-black/95 border-y border-white/10 backdrop-blur-3xl overflow-hidden py-2 group h-9 flex items-center">
      <div 
        className="flex whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]"
        style={{ '--duration': '220s' } as React.CSSProperties}
      >
        {[...Array(2)].map((_, groupIndex) => (
          <div key={groupIndex} className="flex items-center">
            {marqueeItems.map((item, i) => (
              <div key={`checkout-${i}`} className="flex items-center gap-3 px-8 border-r border-white/10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <Target className={cn(
                            "h-3 w-3",
                            item.label ? "text-primary shadow-[0_0_8px_hsl(var(--primary))]" : "text-white/20"
                        )} />
                        <span className={cn(
                            "text-[10px] font-black tracking-widest uppercase leading-none",
                            item.label ? "text-white" : "text-white/40"
                        )}>
                        {item.text} {item.label && <span className="text-[8px] text-primary/60 ml-1">— {item.label}</span>}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-bold text-accent tracking-[0.1em] opacity-90">
                            [{item.path}]
                        </span>
                    </div>
                </div>
              </div>
            ))}
            
            {pdcNews.map((news, i) => (
              <div key={`news-${i}`} className="flex items-center gap-4 px-8 border-r border-white/10 bg-primary/5">
                <Globe className="h-3 w-3 text-emerald-500" />
                <a 
                  href={news.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] font-bold text-white/50 hover:text-white transition-colors tracking-widest uppercase flex items-center gap-2"
                >
                  {news.text}
                </a>
                <span className="text-[8px] font-mono opacity-20">{lastUpdate}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
