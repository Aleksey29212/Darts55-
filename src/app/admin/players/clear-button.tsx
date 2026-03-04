'use client';

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
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { clearAllPlayerData } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useTransition, useState, useCallback } from "react";

export function ClearButton() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleClear = useCallback(() => {
        if (isProcessing || isPending) return;

        setIsProcessing(true);
        startTransition(async () => {
            try {
                const result = await clearAllPlayerData();
                if (result.success) {
                    toast({
                        title: 'Успешно',
                        description: 'Все данные игроков были удалены.',
                    });
                } else {
                     toast({
                        title: 'Ошибка',
                        description: result.message || 'Не удалось очистить данные.',
                        variant: 'destructive',
                    });
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Неизвестная ошибка при удалении';
                toast({
                    title: 'Критическая ошибка',
                    description: message,
                    variant: 'destructive',
                });
            } finally {
                setIsProcessing(false);
            }
        });
    }, [isProcessing, isPending, toast]);

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 />
                    Очистить все
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glassmorphism">
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие необратимо. Все данные об игроках, включая рейтинг, очки и статистику, будут удалены.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isProcessing}>Отмена</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleClear} 
                        disabled={isPending || isProcessing}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {(isPending || isProcessing) && <Loader2 className="animate-spin" />}
                        {(isPending || isProcessing) ? 'Удаление...' : 'Да, очистить'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
