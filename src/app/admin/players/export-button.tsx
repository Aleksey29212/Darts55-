'use client';

import { useTransition, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { exportAllRankingsAction } from '@/app/actions';

export function ExportButton() {
    const [isPending, startTransition] = useTransition();
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleExport = useCallback(() => {
        if (isProcessing || isPending) return;

        setIsProcessing(true);
        startTransition(async () => {
            try {
                const result = await exportAllRankingsAction();

                if (result.success && result.csv) {
                    // Add BOM for Excel to recognize UTF-8
                    const blob = new Blob(['\uFEFF' + result.csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    const date = new Date().toISOString().split('T')[0];
                    link.setAttribute("download", `dartbrig_pro_rankings_${date}.csv`);
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    toast({
                        title: 'Успешно',
                        description: 'Файл рейтинга успешно сгенерирован и скачан.',
                    });
                } else {
                    toast({
                        title: 'Ошибка экспорта',
                        description: result.message || 'Не удалось сгенерировать данные.',
                        variant: 'destructive',
                    });
                }
            } catch(e: unknown) {
                const errorMessage = e instanceof Error ? e.message : 'Неизвестная ошибка при создании файла';
                toast({
                    title: 'Ошибка',
                    description: errorMessage,
                    variant: 'destructive',
                });
            } finally {
                setIsProcessing(false);
            }
        });
    }, [isProcessing, isPending, toast]);

    return (
        <Button onClick={handleExport} disabled={isPending || isProcessing}>
            {isPending || isProcessing ? <Loader2 className="animate-spin" /> : <Download />}
            Экспорт в CSV
        </Button>
    )
}
