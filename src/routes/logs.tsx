import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ACTION_DESCRIPTIONS, ACTION_LABELS, type LogAction } from "@/lib/logger";
import {
  History,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  PackageCheck,
  PackageOpen,
} from "lucide-react";

export const Route = createFileRoute("/logs")({ component: LogsPage });

type Log = {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  criar: Plus,
  editar: Pencil,
  excluir: Trash2,
  status: RefreshCw,
  devolver: PackageCheck,
  retirar: PackageOpen,
};

const COLORS: Record<string, string> = {
  criar: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  editar: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  excluir: "bg-destructive/15 text-destructive",
  status: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  devolver: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  retirar: "bg-primary/15 text-primary",
};

function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | LogAction>("todos");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!cancelled && data) setLogs(data as Log[]);
      if (!cancelled) setLoading(false);
    })();

    // Realtime: novos logs aparecem sem refresh
    const channel = supabase
      .channel("activity_logs_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        (payload) => {
          setLogs((prev) => [payload.new as Log, ...prev].slice(0, 500));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered =
    filter === "todos" ? logs : logs.filter((l) => l.action === filter);

  return (
    <AppShell>
      <div className="mb-5 flex items-start gap-3">
        <span className="rounded-md bg-primary/10 p-2 text-primary">
          <History className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">
            Logs de atividade
          </h1>
          <p className="text-sm text-muted-foreground">
            Histórico de todas as ações registradas no sistema.
          </p>
        </div>
      </div>

      {/* Legenda */}
      <details className="mb-4 rounded-lg border bg-card p-3 text-sm">
        <summary className="cursor-pointer font-medium">
          O que cada ação significa?
        </summary>
        <ul className="mt-3 space-y-2">
          {(Object.keys(ACTION_LABELS) as LogAction[]).map((a) => {
            const Icon = ICONS[a];
            return (
              <li key={a} className="flex items-start gap-2">
                <span
                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded ${COLORS[a]}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <span className="font-medium">{ACTION_LABELS[a]}:</span>{" "}
                  <span className="text-muted-foreground">
                    {ACTION_DESCRIPTIONS[a]}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </details>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["todos", ...Object.keys(ACTION_LABELS)] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`min-h-9 rounded-full border px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            {f === "todos"
              ? "Todos"
              : ACTION_LABELS[f as LogAction]}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Carregando logs...</p>
      )}
      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum log para esta seleção.
        </p>
      )}

      <ol className="space-y-2">
        {filtered.map((l) => {
          const Icon = ICONS[l.action] ?? History;
          return (
            <li
              key={l.id}
              className="flex items-start gap-3 rounded-lg border bg-card p-3 text-sm"
            >
              <span
                className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${COLORS[l.action] ?? "bg-secondary"}`}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {ACTION_LABELS[l.action as LogAction] ?? l.action}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    {l.entity}
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground">{l.description}</p>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString("pt-BR")}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </AppShell>
  );
}
