'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Loader2, Wand2, Sparkles, RotateCcw, Palette, Leaf, Gem, Flame, Zap } from 'lucide-react';
import { generatePlayerCardStyling, updateThemeAction, type GeneratePlayerCardStylingOutput } from '@/app/admin/style-studio/actions';
import type { Player } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const predefinedThemes = {
  oceanic: {
    name: 'Глубокий Океан',
    icon: Palette,
    theme: {
      background: '220 20% 10%',
      foreground: '220 15% 95%',
      primary: '200 100% 50%',
      accent: '180 80% 45%',
      gold: '45 93% 48%',
      silver: '220 13% 75%',
      bronze: '28 65% 55%',
    },
  },
  forest: {
    name: 'Изумрудный Лес',
    icon: Leaf,
    theme: {
      background: '120 15% 8%',
      foreground: '120 10% 95%',
      primary: '140 70% 45%',
      accent: '90 60% 55%',
      gold: '45 93% 48%',
      silver: '220 13% 75%',
      bronze: '28 65% 55%',
    },
  },
  royal: {
    name: 'Королевский Аметист',
    icon: Gem,
    theme: {
      background: '260 20% 9%',
      foreground: '0 0% 98%',
      primary: '270 80% 65%',
      accent: '300 70% 60%',
      gold: '45 93% 48%',
      silver: '220 13% 75%',
      bronze: '28 65% 55%',
    },
  },
  fiery: {
    name: 'Вулканический Огонь',
    icon: Flame,
    theme: {
      background: '20 10% 10%',
      foreground: '20 5% 95%',
      primary: '15 80% 50%',
      accent: '35 90% 55%',
      gold: '45 93% 48%',
      silver: '220 13% 75%',
      bronze: '28 65% 55%',
    },
  },
  noir: {
    name: 'Неоновый Нуар',
    icon: Zap,
    theme: {
      background: '240 5% 5%',
      foreground: '0 0% 98%',
      primary: '180 100% 50%',
      accent: '90 100% 50%',
      gold: '45 93% 48%',
      silver: '220 13% 75%',
      bronze: '28 65% 55%',
    },
  },
};

