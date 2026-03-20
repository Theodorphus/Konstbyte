import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export default async function PrivacyPage() {
  const t = await getTranslations('policies');
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('integritet_title')}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        <p>{t('integritet_text')}</p>
      </CardContent>
    </Card>
  );
}
