import { type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BATTERY } from "@/lib/school-resources";
export function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return <div className="grid min-w-0 gap-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>;
}
export function Choice({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return <Field label={label} id={id}><Select value={value} onValueChange={onChange}><SelectTrigger id={id} className="min-h-10"><SelectValue /></SelectTrigger><SelectContent>{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></Field>;
}
export function BatteryChoice({ value, onChange, allowUnknown = true }: { value: string; onChange: (v: string) => void; allowUnknown?: boolean }) {
  return <Choice id="battery" label="Bateria observada" value={value} onChange={onChange} options={[...(allowUnknown ? [{ value: "unknown", label: "Desconhecida" }] : []), ...BATTERY.map(b => ({ value: String(b.value), label: b.label }))]} />;
}
export function Metric({ label, value, detail }: { label: string; value: number | string; detail?: string }) {
  return <div className="min-w-0 rounded-lg border bg-card p-4"><div className="text-xs font-medium text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-semibold">{value}</div>{detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}</div>;
}