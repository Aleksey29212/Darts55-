import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Handshake, Settings } from 'lucide-react';
import { PartnerList } from './partner-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSponsorshipSettings } from '@/lib/settings';
import { SponsorshipSettingsForm } from './sponsorship-settings-form';

export default async function PartnersPage() {
  const sponsorshipSettings = await getSponsorshipSettings();

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Handshake className="text-primary" />
            Управление партнерами и спонсорством
          </CardTitle>
          <CardDescription>
            Добавляйте партнеров и настраивайте ссылки для привлечения новых спонсоров.
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="list" className="w-full">
            <div className="px-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="list" className="gap-2">
                        <Handshake className="h-4 w-4" />
                        Список партнеров
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Настройки связи
                    </TabsTrigger>
                </TabsList>
            </div>
            
            <TabsContent value="list" className="mt-4">
                <PartnerList />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-4">
                <CardContent>
                    <SponsorshipSettingsForm initialSettings={sponsorshipSettings} />
                </CardContent>
            </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