export function StyleStudioClient({ players }: { players: Player[] }) {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
    const [generation, setGeneration] = useState<GeneratePlayerCardStylingOutput | null>(null);
    const [isGenerating, startGenerationTransition] = useTransition();
    const [isApplying, startApplyingTransition] = useTransition();
    const [isProcessing, setIsProcessing] = useState(false);

    const { toast } = useToast();

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);

    const handleGenerateStyle = async () => {
        if (isProcessing || isGenerating) return;
        
        setIsProcessing(true);
        const input = selectedPlayer
            ? {
                playerName: selectedPlayer.name,
                playerRanking: selectedPlayer.rank,
                playerStats: `Wins: ${selectedPlayer.wins}, Points: ${selectedPlayer.points}`,
            }
            : {};

        startGenerationTransition(async () => {
            setGeneration(null);
            try {
                const result = await generatePlayerCardStyling(input);
                setGeneration(result);
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : 'Не удалось сгенерировать тему.';
                toast({ title: 'Ошибка генерации', description: msg, variant: 'destructive' });
            } finally {
                setIsProcessing(false);
            }
        });
    };

    const handleThemeUpdate = async (theme: GeneratePlayerCardStylingOutput['theme'] | null) => {
        if (isProcessing || isApplying) return;
        
        setIsProcessing(true);
        startApplyingTransition(async () => {
            try {
                const result = await updateThemeAction(theme);
                toast({
                    title: result.success ? 'Успешно' : 'Ошибка',
                    description: result.message,
                    variant: result.success ? 'default' : 'destructive',
                });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Ошибка при сохранении темы';
                toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
            } finally {
                setIsProcessing(false);
            }
        });
    }

    return (
        <div className="grid gap-8 max-w-2xl mx-auto">
            <Card className="glassmorphism">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Wand2 className="text-primary"/>
                        Студия стилей
                    </CardTitle>
                    <CardDescription>
                        Здесь вы можете изменить визуальный стиль всего приложения, используя готовые темы или генерируя уникальные с помощью ИИ.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card className="glassmorphism">
                 <CardHeader>
                    <CardTitle>Предустановленные темы</CardTitle>
                    <CardDescription>Выберите одну из готовых цветовых схем.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button onClick={() => handleThemeUpdate(predefinedThemes.oceanic.theme)} disabled={isApplying || isProcessing}>
                        {isApplying ? <Loader2 className="animate-spin" /> : <predefinedThemes.oceanic.icon />} {predefinedThemes.oceanic.name}
                    </Button>
                    <Button onClick={() => handleThemeUpdate(predefinedThemes.forest.theme)} disabled={isApplying || isProcessing}>
                        {isApplying ? <Loader2 className="animate-spin" /> : <predefinedThemes.forest.icon />} {predefinedThemes.forest.name}
                    </Button>
                    <Button onClick={() => handleThemeUpdate(predefinedThemes.royal.theme)} disabled={isApplying || isProcessing}>
                        {isApplying ? <Loader2 className="animate-spin" /> : <predefinedThemes.royal.icon />} {predefinedThemes.royal.name}
                    </Button>
                    <Button onClick={() => handleThemeUpdate(predefinedThemes.fiery.theme)} disabled={isApplying || isProcessing}>
                        {isApplying ? <Loader2 className="animate-spin" /> : <predefinedThemes.fiery.icon />} {predefinedThemes.fiery.name}
                    </Button>
                    <Button onClick={() => handleThemeUpdate(predefinedThemes.noir.theme)} disabled={isApplying || isProcessing}>
                        {isApplying ? <Loader2 className="animate-spin" /> : <predefinedThemes.noir.icon />} {predefinedThemes.noir.name}
                    </Button>
                    <Button variant="outline" onClick={() => handleThemeUpdate(null)} disabled={isApplying || isProcessing}>
                        {isApplying ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                        Сбросить по умолчанию
                    </Button>
                </CardContent>
            </Card>

            <Card className="glassmorphism">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="text-accent"/>
                        Генератор тем ИИ
                    </CardTitle>
                    <CardDescription>
                        Выберите игрока для создания персональной темы или сгенерируйте общую тему.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Select 
                            onValueChange={(value) => setSelectedPlayerId(value === 'general' ? '' : value)} 
                            value={selectedPlayerId || 'general'}
                            disabled={isGenerating || isProcessing}
                        >
                            <SelectTrigger className="flex-grow">
                                <SelectValue placeholder="Выберите опцию..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">Общая тема для приложения</SelectItem>
                                {players.sort((a,b) => a.rank - b.rank).map((player) => (
                                <SelectItem key={player.id} value={player.id}>
                                    #{player.rank} - {player.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleGenerateStyle} disabled={isGenerating || isProcessing} className="w-48">
                            {isGenerating || isProcessing ? <Loader2 className="animate-spin" /> : <Wand2 />}
                            {isGenerating || isProcessing ? 'Генерация...' : 'Создать'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {generation && (
                <Card className="glassmorphism animate-in fade-in">
                    <CardHeader>
                        <CardTitle>Сгенерированная тема {selectedPlayer ? `для ${selectedPlayer.name}`: ' (общая)'}</CardTitle>
                        <CardDescription>
                            {generation.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Предпросмотр цветов</h3>
                            <div className="flex gap-4 flex-wrap">
                                {Object.entries(generation.theme).map(([key, value]) => (
                                    <div key={key} className="flex-1 min-w-[80px]">
                                        <div 
                                            className="h-16 w-full rounded-lg border" 
                                            style={{ backgroundColor: `hsl(${value})` }}
                                        />
                                        <p className="text-center mt-2 text-xs capitalize">{key}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button className="w-full" onClick={() => handleThemeUpdate(generation.theme)} disabled={isApplying || isProcessing}>
                                {(isApplying || isProcessing) && <Loader2 className="animate-spin" />}
                                Применить сгенерированную тему
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
