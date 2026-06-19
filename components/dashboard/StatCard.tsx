import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        <div className="text-sm text-text-muted">{label}</div>
      </CardContent>
    </Card>
  );
}
