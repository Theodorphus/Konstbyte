import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function ContactPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontakta oss</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600 space-y-2">
        <p>Mail: konstbyte@gmail.com</p>
        <p>Plats: Göteborg, Sverige</p>
      </CardContent>
    </Card>
  );
}
