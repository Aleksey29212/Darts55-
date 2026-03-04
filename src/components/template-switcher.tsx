'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Wand2 } from 'lucide-react';

export type TemplateId = 'classic' | 'modern' | 'dynamic';

interface TemplateSwitcherProps {
    selectedTemplate: TemplateId;
    onTemplateChange: (template: TemplateId) => void;
}

const templates: { id: TemplateId, name: string }[] = [
    { id: 'classic', name: 'Классический' },
    { id: 'modern', name: 'Современный' },
    { id: 'dynamic', name: 'Динамичный' },
];

export function TemplateSwitcher({ selectedTemplate, onTemplateChange }: TemplateSwitcherProps) {
    return (
        <Card className="glassmorphism">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Wand2 className="text-accent"/>
                    Шаблоны карточек
                </CardTitle>
                <CardDescription>
                    Выберите один из доступных шаблонов для отображения информации об игроке. (Прим.: Разработано 3 из 10 в качестве примера).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup
                    defaultValue={selectedTemplate}
                    onValueChange={(value: TemplateId) => onTemplateChange(value)}
                    className="gap-3"
                >
                    {templates.map(template => (
                         <div key={template.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={template.id} id={`template-${template.id}`} />
                            <Label htmlFor={`template-${template.id}`}>{template.name}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </CardContent>
        </Card>
    );
}
