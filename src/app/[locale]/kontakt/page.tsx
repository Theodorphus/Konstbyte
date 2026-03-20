import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export default async function ContactPage() {
  const t = await getTranslations('contact');
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('contact_us')}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600 space-y-2">
        <p>{t('email_info')}</p>
        <p>{t('location')}</p>
      </CardContent>
    </Card>
  );
}
