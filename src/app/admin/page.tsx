
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, Calculator, Users, Wand2, Trophy, Camera, Library, Handshake, Image, BarChart, Settings } from "lucide-react";

const adminSections = [
    {
        href: '/admin/analytics',
        title: 'Аналитика',
        description: 'Смотрите статистику посещаемости сайта.',
        icon: BarChart,
    },
    {
        href: '/admin/leagues',
        title: 'Управление лигами',
        description: 'Включайте и отключайте лиги, меняйте их названия.',
        icon: Library,
    },
    {
        href: '/admin/tournaments',
        title: 'Управление турнирами',
        description: 'Импорт турниров, очистка базы данных турниров.',
        icon: Trophy,
    },
    {
        href: '/admin/scoring',
        title: 'Настройки подсчета очков',
        description: 'Настраивайте очки и бонусы для каждой лиги.',
        icon: Calculator,
    },
    {
        href: '/admin/players',
        title: 'Управление игроками',
        description: 'Редактируйте профили игроков.',
        icon: Users,
    },
    {
        href: '/admin/style-studio',
        title: 'Студия стилей',
        description: 'Генерируйте и применяйте цветовые схемы на основе AI.',
        icon: Wand2,
    },
    {
        href: '/admin/photo-studio',
        title: 'Фотостудия',
        description: 'Загружайте и обновляйте аватары игроков.',
        icon: Camera,
    },
    {
        href: '/admin/partners',
        title: 'Управление партнерами',
        description: 'Добавляйте и редактируйте логотипы и ссылки партнеров.',
        icon: Handshake,
    },
    {
        href: '/admin/background',
        title: 'Фон страницы',
        description: 'Управляйте фоновым изображением всего сайта.',
        icon: Image,
    },
    {
        href: '/admin/system',
        title: 'Система и Обновление',
        description: 'Управление развертыванием и техническими настройками.',
        icon: Settings,
    }
];

export default async function AdminPage() {
  return (
    <div className="grid gap-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map(section => (
                <Link 
                    key={section.href} 
                    href={section.href} 
                    prefetch={true}
                    className="group outline-none block h-full"
                >
                    <Card className="h-full flex flex-col glassmorphism border-2 border-transparent hover:border-primary transition-all duration-150 cursor-pointer active:scale-[0.97] hover:shadow-2xl hover:shadow-primary/10">
                        <CardHeader className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                                    <section.icon className="h-6 w-6"/>
                                </div>
                                <CardTitle className="text-xl tracking-tight">{section.title}</CardTitle>
                            </div>
                            <CardDescription className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors duration-150">
                                {section.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto pt-0 flex justify-end pb-6">
                            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-4 group-hover:translate-x-0">
                                Открыть раздел
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    </div>
  );
}
