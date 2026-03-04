
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings, RefreshCw, Github } from 'lucide-react';
import { UpdateForm } from './update-form';

export default async function SystemPage() {
  const isGithubConfigured = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Settings className="text-primary" />
            Системные настройки
          </CardTitle>
          <CardDescription>
            Управление техническими аспектами платформы DartBrig Pro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="p-4 border rounded-xl bg-muted/20">
                <div className="flex items-center gap-3 mb-2">
                    <Github className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-bold">Статус GitHub Actions</h3>
                </div>
                {isGithubConfigured ? (
                    <p className="text-sm text-success font-medium">Конфигурация активна. Вы можете запускать сборку сайта.</p>
                ) : (
                    <p className="text-sm text-destructive font-medium">
                        GitHub не настроен. Для работы удаленной сборки укажите GITHUB_TOKEN, GITHUB_OWNER и GITHUB_REPO в переменных окружения.
                    </p>
                )}
            </div>
        </CardContent>
      </Card>

      <Card className="glassmorphism border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <RefreshCw className="text-primary" />
            Центр сборки
          </CardTitle>
          <CardDescription>
            Нажмите кнопку ниже, чтобы запустить процесс сборки новой версии сайта. После завершения скачайте артефакт из GitHub Actions и загрузите его на хостинг.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <UpdateForm isConfigured={isGithubConfigured} />
        </CardContent>
      </Card>
    </div>
  );
}
