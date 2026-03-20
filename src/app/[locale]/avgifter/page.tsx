import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export default async function FeesPage() {
  const t = await getTranslations('fees');
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600 space-y-2">
        <p>{t('platform_fee')}</p>
        <p>{t('stripe_note')}</p>
      </CardContent>
    </Card>
  );
}
