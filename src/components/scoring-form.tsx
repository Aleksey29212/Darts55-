'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardFooter } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Info, Globe, Moon, Banknote } from 'lucide-react';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import type { ScoringSettings, LeagueId } from '@/lib/types';
import { useTransition, useEffect, useState } from 'react';
import { saveScoringSettings } from '@/app/actions';
import { useAdmin } from '@/context/admin-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const scoringSchema = z.object({
  pointsFor1st: z.coerce.number().min(0, 'Должно быть положительным числом.'),
  pointsFor2nd: z.coerce.number().min(0, 'Должно быть положительным числом.'),
  pointsFor3rd_4th: z.coerce.number().min(0, 'Должно быть положительным числом.'),
  pointsFor5th_8th: z.coerce.number().min(0, 'Должно быть положительным числом.'),
  pointsFor9th_16th: z.coerce.number().min(0, 'Должно быть положительным числом.'),
  participationPoints: z.coerce.number().min(0, 'Должно быть положительным числом.'),

  enable180Bonus: z.boolean().default(false),
  bonusPer180: z.coerce.number().min(0, 'Должно быть положительным числом.'),

  enableHiOutBonus: z.boolean().default(false),
  hiOutThreshold: z.coerce.number().min(0, 'Должно быть положительным числом.'),
  hiOutBonus: z.coerce.number().min(0, 'Должно быть положительным числом.'),
  
  enableAvgBonus: z.boolean().default(false),
  avgThreshold: z.coerce.number().min(0, 'Должно быть положительным числом.').max(180, 'Не может быть больше 180.'),
  avgBonus: z.coerce.number().min(0, 'Должно быть положительным числом.'),

  enableShortLegBonus: z.boolean().default(false),
  shortLegThreshold: z.coerce.number().min(0, 'Должно быть положительным числом.'),
  shortLegBonus: z.coerce.number().min(0, 'Должно быть положительным числом.'),

  enable9DarterBonus: z.boolean().default(false),
  bonusFor9Darter: z.coerce.number().min(0, 'Должно быть положительным числом.'),

  includeInGeneral: z.boolean().default(true),
  pointValue: z.coerce.number().min(5, 'Минимум 5 ₽').max(20, 'Максимум 20 ₽'),
});

type ScoringFormValues = z.infer<typeof scoringSchema>;

interface ScoringFormProps {
  leagueId: LeagueId;
  defaultValues: ScoringFormValues;
}

const LabelWithTooltip = ({ label, tooltipText }: { label: string, tooltipText: string }) => (
    <div className="flex items-center gap-1.5">
        {label}
        <Tooltip>
            <TooltipTrigger asChild><Info className="h-3 w-3 cursor-help text-muted-foreground" /></TooltipTrigger>
            <TooltipContent><p className="max-w-[200px] text-[11px]">{tooltipText}</p></TooltipContent>
        </Tooltip>
    </div>
);


