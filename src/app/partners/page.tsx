import { getPartners } from '@/lib/partners';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Handshake, Store, ShoppingBag, MessageCircle, Star, BadgeCheck, ArrowRight, Send, Gamepad2, Globe } from 'lucide-react';
import Image from 'next/image';
import { getSponsorshipSettings } from '@/lib/settings';
import { Badge } from '@/components/ui/badge';
import type { PartnerCategory } from '@/lib/types';

const categoryConfig: Record<PartnerCategory, { label: string; icon: any; color: string; btnText: string }> = {
    shop: { 
        label: 'Магазин', 
        icon: Store, 
        color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        btnText: 'Перейти в магазин'
    },
    platform: { 
        label: 'Игровая платформа', 
        icon: Gamepad2, 
        color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        btnText: 'На платформу'
    },
    media: { 
        label: 'Инфо-партнер', 
        icon: Globe, 
        color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        btnText: 'Перейти к новостям'
    },
    other: { 
        label: 'Партнер', 
        icon: Star, 
        color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        btnText: 'Подробнее'
    },
};

export default async function PartnersPage() {
    const partners = await getPartners();
    const settings = await getSponsorshipSettings();

    return (
        <main className="container py-12 space-y-16">
            {/* Hero Section */}
            <section className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <Handshake className="h-4 w-4" />
                    Наше сообщество растет
                </div>
                <h1 className="text-4xl md:text-6xl font-headline text-primary text-glow drop-shadow-2xl">Наши партнеры</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Компании и бренды, которые разделяют нашу страсть к дартсу и поддерживают профессиональное развитие игроков.
                </p>
            </section>

            {/* Current Partners Grid */}
            {partners.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {partners.map(partner => {
                        const config = categoryConfig[partner.category] || categoryConfig.other;
                        const CategoryIcon = config.icon;
                        
                        return (
                            <Card key={partner.id} className="glassmorphism overflow-hidden group hover:border-primary transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 border-2 led-glow">
                                <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                                    <div className="w-full flex justify-between items-start">
                                        <Badge className={`${config.color} border font-medium`}>
                                            <CategoryIcon className="w-3 h-3 mr-1" />
                                            {config.label}
                                        </Badge>
                                    </div>
                                    
                                    {/* Themed Designer Logo Pedestal */}
                                    <div className="relative h-40 w-full bg-secondary/20 backdrop-blur-md rounded-2xl p-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] border-2 border-primary/10 flex items-center justify-center overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                                        <div className="relative w-full h-full">
                                            <Image 
                                                src={partner.logoUrl} 
                                                alt={partner.name} 
                                                fill 
                                                className="object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-lg"
                                                unoptimized={partner.logoUrl.startsWith('data:image')}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-bold tracking-tight">{partner.name}</h3>
                                        {partner.promoCode && (
                                            <div className="inline-block bg-primary/10 text-primary py-1.5 px-4 rounded-lg font-mono text-sm border border-primary/20 shadow-sm">
                                                Промокод: <span className="font-bold">{partner.promoCode}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {partner.linkUrl && (
                                        <Button asChild className="w-full group-hover:scale-105 transition-transform shadow-lg shadow-primary/20 py-6">
                                            <a href={partner.linkUrl} target="_blank" rel="noopener noreferrer">
                                                <CategoryIcon className="mr-2 h-5 w-5" />
                                                {config.btnText}
                                            </a>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-card/30 rounded-3xl border-2 border-dashed border-border/50">
                    <p className="text-muted-foreground text-lg italic">Здесь скоро появятся наши первые партнеры...</p>
                </div>
            )}

            <hr className="border-border/50 max-w-4xl mx-auto" />

            {/* Recruitment Section for Potential Sponsors */}
            <section className="space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl md:text-4xl font-headline">Стать партнером DartBrig Pro</h2>
                    <p className="text-muted-foreground text-lg">Ваш бизнес увидит всё дартс-сообщество региона.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Banner 1: Shop placement */}
                    <Card className="glassmorphism border-accent/50 bg-gradient-to-br from-accent/10 to-background/50 overflow-hidden relative border-2 led-glow">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShoppingBag className="h-32 w-32 -mr-8 -mt-8" />
                        </div>
                        <CardHeader className="relative z-10">
                            <div className="bg-accent/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-accent/20">
                                <ShoppingBag className="text-accent h-7 w-7" />
                            </div>
                            <CardTitle className="text-2xl">Ваш магазин в системе</CardTitle>
                            <CardDescription className="text-base">
                                Получите прямой доступ к лояльной и активной аудитории.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 relative z-10">
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-3 text-sm">
                                    <BadgeCheck className="h-5 w-5 text-accent shrink-0" />
                                    <span>Прямые ссылки на ваш товар в карточках топовых игроков</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <BadgeCheck className="h-5 w-5 text-accent shrink-0" />
                                    <span>Автоматическая ротация вашего логотипа на всех страницах</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <BadgeCheck className="h-5 w-5 text-accent shrink-0" />
                                    <span>Эксклюзивные промокоды для отслеживания конверсии</span>
                                </li>
                            </ul>
                            <div className="grid gap-3">
                                <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground font-semibold py-6 group" asChild>
                                    <a href={settings.adminTelegramLink} target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="mr-2 h-5 w-5" />
                                        Написать администратору
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                </Button>
                                <Button variant="ghost" className="w-full text-accent hover:bg-accent/10" asChild>
                                    <a href={settings.adminVkLink} target="_blank" rel="noopener noreferrer">
                                        Написать администратору в ВК
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Banner 2: Tournament Sponsor */}
                    <Card className="glassmorphism border-primary/50 bg-gradient-to-br from-primary/10 to-background/50 overflow-hidden relative border-2 led-glow">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Star className="h-32 w-32 -mr-8 -mt-8" />
                        </div>
                        <CardHeader className="relative z-10">
                            <div className="bg-primary/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                                <Star className="text-primary h-7 w-7" />
                            </div>
                            <CardTitle className="text-2xl">Спонсорство лиги</CardTitle>
                            <CardDescription className="text-base">
                                Постройте глубокую эмоциональную связь с брендом.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 relative z-10">
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-3 text-sm">
                                    <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                                    <span>Интеграция бренда в название лиг (например, "ВашБренд Premier League")</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                                    <span>Брендирование трансляций и социальных сетей проекта</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                                    <span>Участие в церемониях награждения и специальных ивентах</span>
                                </li>
                            </ul>
                            <div className="grid gap-3">
                                <Button className="w-full font-semibold py-6 shadow-lg shadow-primary/30 group" asChild>
                                    <a href={settings.groupTelegramLink} target="_blank" rel="noopener noreferrer">
                                        <Send className="mr-2 h-5 w-5" />
                                        Написать администратору группы
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                </Button>
                                <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/5" asChild>
                                    <a href={settings.groupVkLink} target="_blank" rel="noopener noreferrer">
                                        Написать администратору группы ВК
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </main>
    );
}