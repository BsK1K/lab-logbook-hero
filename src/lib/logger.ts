import { supabase } from "@/integrations/supabase/client";

export type LogAction =
  | "criar"
  | "editar"
  | "excluir"
  | "status"
  | "devolver"
  | "retirar"
  | "comentar"
  | "mover";

export type LogEntity = "chamado" | "retirada" | "tarefa" | "nota" | "comentario";

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
      metadata: (params.metadata ?? {}) as never,
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
  comentar: "Comentário",
  mover: "Movimentação",
};

export const ACTION_DESCRIPTIONS: Record<LogAction, string> = {
  criar: "Um novo registro foi adicionado ao sistema.",
  editar: "Informações de um registro existente foram alteradas.",
  excluir: "Um registro foi removido permanentemente do sistema.",
  status: "O status de um chamado foi alterado.",
  devolver: "Aparelhos retirados foram marcados como devolvidos.",
  retirar: "Aparelhos foram retirados para uma sala.",
  comentar: "Um comentário foi adicionado a uma tarefa.",
  mover: "Uma tarefa foi movida entre colunas do quadro.",
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

// ---------- Tasks (Kanban) ----------
export const TASK_COLUMNS = [
  { value: "a_fazer", label: "A fazer", color: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
  { value: "fazendo", label: "Fazendo", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  { value: "revisao", label: "Em revisão", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  { value: "concluido", label: "Concluído", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
] as const;

export type TaskStatus = (typeof TASK_COLUMNS)[number]["value"];

export const TASK_PRIORITIES = [
  { value: "baixa", label: "Baixa", color: "bg-muted text-muted-foreground" },
  { value: "media", label: "Média", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  { value: "alta", label: "Alta", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  { value: "urgente", label: "Urgente", color: "bg-destructive/15 text-destructive" },
] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number]["value"];

export function taskColumnLabel(s: string) {
  return TASK_COLUMNS.find((o) => o.value === s)?.label ?? s;
}
export function taskColumnColor(s: string) {
  return TASK_COLUMNS.find((o) => o.value === s)?.color ?? "bg-secondary";
}
export function priorityLabel(s: string) {
  return TASK_PRIORITIES.find((o) => o.value === s)?.label ?? s;
}
export function priorityColor(s: string) {
  return TASK_PRIORITIES.find((o) => o.value === s)?.color ?? "bg-muted";
}
