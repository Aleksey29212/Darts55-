'use client';

import Image from 'next/image';
import { Button } from './ui/button';
import { Copy, Check, ExternalLink, Handshake, PlusCircle, ShoppingBag, Gamepad2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import type { Partner, Tournament, PartnerCategory } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const categoryConfig: Record<PartnerCategory, { label: string; btnText: string; icon: any }> = {
    shop: { label: 'Магазин', btnText: 'В магазин', icon: ShoppingBag },
    platform: { label: 'Платформа', btnText: 'На платформу', icon: Gamepad2 },
    media: { label: 'Медиа', btnText: 'Перейти', icon: Globe },
    other: { label: 'Партнер', btnText: 'Подробнее', icon: ExternalLink },
};

function PromoCode({ code }: { code: string }) {
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);

    const copyToClipboard = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        navigator.clipboard.writeText(code);
        setHasCopied(true);
        toast({
            title: 'Скопировано!',
            description: `Промокод "${code}" скопирован в буфер обмена.`,
        });
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="mt-1 flex items-center justify-center gap-1">
            <Button size="sm" variant="ghost" className="h-auto px-1 py-0.5 text-[9px] text-primary font-mono" onClick={copyToClipboard}>
                {code}
                {hasCopied ? <Check className="ml-1 h-2 w-2 text-success" /> : <Copy className="ml-1 h-2 w-2" />}
            </Button>
        </div>
    );
}

