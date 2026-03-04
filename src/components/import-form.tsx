'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { importTournament } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import type { League, LeagueId } from '@/lib/types';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="self-end">
      {pending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
      Импорт
    </Button>
  );
}

export function ImportForm({ leagues }: { leagues: League[] }) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(importTournament, null);

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? 'Успешно' : 'Ошибка',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <Card className="glassmorphism">
      <CardHeader>
        <CardTitle className="text-2xl">Импорт турнира</CardTitle>
        <CardDescription>
            Введите ID или полную ссылку на турнир с dartsbase.ru. Можно указать несколько ID через запятую или пробел.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid md:grid-cols-[1fr_auto_auto] gap-4 items-center">
            <div className="grid gap-1.5">
                <Label htmlFor="tournamentId">ID или ссылка на турнир</Label>
                <Input
                    id="tournamentId"
                    name="tournamentId"
                    placeholder="12001, 10428, https://dartsbase.ru/tournaments/9940"
                    required
                />
            </div>
             <div className="grid gap-1.5">
                <Label htmlFor="league">Лига</Label>
                <Select name="league" defaultValue="general" required>
                    <SelectTrigger id="league" className="w-[180px]">
                        <SelectValue placeholder="Выберите лигу" />
                    </SelectTrigger>
                    <SelectContent>
                        {leagues.map(league => (
                            <SelectItem key={league.id} value={league.id}>{league.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
