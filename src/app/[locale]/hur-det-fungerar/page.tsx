import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export default async function HowItWorksPage() {
  const t = await getTranslations('how_it_works');
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600 space-y-2">
        <p>1. {t('step_1')}</p>
        <p>2. {t('step_2')}</p>
        <p>3. {t('step_3')}</p>
      </CardContent>
    </Card>
  );
}
