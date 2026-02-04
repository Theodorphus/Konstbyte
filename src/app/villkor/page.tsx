import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function TermsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Användarvillkor</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        <p>Här beskriver vi regler för användning av Konstbyte.</p>
      </CardContent>
    </Card>
  );
}
