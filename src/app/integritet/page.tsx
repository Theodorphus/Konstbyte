import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function PrivacyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integritetspolicy</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        <p>Vi värnar om din integritet och hanterar data ansvarsfullt.</p>
      </CardContent>
    </Card>
  );
}
