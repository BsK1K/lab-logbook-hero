import { supabase } from "@/integrations/supabase/client";

export type LogAction =
  | "criar"
  | "editar"
  | "excluir"
  | "status"
  | "devolver"
  | "retirar";

export type LogEntity = "chamado" | "retirada";

export async function logActivity(params: {
  action: LogAction;
  entity: LogEntity;
  entity_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabase.from("activity_logs").insert({
      action: params.action,
      entity: params.entity,
      entity_id: params.entity_id ?? null,
      description: params.description,
      metadata: params.metadata ?? {},
    });
  } catch (e) {
    console.error("[logger] falha ao salvar log", e);
  }
}

export const ACTION_LABELS: Record<LogAction, string> = {
  criar: "Criação",
  editar: "Edição",
  excluir: "Exclusão",
  status: "Alteração de status",
  devolver: "Devolução",
  retirar: "Retirada",
};

export const ACTION_DESCRIPTIONS: Record<LogAction, string> = {
  criar: "Um novo registro foi adicionado ao sistema.",
  editar: "Informações de um registro existente foram alteradas.",
  excluir: "Um registro foi removido permanentemente do sistema.",
  status: "O status de um chamado foi alterado.",
  devolver: "Aparelhos retirados foram marcados como devolvidos.",
  retirar: "Aparelhos foram retirados para uma sala.",
};

export const STATUS_OPTIONS = [
  { value: "aberto", label: "Aberto", color: "bg-secondary text-foreground" },
  {
    value: "aguardando",
    label: "Aguardando garantia/técnico",
    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  {
    value: "resolvido",
    label: "Resolvido",
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  {
    value: "sem_solucao",
    label: "Sem solução",
    color: "bg-destructive/15 text-destructive",
  },
] as const;

export type ChamadoStatus = (typeof STATUS_OPTIONS)[number]["value"];

export function statusLabel(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}
export function statusColor(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.color ?? "bg-secondary";
}