export function ScoringForm({ leagueId, defaultValues }: ScoringFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isProcessing, setIsProcessing] = useState(false);
  const { setIsDirty } = useAdmin();

  const isOmsk = leagueId === 'evening_omsk';

  const form = useForm<ScoringFormValues>({
    resolver: zodResolver(scoringSchema),
    defaultValues: {
        ...defaultValues,
        pointValue: defaultValues.pointValue || 5
    },
  });
  
  const { setValue, watch, formState: { isDirty: isFormDirty } } = form;

  useEffect(() => {
    setIsDirty(isFormDirty);
    return () => {
      setIsDirty(false);
    };
  }, [isFormDirty, setIsDirty]);

  async function onSubmit(data: ScoringFormValues) {
    if (isProcessing || isPending) return;

    setIsProcessing(true);
    startTransition(async () => {
        try {
            const result = await saveScoringSettings(leagueId, data);
            toast({
                title: result.success ? 'Успешно' : 'Ошибка',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                form.reset(data);
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Ошибка при сохранении настроек';
            toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <TooltipProvider>
        <div className="space-y-8">
            {isOmsk && (
                <div className="p-4 rounded-xl border-2 border-indigo-500/30 bg-indigo-500/10 flex items-start gap-4 shadow-lg animate-in slide-in-from-top-4 duration-500">
                    <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-400">
                        <Moon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-headline text-indigo-400 uppercase tracking-tight text-lg">Режим «Вечерний Омск»</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                            Баллы = <span className="text-foreground font-bold">AVG × Множитель стадии</span>. 
                            Укажите множители (например, 1.00 для победы).
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leagueId !== 'general' && (
                  <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 flex items-center justify-between shadow-inner">
                      <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                              <Globe className="h-5 w-5 text-primary" />
                              <FormLabel className="text-base font-bold uppercase tracking-tighter">Общий рейтинг</FormLabel>
                          </div>
                          <p className="text-xs text-muted-foreground">Учитывать в глобальной таблице.</p>
                      </div>
                      <FormField
                          control={form.control}
                          name="includeInGeneral"
                          render={({ field }) => (
                              <FormItem>
                                  <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending || isProcessing} />
                                  </FormControl>
                              </FormItem>
                          )}
                      />
                  </div>
                )}

                {isOmsk && (
                    <div className="p-4 rounded-xl border-2 border-accent/20 bg-accent/5 flex items-center justify-between shadow-inner">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Banknote className="h-5 w-5 text-accent" />
                                <FormLabel className="text-base font-bold uppercase tracking-tighter">Ценность балла</FormLabel>
                            </div>
                            <p className="text-xs text-muted-foreground">Стоимость 1 балла в рублях (5-20 ₽).</p>
                        </div>
                        <FormField
                            control={form.control}
                            name="pointValue"
                            render={({ field }) => (
                                <FormItem className="w-24">
                                    <FormControl>
                                        <Input type="number" min={5} max={20} step={1} {...field} className="font-bold text-center" disabled={isPending || isProcessing} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-lg mb-2 font-medium">{isOmsk ? 'Множители стадии' : 'Баллы за место'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="pointsFor1st" render={({ field }) => (
                        <FormItem>
                            <FormLabel><LabelWithTooltip label={isOmsk ? "Множитель 1-е место" : "1-е место"} tooltipText="Победа." /></FormLabel>
                            <FormControl><Input type="number" step={isOmsk ? "0.01" : "1"} {...field} disabled={isPending || isProcessing} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="pointsFor2nd" render={({ field }) => (
                        <FormItem>
                            <FormLabel><LabelWithTooltip label={isOmsk ? "Множитель 2-е место" : "2-е место"} tooltipText="Финал." /></FormLabel>
                            <FormControl><Input type="number" step={isOmsk ? "0.01" : "1"} {...field} disabled={isPending || isProcessing} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="pointsFor3rd_4th" render={({ field }) => (
                        <FormItem>
                            <FormLabel><LabelWithTooltip label={isOmsk ? "Множитель 1/2 финала" : "3-4 места"} tooltipText="Полуфинал." /></FormLabel>
                            <FormControl><Input type="number" step={isOmsk ? "0.01" : "1"} {...field} disabled={isPending || isProcessing} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="pointsFor5th_8th" render={({ field }) => (
                        <FormItem>
                            <FormLabel><LabelWithTooltip label={isOmsk ? "Множитель 1/4 финала" : "5-8 места"} tooltipText="Четвертьфинал." /></FormLabel>
                            <FormControl><Input type="number" step={isOmsk ? "0.01" : "1"} {...field} disabled={isPending || isProcessing} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    
                    {!isOmsk && (
                        <FormField control={form.control} name="pointsFor9th_16th" render={({ field }) => (<FormItem><FormLabel><LabelWithTooltip label="9-16 места" tooltipText="1/8 финала." /></FormLabel><FormControl><Input type="number" {...field} disabled={isPending || isProcessing} /></FormControl><FormMessage /></FormItem>)} />
                    )}
                    
                    <FormField control={form.control} name="participationPoints" render={({ field }) => (
                        <FormItem>
                            <FormLabel><LabelWithTooltip label={isOmsk ? "Фикс. баллы (остальные)" : "За участие (остальные)"} tooltipText="Для всех остальных." /></FormLabel>
                            <FormControl><Input type="number" step={isOmsk ? "0.01" : "1"} {...field} disabled={isPending || isProcessing} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </div>

            <Separator />

            <div>
                <h3 className="text-lg mb-2 font-medium">Бонусы за статистику</h3>
                <div className="space-y-6">
                    <div className="flex flex-col space-y-4 rounded-lg border p-4 bg-card/30">
                        <FormField
                            control={form.control}
                            name="enable180Bonus"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between">
                                    <FormLabel><LabelWithTooltip label="Бонус за 180" tooltipText="За каждый 'максимум'." /></FormLabel>
                                    <FormControl><Switch checked={field.value} onCheckedChange={checked => { field.onChange(checked); if (!checked) setValue('bonusPer180', 0); }} disabled={isPending || isProcessing} /></FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="bonusPer180" render={({ field }) => (<FormItem><FormLabel className="text-xs text-muted-foreground">Очки за каждый 180</FormLabel><FormControl><Input type="number" {...field} disabled={!watch('enable180Bonus') || isPending || isProcessing} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="flex flex-col space-y-4 rounded-lg border p-4 bg-card/30">
                        <FormField
                            control={form.control}
                            name="enableHiOutBonus"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between">
                                    <FormLabel><LabelWithTooltip label="Бонус за Hi-Out" tooltipText="За высокое закрытие." /></FormLabel>
                                    <FormControl><Switch checked={field.value} onCheckedChange={checked => { field.onChange(checked); if (!checked) { setValue('hiOutThreshold', 0); setValue('hiOutBonus', 0); } }} disabled={isPending || isProcessing} /></FormControl>
                                </FormItem>
                            )}
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="hiOutThreshold" render={({ field }) => (<FormItem><FormLabel className="text-xs text-muted-foreground">Мин. Hi-Out</FormLabel><FormControl><Input type="number" {...field} disabled={!watch('enableHiOutBonus') || isPending || isProcessing} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="hiOutBonus" render={({ field }) => (<FormItem><FormLabel className="text-xs text-muted-foreground">Баллы</FormLabel><FormControl><Input type="number" {...field} disabled={!watch('enableHiOutBonus') || isPending || isProcessing} /></FormControl><FormMessage /></FormItem>)} />
                         </div>
                    </div>
                </div>
            </div>
        </div>
        </TooltipProvider>
        <CardFooter className="mt-8">
          <Button type="submit" disabled={isPending || isProcessing} className="ml-auto active:scale-95 shadow-lg shadow-primary/20">
            {isPending || isProcessing ? <Loader2 className="animate-spin" /> : <Save />}
            Сохранить настройки {isOmsk ? 'ОМСК' : ''}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}
