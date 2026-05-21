import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { logActivity, statusColor, statusLabel } from "@/lib/logger";
import {
  Laptop,
  Wrench,
  Users,
  PackageCheck,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Check,
  History,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Loan = {
  id: string;
  tipo_usuario: string;
  nome: string;
  sala: string;
  qtd_positivo: number;
  qtd_multilaser: number;
  retirada_at: string;
  devolvido_at: string | null;
};

type Chamado = {
  id: string;
  numero_serie: string;
  marca: string;
  estado: string;
  possui_garantia: boolean;
  imagens: string[];
  status: string;
  created_at: string;
};

function Index() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [{ data: l }, { data: c }] = await Promise.all([
      supabase
        .from("netbook_loans")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("chamados")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    if (l) setLoans(l as Loan[]);
    if (c) setChamados(c as Chamado[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const marcarDevolvido = async (loan: Loan) => {
    const { error } = await supabase
      .from("netbook_loans")
      .update({ devolvido_at: new Date().toISOString() })
      .eq("id", loan.id);
    if (error) toast.error("Não foi possível marcar como devolvido");
    else {
      await logActivity({
        action: "devolver",
        entity: "retirada",
        entity_id: loan.id,
        description: `Devolução: ${loan.nome} (${loan.qtd_positivo}P + ${loan.qtd_multilaser}M da Sala ${loan.sala})`,
      });
      toast.success("Devolução registrada");
    }
    fetchAll();
  };

  const totalPositivo = loans.reduce((s, l) => s + l.qtd_positivo, 0);
  const totalMultilaser = loans.reduce((s, l) => s + l.qtd_multilaser, 0);
  const emUso = loans.filter((l) => !l.devolvido_at);
  const aparelhosEmUso = emUso.reduce(
    (s, l) => s + l.qtd_positivo + l.qtd_multilaser,
    0,
  );
  const totalChamados = chamados.length;
  const chamadosAbertos = chamados.filter(
    (c) => c.status !== "resolvido",
  ).length;
  const comGarantia = chamados.filter((c) => c.possui_garantia).length;

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Controle de netbooks e chamados
        </p>
      </div>

      {/* Stats */}
      <section
        aria-label="Indicadores"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <StatCard
          icon={<PackageCheck className="h-5 w-5" />}
          label="Em uso"
          value={aparelhosEmUso}
          hint={`${emUso.length} retiradas ativas`}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Retiradas"
          value={loans.length}
          hint={`${totalPositivo} P · ${totalMultilaser} M`}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Chamados abertos"
          value={chamadosAbertos}
          hint={`${totalChamados} no total`}
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Com garantia"
          value={comGarantia}
          hint={`${totalChamados - comGarantia} sem garantia`}
        />
      </section>

      {/* Quick actions */}
      <section
        aria-label="Ações rápidas"
        className="mt-6 grid gap-3 sm:grid-cols-3"
      >
        <ActionCard
          to="/netbooks"
          icon={<Laptop className="h-6 w-6" />}
          title="Nova retirada"
          desc="Registrar netbooks emprestados"
        />
        <ActionCard
          to="/chamados"
          icon={<Wrench className="h-6 w-6" />}
          title="Novo chamado"
          desc="Registrar aparelho danificado"
        />
        <ActionCard
          to="/logs"
          icon={<History className="h-6 w-6" />}
          title="Logs"
          desc="Histórico de ações"
        />
      </section>

      {/* Lists */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Retiradas recentes
            </h2>
            <Link
              to="/netbooks"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ver tudo <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <ul className="space-y-2">
            {loading && (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            )}
            {!loading && loans.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma retirada registrada.
              </p>
            )}
            {loans.slice(0, 6).map((l) => (
              <li
                key={l.id}
                className="rounded-lg border bg-card p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {l.nome}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({l.tipo_usuario})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Sala {l.sala} · P {l.qtd_positivo} · M {l.qtd_multilaser}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(l.retirada_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  {l.devolvido_at ? (
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs">
                      Devolvido
                    </span>
                  ) : (
                    <button
                      onClick={() => marcarDevolvido(l)}
                      aria-label={`Marcar retirada de ${l.nome} como devolvida`}
                      className="flex shrink-0 items-center gap-1 rounded-md border px-3 py-2 text-xs min-h-9 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Check className="h-3 w-3" aria-hidden="true" /> Devolver
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Chamados recentes
            </h2>
            <Link
              to="/chamados"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ver tudo <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <ul className="space-y-2">
            {loading && (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            )}
            {!loading && chamados.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum chamado registrado.
              </p>
            )}
            {chamados.slice(0, 6).map((c) => (
              <li
                key={c.id}
                className={`rounded-lg border bg-card p-3 text-sm transition ${c.status === "resolvido" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.estado}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.marca} · SN: {c.numero_serie}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusColor(c.status)}`}
                  >
                    {statusLabel(c.status)}
                  </span>
                </div>
                {c.imagens.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    {c.imagens.slice(0, 4).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Foto do dano ${i + 1} do chamado ${c.numero_serie}`}
                        loading="lazy"
                        className="h-10 w-10 rounded object-cover"
                      />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide sm:text-xs">
          {label}
        </span>
      </div>
      <div className="mt-1 text-2xl font-semibold sm:mt-2 sm:text-3xl">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function ActionCard({
  to,
  icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group flex min-h-16 items-center gap-4 rounded-xl border bg-card p-4 transition hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
    >
      <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
      <ArrowRight
        className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  );
}