function PartnerCard({ partner, variant, isFocused }: { partner: Partner; variant: 'default' | 'compact', isFocused?: boolean }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const flipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isCompact = variant === 'compact';
    
    const containerClasses = isCompact ? 'h-16 w-32 md:h-20 md:w-40' : 'h-44 w-44';
    const padding = isCompact ? 'p-2' : 'p-5';
    
    const config = categoryConfig[partner.category] || categoryConfig.other;
    const CategoryIcon = config.icon;

    const handleCardClick = () => {
        if (flipTimeoutRef.current) {
            clearTimeout(flipTimeoutRef.current);
            flipTimeoutRef.current = null;
        }

        const nextFlipState = !isFlipped;
        setIsFlipped(nextFlipState);

        if (nextFlipState) {
            flipTimeoutRef.current = setTimeout(() => {
                setIsFlipped(false);
                flipTimeoutRef.current = null;
            }, 5000);
        }
    };
    
    useEffect(() => {
        return () => {
            if (flipTimeoutRef.current) {
                clearTimeout(flipTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div 
            className={cn(
                "group [perspective:1000px] cursor-pointer transition-all duration-700",
                isFocused ? "scale-110 z-10" : "scale-100" // Highlighted item is bigger, others are normal size
            )}
            onClick={handleCardClick}
        >
            <div className={cn(
                "relative rounded-xl transition-all duration-500 [transform-style:preserve-3d] shadow-md border-2", 
                containerClasses, 
                // Focused card gets a prominent shadow and border
                isFlipped ? "[transform:rotateY(180deg)]" : (isFocused ? "border-primary/50 shadow-primary/20 bg-primary/10 shadow-2xl" : "border-white/5 bg-white/5")
            )}>
                {/* Front - Logo Side */}
                <div className={cn(
                    "absolute inset-0 backdrop-blur-md rounded-xl flex items-center justify-center [backface-visibility:hidden] shadow-inner transition-colors", 
                    padding,
                )}>
                    <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                            src={partner.logoUrl}
                            alt={partner.name}
                            fill
                            className="object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-lg"
                            unoptimized={partner.logoUrl.startsWith('data:image')}
                        />
                    </div>
                </div>
                {/* Back - Info Side */}
                <div className="absolute inset-0 p-2 bg-card/95 backdrop-blur-xl border border-primary/50 rounded-xl flex flex-col items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden] text-center shadow-2xl overflow-hidden">
                    <p className={cn(
                        "font-bold text-primary truncate w-full",
                        isCompact ? 'text-[9px]' : 'text-base'
                    )}>{partner.name}</p>
                    {partner.promoCode && <PromoCode code={partner.promoCode} />}
                    
                    {!isCompact && partner.linkUrl && (
                        <Button 
                            asChild 
                            variant="default" 
                            className="w-full h-8 mt-2 text-[10px] uppercase font-bold tracking-tighter"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                           <a href={partner.linkUrl} target="_blank" rel="noopener noreferrer">
                             <CategoryIcon className="mr-1.5 h-3 w-3" />
                             {config.btnText}
                           </a>
                        </Button>
                    )}
                    {isCompact && partner.linkUrl && (
                        <a 
                            href={partner.linkUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 z-10"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function RecruitmentCard({ variant }: { variant: 'default' | 'compact' }) {
    const isCompact = variant === 'compact';
    const containerClasses = isCompact ? 'h-16 w-32 md:h-20 md:w-40' : 'h-44 w-44';

    return (
        <Link href="/partners" className="group block">
            <div className={cn(
                "relative rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 transition-all duration-300 flex flex-col items-center justify-center text-center p-2 group-hover:border-primary/40",
                containerClasses
            )}>
                <PlusCircle className="text-primary/60 h-4 w-4 md:h-6 md:w-6 mb-1 group-hover:text-primary transition-colors" />
                <p className={cn(
                    "font-bold text-primary/60 uppercase tracking-tight group-hover:text-primary transition-colors",
                    isCompact ? 'text-[8px] leading-none' : 'text-xs'
                )}>СТАТЬ ПАРТНЕРОМ</p>
            </div>
        </Link>
    );
}


export function PartnersDisplay({ partners, tournaments, variant = 'default' }: { partners: Partner[], tournaments: (Tournament | undefined)[], variant?: 'default' | 'compact' }) {
    const [isClient, setIsClient] = useState(false);
    const [api, setApi] = useState<CarouselApi>();
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!api) return;
        const onSelect = () => {
            setActiveIndex(api.selectedScrollSnap());
        };
        api.on("select", onSelect);
        return () => {
            api.off("select", onSelect);
        };
    }, [api]);
    
    const showComponent = partners && partners.length > 0 && tournaments && tournaments.length > 0;

    if (!showComponent) {
        return null;
    }
    
    const isCompact = variant === 'compact';
    const containerClasses = isCompact ? "w-full py-4 px-4" : "container py-12";
    const skeletonClasses = isCompact ? "h-16 w-32 rounded-xl" : "h-44 w-44 rounded-xl";

    if (!isClient) {
        return (
            <div className={containerClasses}>
                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <CarouselItem key={index} className="basis-auto">
                                <Skeleton className={skeletonClasses} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        )
    }

    return (
        <div className={containerClasses}>
            {!isCompact && (
                <div className="flex items-center gap-2 mb-10">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent hidden sm:block" />
                    <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-secondary/50 border border-border shadow-lg">
                        <Handshake className="h-5 w-5 text-primary" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Наши партнеры</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent hidden sm:block" />
                </div>
            )}
            <Carousel
                setApi={setApi}
                opts={{
                    align: "center",
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 5000,
                        stopOnInteraction: false,
                        stopOnMouseEnter: true,
                    }),
                ]}
                className="w-full"
            >
                <CarouselContent className={cn(isCompact ? "-ml-4" : "-ml-8")}>
                    {partners.map((partner, index) => (
                         <CarouselItem key={partner.id} className={cn("basis-auto flex items-center justify-center", isCompact ? "pl-4" : "pl-8")}>
                            <PartnerCard partner={partner} variant={variant} isFocused={activeIndex === index} />
                         </CarouselItem>
                    ))}
                    <CarouselItem className={cn("basis-auto flex items-center justify-center", isCompact ? "pl-4" : "pl-8")}>
                        <RecruitmentCard variant={variant} />
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
        </div>
    );
}
