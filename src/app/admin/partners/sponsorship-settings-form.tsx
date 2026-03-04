
'use client';

import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { saveSponsorshipAction } from '@/app/actions';
import { Save, Loader2, Info } from 'lucide-react';
import type { SponsorshipSettings } from '@/lib/types';
import { Switch } from '@/components/ui/switch';

const sponsorshipSettingsSchema = z.object({
  adminTelegramLink: z.string().url('Введите корректную ссылку.').max(1000, 'Максимум 1000 символов'),
  groupTelegramLink: z.string().url('Введите корректную ссылку.').max(1000, 'Максимум 1000 символов'),
  adminVkLink: z.string().url('Введите корректную ссылку.').max(1000, 'Максимум 1000 символов'),
  groupVkLink: z.string().url('Введите корректную ссылку.').max(1000, 'Максимум 1000 символов'),
  showGlobalSponsorCta: z.boolean(),
});

type SponsorshipSettingsFormValues = z.infer<typeof sponsorshipSettingsSchema>;

export function SponsorshipSettingsForm({ initialSettings }: { initialSettings: SponsorshipSettings }) {
  const [isPending, startTransition] = useTransition();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const form = useForm<SponsorshipSettingsFormValues>({
    resolver: zodResolver(sponsorshipSettingsSchema),
    defaultValues: initialSettings,
  });

  async function onSubmit(data: SponsorshipSettingsFormValues) {
    if (isProcessing || isPending) return;
    
    setIsProcessing(true);
    startTransition(async () => {
      try {
        const result = await saveSponsorshipAction(data);
        toast({
          title: result.success ? 'Успешно' : 'Ошибка',
          description: result.message,
          variant: result.success ? 'default' : 'destructive',
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Ошибка при сохранении';
        toast({ title: 'Ошибка', description: message, variant: 'destructive' });
      } finally {
        setIsProcessing(false);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3 mb-6">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground italic">
                Эти ссылки используются в рекламных баннерах на странице «Партнеры» и в призывах к спонсорству в карточках игроков.
            </p>
        </div>

        <div className="p-4 rounded-xl border-2 border-accent/20 bg-accent/5 flex items-center justify-between mb-8">
            <div className="space-y-0.5">
                <FormLabel className="text-base font-bold text-accent">Глобальная реклама спонсорства</FormLabel>
                <FormDescription>Показывать призыв «Стать спонсором» во всех карточках игроков, у которых нет партнера.</FormDescription>
            </div>
            <FormField
              control={form.control}
              name="showGlobalSponsorCta"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending || isProcessing} />
                  </FormControl>
                </FormItem>
              )}
            />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <h3 className="font-medium text-lg border-b pb-2">Telegram</h3>
                <FormField
                  control={form.control}
                  name="adminTelegramLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telegram администратора</FormLabel>
                      <FormControl>
                        <Input placeholder="https://t.me/your_admin_name" {...field} disabled={isPending || isProcessing} />
                      </FormControl>
                      <FormDescription>
                        Для баннера «Ваш магазин в системе» и связи по игрокам.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="groupTelegramLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telegram группы</FormLabel>
                      <FormControl>
                        <Input placeholder="https://t.me/your_group_link" {...field} disabled={isPending || isProcessing} />
                      </FormControl>
                      <FormDescription>
                        Для баннера «Спонсорство лиги».
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <div className="space-y-6">
                <h3 className="font-medium text-lg border-b pb-2">ВКонтакте (VK)</h3>
                <FormField
                  control={form.control}
                  name="adminVkLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VK администратора</FormLabel>
                      <FormControl>
                        <Input placeholder="https://vk.com/id..." {...field} disabled={isPending || isProcessing} />
                      </FormControl>
                      <FormDescription>
                        Для баннера «Ваш магазин в системе» и связи по игрокам.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="groupVkLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VK группы</FormLabel>
                      <FormControl>
                        <Input placeholder="https://vk.com/group..." {...field} disabled={isPending || isProcessing} />
                      </FormControl>
                      <FormDescription>
                        Для баннера «Спонсорство лиги».
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending || isProcessing}>
            {isPending || isProcessing ? <Loader2 className="animate-spin" /> : <Save />}
            Сохранить настройки
          </Button>
        </div>
      </form>
    </Form>
  );
}
