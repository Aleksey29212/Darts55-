import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex-1 container py-8 flex items-center justify-center">
      <Card className="glassmorphism max-w-md w-full text-center">
        <CardHeader>
          <CardTitle className="font-headline text-5xl text-destructive">404</CardTitle>
          <CardDescription className="text-xl">Страница не найдена</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-8 text-muted-foreground">К сожалению, мы не смогли найти страницу, которую вы ищете.</p>
          <Button asChild>
            <Link href="/">
              <Home />
              Вернуться на главную
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
