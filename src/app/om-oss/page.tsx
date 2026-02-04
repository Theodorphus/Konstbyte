import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function AboutPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Om Konstbyte</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600 space-y-2">
        <p>Konstbyte är en marknadsplats där konstnärer och samlare möts.</p>
        <p>Vårt mål är att göra konsthandel trygg, transparent och inspirerande.</p>
      </CardContent>
    </Card>
  );
}
