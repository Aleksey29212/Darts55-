
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { saveBackgroundAction } from '@/app/actions';
import { Loader2, Save, Upload, RotateCcw, Image as ImageIcon } from 'lucide-react';
import NextImage from 'next/image';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

function SubmitButtons() {
  const { pending } = useFormStatus();
  return (
    <div className="flex gap-2">
      <Button type="submit" name="intent" value="save" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />}
        Сохранить
      </Button>
      <Button type="submit" name="intent" value="reset" variant="outline" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
        Сбросить фон
      </Button>
    </div>
  );
}

export function BackgroundForm({ currentUrl }: { currentUrl: string }) {
  const { toast } = useToast();
  const db = useFirestore();
  const bgDocRef = useMemoFirebase(() => db ? doc(db, 'app_settings', 'background') : null, [db]);
  const { data: bgData } = useDoc<any>(bgDocRef);
  
  const [state, formAction] = useActionState(saveBackgroundAction, null);
  const [url, setUrl] = useState(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with Firestore data when it changes
  useEffect(() => {
    if (bgData && bgData.url !== undefined) {
      setUrl(bgData.url);
    }
  }, [bgData]);

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? 'Успешно' : 'Ошибка',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success && state.message.includes('Сброшен')) {
          setUrl('');
      }
    }
  }, [state, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form action={formAction}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">URL фонового изображения</Label>
          <div className="flex items-center gap-2">
            <Input
              id="url"
              name="url"
              placeholder="https://images.unsplash.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload /> Загрузить
            </Button>
            <Input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect}
            />
          </div>
        </div>

        {url ? (
            <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Предпросмотр:</p>
                <div className="relative h-40 w-full rounded-md overflow-hidden">
                     <NextImage src={url} alt="Предпросмотр фона" fill className="object-cover" unoptimized={url.startsWith('data:image')} />
                </div>
            </div>
        ) : (
             <div className="p-4 border border-dashed rounded-lg bg-muted/50 text-center text-muted-foreground">
                <ImageIcon className="mx-auto h-12 w-12" />
                <p>Фоновое изображение не установлено</p>
             </div>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <SubmitButtons />
      </CardFooter>
    </form>
  );
}
