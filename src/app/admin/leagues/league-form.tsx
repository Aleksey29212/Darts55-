'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { AllLeagueSettings, LeagueId } from '@/lib/types';
import { useTransition, useEffect, useState } from 'react';
import { saveLeagueSettings } from '@/app/actions';
import { useAdmin } from '@/context/admin-context';

const leagueSchema = z.object({
  name: z.string().min(1, 'Название не может быть пустым.'),
  enabled: z.boolean(),
});

const allLeaguesSchema = z.object({
  general: leagueSchema,
  premier: leagueSchema,
  first: leagueSchema,
  cricket: leagueSchema,
  senior: leagueSchema,
  youth: leagueSchema,
  women: leagueSchema,
  evening_omsk: leagueSchema,
});

type LeagueFormValues = z.infer<typeof allLeaguesSchema>;

interface LeagueSettingsFormProps {
  defaultValues: LeagueFormValues;
}

const leagueIds: LeagueId[] = ['general', 'premier', 'first', 'cricket', 'senior', 'youth', 'women', 'evening_omsk'];

export function LeagueSettingsForm({ defaultValues }: LeagueSettingsFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isProcessing, setIsProcessing] = useState(false);
  const { setIsDirty } = useAdmin();

  const form = useForm<LeagueFormValues>({
    resolver: zodResolver(allLeaguesSchema),
    defaultValues,
  });

  const { formState: { isDirty: isFormDirty } } = form;

  useEffect(() => {
    setIsDirty(isFormDirty);
    return () => {
      setIsDirty(false);
    };
  }, [isFormDirty, setIsDirty]);

  async function onSubmit(data: LeagueFormValues) {
    if (isProcessing || isPending) return;

    setIsProcessing(true);
    startTransition(async () => {
        try {
            const result = await saveLeagueSettings(data);
            toast({
                title: result.success ? 'Успешно' : 'Ошибка',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                form.reset(data);
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Ошибка при сохранении лиг';
            toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {leagueIds.map((leagueId) => (
            <div key={leagueId} className="flex flex-col space-y-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name={`${leagueId}.enabled`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <FormLabel className="text-lg font-medium">{defaultValues[leagueId]?.name || leagueId}</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending || isProcessing} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${leagueId}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Название для вкладки</FormLabel>
                    <FormControl><Input {...field} disabled={!form.watch(`${leagueId}.enabled`) || isPending || isProcessing} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending || isProcessing} className="ml-auto active:scale-95 transition-transform">
            {isPending || isProcessing ? (
              <>
                <Loader2 className="animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save />
                Сохранить настройки
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}