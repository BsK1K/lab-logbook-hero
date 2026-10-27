import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Json } from "@/integrations/supabase/types";

export type Equipment = Omit<Tables<"school_equipment">, "destination">;
export type Reservation = Tables<"school_reservations">;
export type Schedule = Pick<Reservation, "id" | "starts_at" | "ends_at" | "quantity" | "status">;
export type Resource = Tables<"school_resources"> & { available: number; schedule: Schedule[] };
export type Snapshot = { resources: Resource[]; equipment: Equipment[] };
export const BATTERY = [
  { value: 1, label: "Full / Cheio" },
  { value: 2, label: "MidHigh / Mais da metade" },
  { value: 3, label: "Mid / Metade" },
  { value: 4, label: "Low / Baixa carga" },
  { value: 5, label: "No Battery / Sem bateria" },
] as const;
export const CONDITIONS: Record<string, string> = { unknown: "Não verificado", operational: "Operacional", maintenance: "Em manutenção", damaged: "Danificado" };
export const STATES: Record<string, string> = { stored: "Armazenado", charging: "Carregando", outside: "Fora da plataforma", in_use: "Em uso" };
export const BOOKING_STATUS: Record<string, string> = { pending: "Aguardando aprovação", confirmed: "Confirmada", cancelled: "Cancelada", completed: "Concluída" };
export const MOVEMENT_LABEL: Record<string, string> = { checkout: "Retirada", return: "Devolução", inspect: "Conferência", transfer: "Transferência" };
export function batteryLabel(value: number | null) { return BATTERY.find(b => b.value === value)?.label ?? "Desconhecida"; }
export function overlap(a: string, b: string, c: string, d: string) { return new Date(a) < new Date(d) && new Date(b) > new Date(c); }
export function batteryFresh(e: Equipment, r: Resource, now: number) {
  return e.battery !== null && e.battery_observed_at !== null && r.battery_valid_hours > 0 && now - Date.parse(e.battery_observed_at) <= r.battery_valid_hours * 3600000;
}
export function operationallyReady(e: Equipment, r: Resource, now: number) {
  return r.enabled && e.enabled && e.condition === "operational" && e.state === "stored" && e.current_location_id !== null && batteryFresh(e,r,now) && r.accepted_battery.includes(e.battery ?? 0);
}
export function inventoryTotals(equipment: Equipment[]) {
  return { notebooks: equipment.filter(e => e.kind === "notebook").length, desktops: equipment.filter(e => e.kind === "desktop").length, total: equipment.length };
}
export function dateInSchool(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function schoolInstant(date: string, time: string) { return new Date(`${date}T${time}:00-03:00`).toISOString(); }
export function displayDate(value: string) { return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
export function shiftDay(date: string, days: number) { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0,10); }
export const snapshotOptions = (start: string, end: string) => queryOptions({
  queryKey: ["school-snapshot", start, end],
  queryFn: async (): Promise<Snapshot> => {
    const { data, error } = await supabase.rpc("school_snapshot", { p_start: start, p_end: end });
    if (error) throw new Error(error.message);
    if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.resources) || !Array.isArray(data.equipment)) throw new Error("Não foi possível consultar os recursos");
    return data as unknown as Snapshot;
  }, staleTime: 15000, refetchInterval: 30000,
});
export const privateOptions = (uid: string | undefined) => queryOptions({
  queryKey: ["school-private", uid ?? "visitor"],
  queryFn: async () => {
    if (!uid) return { admin: false, reservations: [] as Reservation[], movements: [] as Tables<"school_movements">[], legacyLoans: [] as Tables<"netbook_loans">[] };
    const [role, reservations, movements] = await Promise.all([
      supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
      supabase.from("school_reservations").select("*").order("starts_at", { ascending: false }),
      supabase.from("school_movements").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    if (role.error || reservations.error || movements.error) throw new Error(role.error?.message ?? reservations.error?.message ?? movements.error?.message);
    const legacy = role.data ? await supabase.from("netbook_loans").select("*").is("devolvido_at", null).is("school_reservation_id", null) : { data: [] };
    return { admin: role.data === true, reservations: reservations.data ?? [], movements: movements.data ?? [], legacyLoans: legacy.data ?? [] };
  }, staleTime: 10000,
});
export async function resourceAction(action: string, data: Record<string, Json | undefined>) {
  const result = await supabase.rpc("school_action", { p_action: action, p_data: data });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}