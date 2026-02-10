import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function PurchaseTermsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Köpvillkor</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        <p>Villkor för köp, leverans och returer av konstverk.</p>
      </CardContent>
    </Card>
  );
}
