import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Field, Choice, BatteryChoice } from "./ResourceControls";
import { BATTERY, CONDITIONS, STATES, dateInSchool, schoolInstant, resourceAction, type Resource, type Equipment, type Reservation } from "@/lib/school-resources";
import type { Tables, Json } from "@/integrations/supabase/types";

export type ResourceDialog = { action: "reserve" | "configure"; resource: Resource } | { action: "inspect" | "transfer"; equipment: Equipment } | { action: "checkout" | "return"; booking: Reservation } | { action: "platform" };
export function ResourceDialogs({ dialog, close, resources, equipment, teacher, date, loans }: { dialog: ResourceDialog; close: () => void; resources: Resource[]; equipment: Equipment[]; teacher: string; date: string; loans: Tables<"netbook_loans">[] }) {
  const a = dialog.action;
  const resource = "resource" in dialog ? dialog.resource : undefined;
  const unit = "equipment" in dialog ? dialog.equipment : undefined;
  const booking = "booking" in dialog ? dialog.booking : undefined;
  const [name, setName] = useState(teacher);
  const [day, setDay] = useState(date);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:00");
  const [qty, setQty] = useState(resource ? String(equipment.filter(e => e.home_id === resource.id && e.enabled).length) : "1");
  const [students, setStudents] = useState("");
  const [destination, setDestination] = useState(booking?.destination ?? "");
  const [target, setTarget] = useState(unit?.current_location_id ?? resources.find(r => r.kind === "cart")?.id ?? "none");
  const [battery, setBattery] = useState(unit?.battery ? String(unit.battery) : a === "inspect" ? "unknown" : "1");
  const [condition, setCondition] = useState(unit?.condition ?? "unknown");
  const [state, setState] = useState(unit?.state ?? "stored");
  const [asset, setAsset] = useState(unit?.asset_code ?? "");
  const [notes, setNotes] = useState("");
  const [purpose, setPurpose] = useState("");
  const [enabled, setEnabled] = useState(resource?.enabled ?? false);
  const [approval, setApproval] = useState(resource?.requires_approval ?? false);
  const [hours, setHours] = useState(String(resource?.battery_valid_hours ?? 0));
  const [accepted, setAccepted] = useState<number[]>(resource?.accepted_battery ?? []);
  const [damaged, setDamaged] = useState(false);
  const [legacy, setLegacy] = useState("none");
  const [capacity, setCapacity] = useState("0");
  const client = useQueryClient();
  const mutation = useMutation({ mutationFn: (data: Record<string, Json | undefined>) => resourceAction(a,data), onSuccess: async () => { await Promise.all([client.invalidateQueries({queryKey:["school-snapshot"]}),client.invalidateQueries({queryKey:["school-private"]})]); toast.success("Registro salvo"); close(); }, onError: (e: Error) => toast.error(e.message) });
  function submit(e: FormEvent) {
    e.preventDefault();
    const data: Record<string, Json | undefined> = { id: resource?.id ?? unit?.id ?? booking?.id, notes };
    if (a === "reserve") Object.assign(data,{ resource_id: resource?.id, teacher: name.trim(), starts_at: schoolInstant(day,start), ends_at: schoolInstant(day,end), quantity: resource?.kind === "room" ? 1 : Number(qty), destination, students: students || null, purpose });
    if (a === "configure") Object.assign(data,{ enabled, enabled_quantity: Number(qty), requires_approval: approval, battery_valid_hours: Number(hours), accepted_battery: accepted });
    if (a === "inspect") Object.assign(data,{ battery: battery === "unknown" ? null : Number(battery), condition, asset_code: asset, state });
    if (a === "transfer") Object.assign(data,{ state, destination_id: target === "none" ? null : target, destination });
    if (a === "checkout" || a === "return") Object.assign(data,{ quantity: Number(qty), battery: Number(battery), destination_id: target, damaged, legacy_loan_id: legacy === "none" ? null : legacy });
    if (a === "platform") Object.assign(data,{ name, location: destination, capacity: Number(capacity) });
    mutation.mutate(data);
  }
  const titles = { reserve: "Nova reserva", configure: "Configurar recurso", inspect: "Conferir equipamento", transfer: "Armazenamento e carregamento", checkout: "Registrar retirada", return: "Registrar devolução", platform: "Nova plataforma" };
  return <Dialog open onOpenChange={v => { if (!v && !mutation.isPending) close(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg"><DialogHeader><DialogTitle>{titles[a]}</DialogTitle><DialogDescription>{resource?.name ?? (unit ? `Unidade interna ${unit.internal_index} · ${resources.find(r => r.id === unit.home_id)?.name}` : booking?.teacher ?? "Carregamento e armazenamento")}</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="grid gap-4">
      {(a === "reserve" || a === "platform") && <Field id="responsible" label={a === "platform" ? "Nome da plataforma" : "Professor responsável"}><Input id="responsible" value={name} onChange={e => setName(e.target.value)} required /></Field>}
      {a === "reserve" && <><Field id="booking-date" label="Data"><Input id="booking-date" type="date" min={dateInSchool(new Date())} value={day} onChange={e => setDay(e.target.value)} required /></Field><div className="grid grid-cols-2 gap-3"><Field id="start" label="Início"><Input id="start" type="time" value={start} onChange={e => setStart(e.target.value)} required /></Field><Field id="end" label="Término"><Input id="end" type="time" value={end} onChange={e => setEnd(e.target.value)} required /></Field></div>
        {resource?.kind === "room" && <Field id="students" label="Alunos estimados (opcional)"><Input id="students" type="number" min="0" value={students} onChange={e => setStudents(e.target.value)} /></Field>}
        <Field id="purpose" label="Finalidade (opcional)"><Input id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} /></Field></>}
      {(a === "configure" || a === "checkout" || a === "return" || (a === "reserve" && resource?.kind === "cart")) && <Field id="quantity" label={a === "configure" ? "Quantidade habilitada" : "Quantidade"}><Input id="quantity" type="number" min={a === "configure" ? 0 : 1} max={a === "configure" ? equipment.filter(e => e.home_id === resource?.id).length : undefined} value={a === "reserve" && qty === "0" ? "1" : qty} onChange={e => setQty(e.target.value)} required /></Field>}
      {(a === "platform" || (a === "reserve" && resource?.kind === "cart") || (a === "transfer" && state === "outside")) && <Field id="destination" label={a === "platform" ? "Localização" : "Sala / local de destino"}><Input id="destination" value={destination} onChange={e => setDestination(e.target.value)} required /></Field>}
      {a === "platform" && <Field id="capacity" label="Capacidade máxima"><Input id="capacity" type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} required /></Field>}
      {a === "configure" && <><label className="flex items-center gap-3"><Checkbox checked={enabled} onCheckedChange={v => setEnabled(v === true)} />Habilitar empréstimos</label><label className="flex items-center gap-3"><Checkbox checked={approval} onCheckedChange={v => setApproval(v === true)} />Exigir aprovação de reservas</label>{resource?.kind === "cart" && <><Field id="hours" label="Validade da observação de bateria (horas)"><Input id="hours" type="number" min="0" value={hours} onChange={e => setHours(e.target.value)} required /></Field><fieldset className="grid gap-2"><legend className="mb-2 text-sm font-medium">Baterias aceitas para empréstimo</legend>{BATTERY.map(b => <label key={b.value} className="flex items-center gap-3 text-sm"><Checkbox checked={accepted.includes(b.value)} onCheckedChange={v => setAccepted(prev => v ? [...prev,b.value] : prev.filter(x => x !== b.value))} />{b.label}</label>)}</fieldset></>}</>}
      {a === "inspect" && <><Field id="asset" label="Patrimônio / identificação oficial (opcional)"><Input id="asset" value={asset} onChange={e => setAsset(e.target.value)} /></Field><Choice id="condition" label="Condição operacional" value={condition} onChange={setCondition} options={Object.entries(CONDITIONS).map(([value,label]) => ({value,label}))} />{unit?.kind === "desktop" && <Choice id="state" label="Situação" value={state} onChange={setState} options={["stored","in_use"].map(value => ({value,label:STATES[value]}))} />}</>}
      {(a === "checkout" || a === "return" || (a === "inspect" && unit?.kind === "notebook")) && <BatteryChoice value={battery} onChange={setBattery} allowUnknown={a === "inspect"} />}
      {a === "transfer" && <Choice id="state" label="Situação" value={state} onChange={setState} options={["stored","charging","outside"].map(value => ({value,label:STATES[value]}))} />}
      {(a === "return" || (a === "transfer" && state !== "outside")) && <Choice id="target" label="Carrinho / plataforma de destino" value={target} onChange={setTarget} options={resources.filter(r => r.kind !== "room").map(r => ({value:r.id,label:r.name}))} />}
      {a === "return" && <label className="flex items-center gap-3"><Checkbox checked={damaged} onCheckedChange={v => setDamaged(v === true)} />Unidades devolvidas com problema</label>}
      {a === "checkout" && loans.length > 0 && <Choice id="legacy" label="Vincular retirada antiga (opcional)" value={legacy} onChange={setLegacy} options={[{value:"none",label:"Sem vínculo"},...loans.map(l => ({value:l.id,label:`${l.nome} · ${l.qtd_positivo+l.qtd_multilaser} aparelhos · ${l.sala}`}))]} />}
      <Field id="notes" label="Observações (opcional)"><Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} /></Field>
      {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={close}>Cancelar</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Salvando…" : a === "reserve" ? "Solicitar reserva" : "Salvar"}</Button></div>
    </form></DialogContent></Dialog>;
}