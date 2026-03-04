import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Image } from 'lucide-react';
import { getBackgroundUrl } from '@/lib/settings';
import { BackgroundForm } from './background-form';

export default async function BackgroundPage() {
  const backgroundUrl = await getBackgroundUrl();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Image className="text-primary" />
            Управление фоном
          </CardTitle>
          <CardDescription>
            Задайте URL-адрес фонового изображения для всего сайта или загрузите свой файл. Оставьте поле пустым, чтобы убрать фон.
          </CardDescription>
        </CardHeader>
        <BackgroundForm currentUrl={backgroundUrl} />
      </Card>
    </div>
  );
}
