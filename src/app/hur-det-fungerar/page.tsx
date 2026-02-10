import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function HowItWorksPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hur det fungerar</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600 space-y-2">
        <p>1. Skapa konto och ladda upp ditt konstverk.</p>
        <p>2. Sätt ett pris eller använd AI‑värdering som stöd.</p>
        <p>3. Sälj tryggt med Stripe och följ ordern i din profil.</p>
      </CardContent>
    </Card>
  );
}
