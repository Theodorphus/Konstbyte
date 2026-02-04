import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function FeesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Avgifter & Priser</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600 space-y-2">
        <p>Plattformsavgift: 3% på alla försäljningar.</p>
        <p>Betalningar hanteras säkert via Stripe.</p>
      </CardContent>
    </Card>
  );
}
