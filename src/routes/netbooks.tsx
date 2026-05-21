import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { Check, Minus, Plus } from "lucide-react";
import { logActivity } from "@/lib/logger";

export const Route = createFileRoute("/netbooks")({
  component: NetbooksPage,
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

function NetbooksPage() {
  const [tipo, setTipo] = useState<"professor" | "aluno">("professor");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [sala, setSala] = useState("");
  const [qtdPositivo, setQtdPositivo] = useState(0);
  const [qtdMultilaser, setQtdMultilaser] = useState(0);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLoans = async () => {
    const { data } = await supabase
      .from("netbook_loans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setLoans(data as Loan[]);
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !sala.trim()) {
      toast.error("Preencha nome e sala");
      return;
    }
    if (tipo === "aluno" && !sobrenome.trim()) {
      toast.error("Informe o sobrenome do aluno");
      return;
    }
    if (qtdPositivo + qtdMultilaser === 0) {
      toast.error("Informe ao menos 1 aparelho");
      return;
    }

    setLoading(true);
    const nomeCompleto =
      tipo === "aluno" ? `${nome.trim()} ${sobrenome.trim()}` : nome.trim();
    const { data, error } = await supabase
      .from("netbook_loans")
      .insert({
        tipo_usuario: tipo,
        nome: nomeCompleto,
        sala: sala.trim(),
        qtd_positivo: qtdPositivo,
        qtd_multilaser: qtdMultilaser,
      })
      .select()
      .single();
    setLoading(false);
    if (error) {
      toast.error("Erro ao registrar retirada");
      return;
    }
    await logActivity({
      action: "retirar",
      entity: "retirada",
      entity_id: data?.id,
      description: `${nomeCompleto} (${tipo}) retirou ${qtdPositivo} Positivo + ${qtdMultilaser} Multilaser para Sala ${sala.trim()}`,
      metadata: { tipo, sala: sala.trim(), qtdPositivo, qtdMultilaser },
    });
    toast.success("Retirada registrada");
    setNome("");
    setSobrenome("");
    setSala("");
    setQtdPositivo(0);
    setQtdMultilaser(0);
    fetchLoans();
  };

  const marcarDevolvido = async (l: Loan) => {
    const { error } = await supabase
      .from("netbook_loans")
      .update({ devolvido_at: new Date().toISOString() })
      .eq("id", l.id);
    if (error) toast.error("Não foi possível marcar devolução");
    else {
      await logActivity({
        action: "devolver",
        entity: "retirada",
        entity_id: l.id,
        description: `Devolução: ${l.nome} (${l.qtd_positivo}P + ${l.qtd_multilaser}M da Sala ${l.sala})`,
      });
      toast.success("Devolução registrada");
    }
    fetchLoans();
  };

  return (
    <AppShell>
      <h1 className="mb-5 text-xl font-semibold sm:text-2xl">
        Retirada de Netbooks
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={submit}
          className="space-y-5 rounded-xl border bg-card p-4 sm:p-6"
          aria-label="Formulário de retirada"
        >
          <fieldset>
            <legend className="mb-2 block text-sm font-medium">Tipo</legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {(["professor", "aluno"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  role="radio"
                  aria-checked={tipo === t}
                  onClick={() => setTipo(t)}
                  className={`min-h-11 rounded-md border px-3 py-2 text-sm capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    tipo === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-foreground/30"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>

          {tipo === "professor" ? (
            <Field label="Primeiro nome" htmlFor="nome">
              <input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input"
                placeholder="Ex: Carlos"
                autoComplete="given-name"
                autoCapitalize="words"
                required
              />
            </Field>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Nome" htmlFor="aluno-nome">
                <input
                  id="aluno-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  required
                />
              </Field>
              <Field label="Sobrenome" htmlFor="aluno-sobrenome">
                <input
                  id="aluno-sobrenome"
                  value={sobrenome}
                  onChange={(e) => setSobrenome(e.target.value)}
                  className="input"
                  autoComplete="family-name"
                  autoCapitalize="words"
                  required
                />
              </Field>
            </div>
          )}

          <Field label="Sala de destino" htmlFor="sala">
            <input
              id="sala"
              value={sala}
              onChange={(e) => setSala(e.target.value)}
              className="input"
              placeholder="Ex: Sala 12"
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Stepper
              label="Positivo"
              value={qtdPositivo}
              onChange={setQtdPositivo}
            />
            <Stepper
              label="Multilaser"
              value={qtdMultilaser}
              onChange={setQtdMultilaser}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {loading ? "Registrando..." : "Registrar retirada"}
          </button>
        </form>

        <section aria-label="Últimas retiradas">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Últimas retiradas
          </h2>
          <ul className="space-y-2">
            {loans.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum registro ainda.
              </p>
            )}
            {loans.map((l) => (
              <li key={l.id} className="rounded-lg border bg-card p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {l.nome}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({l.tipo_usuario})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Sala {l.sala} · Positivo {l.qtd_positivo} · Multilaser{" "}
                      {l.qtd_multilaser}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
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
                      aria-label={`Marcar ${l.nome} como devolvido`}
                      className="flex shrink-0 items-center gap-1 rounded-md border px-3 py-2 text-xs min-h-9 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Check className="h-3 w-3" aria-hidden="true" /> Devolver
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.625rem 0.75rem;
          font-size: 1rem;
          min-height: 2.75rem;
          outline: none;
        }
        .input:focus { border-color: var(--ring); box-shadow: 0 0 0 2px var(--ring); }
      `}</style>
    </AppShell>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className="flex items-stretch overflow-hidden rounded-lg border">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Diminuir ${label}`}
          className="flex h-11 w-11 items-center justify-center hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full border-x bg-background text-center text-base font-medium focus:outline-none"
          aria-label={`Quantidade ${label}`}
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Aumentar ${label}`}
          className="flex h-11 w-11 items-center justify-center hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
