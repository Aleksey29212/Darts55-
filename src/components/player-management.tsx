
'use client';

import { useState, useTransition, useCallback } from 'react';
import type { PlayerProfile, SponsorInfo } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, Trash2, PlusCircle, Loader2, Handshake, Sparkles, RefreshCw, Palette, Image as ImageIcon, Check, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updatePlayer, deletePlayerAction } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Switch } from './ui/switch';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PlayerManagementProps {
  players: PlayerProfile[];
}

const dartsBackgrounds = [
    { id: '1', url: 'https://images.unsplash.com/photo-1544098485-2a216e2133c1', name: 'Классическая мишень' },
    { id: '2', url: 'https://images.unsplash.com/photo-1611003228941-98a52e6dc4b5', name: 'Бросок в движении' },
    { id: '3', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5', name: 'Точный центр' },
    { id: '4', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a', name: 'Глубина доски' },
    { id: '5', url: 'https://images.unsplash.com/photo-1629901976594-82408f40153d', name: 'Темный абстракт' },
    { id: '6', url: 'https://images.unsplash.com/photo-1559131397-f94da358f7ca', name: 'Неоновый дартс' },
    { id: '7', url: 'https://images.unsplash.com/photo-1614032684758-598ce4536df1', name: 'Оперения' },
    { id: '8', url: 'https://images.unsplash.com/photo-1504450758481-7338ef752242', name: 'Про-Арена' },
    { id: '9', url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b', name: 'Атмосфера паба' },
    { id: '10', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018', name: 'Четкие сектора' },
    { id: '11', url: 'https://images.unsplash.com/photo-1553481187-be93c21490a9', name: 'Красный дротик' },
    { id: '12', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773', name: 'Стальное острие' },
    { id: '13', url: 'https://images.unsplash.com/photo-1541270941804-004aa8099093', name: 'Размытый фокус' },
    { id: '14', url: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e', name: 'Спортивный азарт' },
    { id: '15', url: 'https://images.unsplash.com/photo-1511886929837-354d827aae26', name: 'Фокусировка' },
    { id: '16', url: 'https://images.unsplash.com/photo-1557683316-973673baf926', name: 'Градиент игры' },
    { id: '17', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853', name: 'Энергия броска' },
];

const PRO_NICKNAMES = ["Снайпер", "Молния", "Танк", "Ястреб", "Вихрь", "Стрела", "Профи", "Легенда", "Ace", "Titan", "Voltage", "Sniper"];

const randomSlogans = [
    "Поддержите талант!",
    "Станьте частью команды",
    "Ваш бренд — наш успех",
    "Вместе к вершине!",
    "Инвестируйте в успех",
    "Поддержите стремление к победе",
    "Станьте спонсором мастерства",
    "Развиваем дартс вместе"
];

function PlayerFormDialog({ 
    player, 
    mode = 'edit', 
    trigger 
}: { 
    player?: PlayerProfile, 
    mode?: 'edit' | 'create',
    trigger?: React.ReactNode
}) {
  const [isPending, startTransition] = useTransition();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const initialData: PlayerProfile = player || {
      id: '',
      name: '',
      nickname: PRO_NICKNAMES[Math.floor(Math.random() * PRO_NICKNAMES.length)],
      avatarUrl: 'https://picsum.photos/seed/newplayer/400/400',
      bio: '',
      imageHint: 'person portrait',
      backgroundUrl: 'https://images.unsplash.com/photo-1544098485-2a216e2133c1',
      backgroundImageHint: 'abstract background',
      sponsors: [],
      showSponsorCta: true,
      sponsorCtaText: ''
  };
  const [formData, setFormData] = useState<PlayerProfile>(initialData);

  const handleSave = () => {
    if (isProcessing || isPending) return;
    if (!formData.name) {
        toast({ title: 'Ошибка', description: 'Имя обязательно.', variant: 'destructive' });
        return;
    }
    
    setIsProcessing(true);
    startTransition(async () => {
        try {
            const result = await updatePlayer(formData);
            toast({
                title: result.success ? 'Успешно' : 'Ошибка',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Ошибка при сохранении';
            toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    });
  };

  const handleSponsorFieldChange = (index: number, field: keyof SponsorInfo, value: string) => {
      const newSponsors = [...(formData.sponsors || [])];
      if (!newSponsors[index]) {
          newSponsors[index] = { name: '', logoUrl: '', link: '' };
      }
      newSponsors[index] = { ...newSponsors[index], [field]: value };
      setFormData({ ...formData, sponsors: newSponsors });
  };

  const addSponsor = () => {
      const newSponsors = [...(formData.sponsors || [])];
      if (newSponsors.length < 3) {
          newSponsors.push({ name: '', logoUrl: '', link: '' });
          setFormData({ ...formData, sponsors: newSponsors });
      }
  };

  const removeSponsor = (index: number) => {
      const newSponsors = [...(formData.sponsors || [])];
      newSponsors.splice(index, 1);
      setFormData({ ...formData, sponsors: newSponsors });
  };

  const generateRandomSlogan = () => {
      const slogan = randomSlogans[Math.floor(Math.random() * randomSlogans.length)];
      setFormData({ ...formData, sponsorCtaText: slogan });
  };

  const generateRandomNickname = () => {
      const nick = PRO_NICKNAMES[Math.floor(Math.random() * PRO_NICKNAMES.length)];
      setFormData({ ...formData, nickname: nick });
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || <Button variant="ghost" size="icon" disabled={isProcessing || isPending}><Edit className="h-4 w-4" /></Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] glassmorphism max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Редактировать игрока' : 'Добавить игрока'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="id" className="text-right">ID</Label>
            <Input 
                id="id" 
                value={formData.id} 
                onChange={e => setFormData({...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})} 
                className="col-span-3" 
                disabled={mode === 'edit' || isProcessing || isPending} 
                placeholder="ivan-ivanov"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Имя</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" placeholder="Иван Иванов" disabled={isProcessing || isPending} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nickname" className="text-right">Никнейм</Label>
            <div className="col-span-3 flex gap-2">
                <Input id="nickname" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} disabled={isProcessing || isPending} />
                <Button type="button" variant="outline" size="icon" onClick={generateRandomNickname} disabled={isProcessing || isPending} title="Сгенерировать ник">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bio" className="text-right">Биография</Label>
            <Textarea id="bio" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="col-span-3" rows={3} disabled={isProcessing || isPending} />
          </div>
          
          <div className="border-t pt-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                  <ImageIcon className="h-3 w-3" />
                  Фон карточки
              </h4>
              <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="backgroundUrl" className="text-right">URL фона</Label>
                    <Input id="backgroundUrl" value={formData.backgroundUrl || ''} onChange={e => setFormData({...formData, backgroundUrl: e.target.value})} className="col-span-3" placeholder="https://..." disabled={isProcessing || isPending} />
                  </div>
                  <div className="col-span-4">
                      <ScrollArea className="h-48 border rounded-xl p-4 bg-black/20">
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                              {dartsBackgrounds.map((bg) => (
                                  <button
                                      key={bg.id}
                                      type="button"
                                      disabled={isProcessing || isPending}
                                      onClick={() => setFormData({ ...formData, backgroundUrl: bg.url })}
                                      className={cn(
                                          "group relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                                          formData.backgroundUrl === bg.url ? "border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]" : "border-transparent hover:border-primary/50"
                                      )}
                                  >
                                      <Image src={bg.url} alt={bg.name} fill className="object-cover" unoptimized />
                                      {formData.backgroundUrl === bg.url && (
                                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                              <Check className="h-3 w-3" />
                                          </div>
                                      )}
                                  </button>
                              ))}
                          </div>
                      </ScrollArea>
                  </div>
              </div>
          </div>
          
          <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Handshake className="h-3 w-3" />
                      Спонсоры (до 3-х)
                  </h4>
                  {(formData.sponsors?.length || 0) < 3 && (
                      <Button size="sm" variant="outline" onClick={addSponsor} className="h-7 text-[10px] uppercase font-black" disabled={isProcessing || isPending}>
                          <Plus className="h-3 w-3 mr-1" /> Добавить спонсора
                      </Button>
                  )}
              </div>
              
              <Tabs defaultValue="slot-0" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-black/20">
                      {[0, 1, 2].map(i => (
                          <TabsTrigger key={i} value={`slot-${i}`} className="text-[10px] uppercase font-bold py-2">
                              Слот {i + 1}
                          </TabsTrigger>
                      ))}
                  </TabsList>
                  {[0, 1, 2].map(i => {
                      const sp = (formData.sponsors || [])[i];
                      return (
                          <TabsContent key={i} value={`slot-${i}`} className="pt-4 space-y-4 min-h-[200px]">
                              {sp ? (
                                  <div className="grid gap-4 relative border p-4 rounded-xl bg-primary/5">
                                      <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="absolute top-2 right-2 text-destructive" 
                                          onClick={() => removeSponsor(i)}
                                          disabled={isProcessing || isPending}
                                      >
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                      <div className="grid grid-cols-4 items-center gap-4">
                                          <Label className="text-right text-[10px] uppercase">Название</Label>
                                          <Input value={sp.name} onChange={e => handleSponsorFieldChange(i, 'name', e.target.value)} className="col-span-3" disabled={isProcessing || isPending} />
                                      </div>
                                      <div className="grid grid-cols-4 items-center gap-4">
                                          <Label className="text-right text-[10px] uppercase">Лого URL</Label>
                                          <Input value={sp.logoUrl} onChange={e => handleSponsorFieldChange(i, 'logoUrl', e.target.value)} className="col-span-3" disabled={isProcessing || isPending} />
                                      </div>
                                      <div className="grid grid-cols-4 items-center gap-4">
                                          <Label className="text-right text-[10px] uppercase">Ссылка</Label>
                                          <Input value={sp.link} onChange={e => handleSponsorFieldChange(i, 'link', e.target.value)} className="col-span-3" disabled={isProcessing || isPending} />
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl opacity-30">
                                      <Handshake className="h-10 w-10 mb-2" />
                                      <p className="text-[10px] uppercase font-bold">Слот свободен</p>
                                  </div>
                              )}
                          </TabsContent>
                      );
                  })}
              </Tabs>
          </div>

          <div className="border-t pt-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  Реклама спонсорства
              </h4>
              <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="showSponsorCta" className="text-right">Показывать призыв</Label>
                    <div className="col-span-3 flex items-center">
                        <Switch id="showSponsorCta" checked={formData.showSponsorCta !== false} onCheckedChange={(checked) => setFormData({...formData, showSponsorCta: checked})} disabled={isProcessing || isPending} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sponsorCtaText" className="text-right">Текст призыва</Label>
                    <div className="col-span-3 flex gap-2">
                        <Input 
                            id="sponsorCtaText" 
                            value={formData.sponsorCtaText || ''} 
                            onChange={e => setFormData({...formData, sponsorCtaText: e.target.value})} 
                            placeholder="Оставьте пустым для случайного слогана"
                            disabled={isProcessing || isPending}
                        />
                        <Button type="button" variant="outline" size="icon" onClick={generateRandomSlogan} disabled={isProcessing || isPending}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
              </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={handleSave} disabled={isPending || isProcessing}>
              {isPending || isProcessing ? <Loader2 className="animate-spin" /> : <Save />}
              {mode === 'edit' ? 'Сохранить изменения' : 'Создать профиль'}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeletePlayerButton({ playerId, playerName }: { playerId: string; playerName: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleDelete = useCallback(() => {
        startTransition(async () => {
            try {
                const result = await deletePlayerAction(playerId);
                toast({
                    title: result.success ? 'Удалено' : 'Ошибка',
                    description: result.message,
                    variant: result.success ? 'default' : 'destructive',
                });
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : 'Не удалось удалить игрока';
                toast({
                    title: 'Ошибка',
                    description: msg,
                    variant: 'destructive',
                });
            }
        });
    }, [playerId, toast]);

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" disabled={isPending}>
                    {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glassmorphism">
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены, что хотите удалить "{playerName}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие необратимо. Профиль игрока и вся связанная с ним статистика будут удалены навсегда.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                        {isPending ? <Loader2 className="animate-spin" /> : 'Да, удалить'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function PlayerManagement({ players }: PlayerManagementProps) {
  return (
    <CardContent className="p-0">
      <div className="flex justify-end mb-6">
          <PlayerFormDialog 
            mode="create" 
            trigger={<Button className="gap-2"><PlusCircle className="h-4 w-4" /> Добавить игрока вручную</Button>} 
          />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Игрок</TableHead>
            <TableHead>Спонсоры</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={player.avatarUrl} alt={player.name} data-ai-hint={player.imageHint} />
                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="font-medium">{player.name}</p>
                    <Badge variant="secondary" className="font-normal w-fit mt-1">{player.nickname}</Badge>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex -space-x-2">
                    {(player.sponsors || []).map((s, i) => (
                        <div key={i} className="h-8 w-8 relative rounded-full border-2 border-background bg-white p-1 shadow-sm overflow-hidden" title={s.name}>
                            <Image src={s.logoUrl} alt={s.name} fill className="object-contain p-0.5" />
                        </div>
                    ))}
                    {!(player.sponsors?.length) && player.sponsorName && (
                        <div className="h-8 w-8 relative rounded-full border-2 border-background bg-white p-1 shadow-sm overflow-hidden" title={player.sponsorName}>
                            {player.sponsorLogoUrl ? <Image src={player.sponsorLogoUrl} alt={player.sponsorName} fill className="object-contain p-0.5" /> : <Handshake className="h-full w-full text-primary/40" />}
                        </div>
                    )}
                    {!(player.sponsors?.length) && !player.sponsorName && <span className="text-xs text-muted-foreground italic pl-2">Нет</span>}
                </div>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <PlayerFormDialog player={player} mode="edit" />
                <DeletePlayerButton playerId={player.id} playerName={player.name} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  );
}
