import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';
import { getVisitStats } from '@/lib/analytics';
import { AnalyticsDashboard } from './analytics-dashboard';

export default async function AnalyticsPage() {
  const stats = await getVisitStats();

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BarChart className="text-primary" />
            Аналитика посещений
          </CardTitle>
          <CardDescription>
            Статистика уникальных пользовательских сессий на сайте. Новая сессия засчитывается при открытии сайта в новой вкладке или после длительного бездействия.
          </CardDescription>
        </CardHeader>
        <AnalyticsDashboard initialStats={stats} />
      </Card>
    </div>
  );
}
