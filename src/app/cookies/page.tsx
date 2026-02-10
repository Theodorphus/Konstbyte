import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function CookiesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cookies</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        <p>Vi använder cookies för att förbättra upplevelsen och förstå användning.</p>
      </CardContent>
    </Card>
  );
}
