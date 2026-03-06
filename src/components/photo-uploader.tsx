
'use client';

import { useState, useCallback, useTransition, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { CardContent } from './ui/card';
import { UploadCloud, XCircle, RotateCcw, Loader2, Crop } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from './ui/button';
import Image from 'next/image';
import type { PlayerProfile } from '@/lib/types';
import { updatePlayerAvatar } from '@/app/actions';
import { useRouter } from 'next/navigation';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop as CropType,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Helper to get the cropped image data URL
function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return Promise.reject(new Error('Could not get canvas context'));
  }

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result as string));
      reader.readAsDataURL(blob);
    }, 'image/png');
  });
}

export function PhotoUploader({ players }: { players: PlayerProfile[] }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const imgRef = useRef<HTMLImageElement>(null);

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!selectedPlayerId) {
        toast({
          title: 'Ошибка',
          description: 'Пожалуйста, сначала выберите игрока.',
          variant: 'destructive',
        });
        return;
      }

      const file = acceptedFiles[0];
      if (file) {
        setCrop(undefined); // Reset crop on new image
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [selectedPlayerId, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif'] },
    multiple: false,
    disabled: isPending || !selectedPlayerId,
  });

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  }

  const handleUpload = async () => {
    if (!completedCrop || !imgRef.current) {
      toast({
        title: 'Ошибка',
        description:
          'Пожалуйста, выберите область для обрезки, прежде чем сохранять.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedPlayerId) return;

    startTransition(async () => {
      try {
        const croppedDataUrl = await getCroppedImg(
          imgRef.current!,
          completedCrop
        );
        const result = await updatePlayerAvatar(selectedPlayerId, croppedDataUrl);
        toast({
          title: result.success ? 'Успех' : 'Ошибка',
          description: result.message,
          variant: result.success ? 'default' : 'destructive',
        });
        if (result.success) {
          setPreview(null);
          setCrop(undefined);
          setCompletedCrop(undefined);
          router.refresh();
        }
      } catch (e: unknown) {
        console.error('Crop failed:', e);
        const msg = e instanceof Error ? e.message : 'Неизвестная ошибка';
        toast({
          title: 'Ошибка',
          description: `Не удалось обрезать изображение: ${msg}`,
          variant: 'destructive',
        });
      }
    });
  };

  const handleReset = () => {
    if (!selectedPlayerId) return;

    startTransition(async () => {
      const result = await updatePlayerAvatar(selectedPlayerId, null);
      toast({
        title: result.success ? 'Успех' : 'Ошибка',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
      if (result.success) {
        setPreview(null);
        router.refresh();
      }
    });
  };

  const clearPreview = () => {
    setPreview(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  return (
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <label className="font-medium">1. Выберите игрока</label>
        <Select
          onValueChange={(id) => {
            setSelectedPlayerId(id);
            clearPreview();
          }}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите игрока..." />
          </SelectTrigger>
          <SelectContent>
            {players.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPlayer && (
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Текущий аватар:</p>
          <Image
            src={selectedPlayer.avatarUrl}
            alt={selectedPlayer.name}
            width={60}
            height={60}
            className="rounded-full object-cover"
            data-ai-hint={selectedPlayer.imageHint}
            unoptimized={selectedPlayer.avatarUrl.startsWith('data:image')}
          />
          <Button
            onClick={handleReset}
            disabled={
              isPending ||
              selectedPlayer.avatarUrl.startsWith('https://picsum.photos')
            }
            variant="outline"
            size="sm"
            className="ml-auto"
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RotateCcw />
            )}
            Сбросить
          </Button>
        </div>
      )}

      {!preview && (
        <div className="space-y-2">
          <label className="font-medium">2. Выберите файл</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
            ${
              isPending || !selectedPlayerId
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <UploadCloud className="h-10 w-10" />
              {!selectedPlayerId ? (
                <p>Сначала выберите игрока</p>
              ) : isDragActive ? (
                <p>Отпустите, чтобы загрузить</p>
              ) : (
                <p>Перетащите файл сюда или нажмите для выбора</p>
              )}
              <p className="text-xs">PNG, JPG, GIF</p>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="font-medium">3. Обрежьте фото (квадрат)</label>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearPreview}
              disabled={isPending}
              aria-label="Отменить загрузку"
            >
              <XCircle className="text-destructive" />
            </Button>
          </div>

          <div className="p-4 border rounded-lg bg-black/20 flex justify-center">
             <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                minWidth={100}
             >
                <Image
                    ref={imgRef}
                    alt="Image to crop"
                    src={preview}
                    onLoad={onImageLoad}
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{ width: 'auto', height: 'auto', maxHeight: '70vh' }}
                    unoptimized
                />
            </ReactCrop>
          </div>

          <Button
            onClick={handleUpload}
            disabled={isPending || !completedCrop?.width}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Crop />
            )}
            Обрезать и сохранить аватар
          </Button>
        </div>
      )}
    </CardContent>
  );
}
