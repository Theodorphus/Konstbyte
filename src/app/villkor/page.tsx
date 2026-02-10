import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function TermsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Användarvillkor</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        <p>Här beskriver vi reglerna för hur Konstbyte får användas.</p>
      </CardContent>
    </Card>
  );
}
