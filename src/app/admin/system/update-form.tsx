'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { triggerDeploymentAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function UpdateForm({ isConfigured }: { isConfigured: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const { toast } = useToast();

    const handleUpdate = () => {
        if (!isConfigured) return;
        
        setStatus('running');
        startTransition(async () => {
            try {
                const result = await triggerDeploymentAction();
                if (result.success) {
                    setStatus('success');
                    toast({
                        title: 'Сборка запущена',
                        description: result.message,
                    });
                } else {
                    setStatus('error');
                    toast({
                        title: 'Ошибка запуска',
                        description: result.message,
                        variant: 'destructive',
                    });
                }
            } catch (e) {
                setStatus('error');
                toast({
                    title: 'Ошибка сети',
                    description: 'Не удалось связаться с сервером.',
                    variant: 'destructive',
                });
            }
        });
    };

    return (
        <div className="space-y-6">
            {status === 'success' && (
                <Alert className="bg-success/10 border-success/50 text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Успех!</AlertTitle>
                    <AlertDescription>
                        Сборка успешно запущена в GitHub Actions. После ее завершения (3-5 минут) скачайте артефакт 'timeweb-deploy-package' со страницы воркфлоу и загрузите его на хостинг.
                    </AlertDescription>
                </Alert>
            )}

            {status === 'error' && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Ошибка</AlertTitle>
                    <AlertDescription>
                        Не удалось запустить сборку. Проверьте правильность GITHUB_TOKEN и прав доступа к репозиторию.
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-2xl bg-primary/5">
                <div className="mb-6 p-4 rounded-full bg-primary/10">
                    <Zap className={`h-12 w-12 text-primary ${isPending ? 'animate-pulse' : ''}`} />
                </div>
                
                <div className="text-center mb-8 max-w-sm">
                    <h4 className="text-lg font-bold mb-2">Запустить сборку пакета</h4>
                    <p className="text-sm text-muted-foreground">
                        Будет запущена задача <strong>deploy.yml</strong> в GitHub. Она соберет новый пакет для развертывания.
                    </p>
                </div>

                <Button 
                    size="lg" 
                    className="w-full sm:w-auto px-12 h-14 rounded-xl font-bold uppercase tracking-widest text-xs"
                    onClick={handleUpdate}
                    disabled={isPending || !isConfigured}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Запуск сборки...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Собрать новую версию
                        </>
                    )}
                </Button>
                
                {!isConfigured && (
                    <p className="mt-4 text-xs text-destructive font-black uppercase tracking-tighter">
                        Кнопка заблокирована: нет ключей доступа
                    </p>
                )}
            </div>

            <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                <p>⚠️ Примечание: Процесс сборки занимает 3-5 минут. После этого вам нужно будет вручную загрузить готовый пакет на хостинг.</p>
            </div>
        </div>
    );
}
