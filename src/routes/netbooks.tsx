import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { Check, Minus, Pencil, Plus, Trash2, X, GraduationCap, Users, Zap } from "lucide-react";
import { logActivity } from "@/lib/logger";

export const Route = createFileRoute("/netbooks")({
  component: NetbooksPage,
});

type Categoria = "geral" | "tecnico";

type Loan = {
  id: string;
  tipo_usuario: string;
  nome: string;
  sala: string;
  qtd_positivo: number;
  qtd_multilaser: number;
  retirada_at: string;
  devolvido_at: string | null;
  categoria: Categoria;
};

const CATEGORIA_LABEL: Record<Categoria, string> = {
  geral: "Geral",
  tecnico: "Curso Técnico",
};

function NetbooksPage() {
  const [tipo, setTipo] = useState<"professor" | "aluno">("professor");
  const [categoria, setCategoria] = useState<Categoria>("geral");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [sala, setSala] = useState("");
  const [qtdPositivo, setQtdPositivo] = useState(0);
  const [qtdMultilaser, setQtdMultilaser] = useState(0);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | Categoria>("todos");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchLoans = async () => {
    const { data } = await supabase
      .from("netbook_loans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
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
        categoria,
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
      description: `[${CATEGORIA_LABEL[categoria]}] ${nomeCompleto} (${tipo}) retirou ${qtdPositivo} Positivo + ${qtdMultilaser} Multilaser para Sala ${sala.trim()}`,
      metadata: { tipo, sala: sala.trim(), qtdPositivo, qtdMultilaser, categoria },
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

  const excluir = async (l: Loan) => {
    if (!confirm(`Excluir retirada de ${l.nome}? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("netbook_loans").delete().eq("id", l.id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    await logActivity({
      action: "excluir",
      entity: "retirada",
      entity_id: l.id,
      description: `Retirada excluída: ${l.nome} (Sala ${l.sala})`,
    });
    toast.success("Retirada excluída");
    fetchLoans();
  };

  const filtered = useMemo(
    () => loans.filter((l) => filtro === "todos" || l.categoria === filtro),
    [loans, filtro],
  );

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
            <legend className="mb-2 block text-sm font-medium">Categoria</legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              <button
                type="button"
                role="radio"
                aria-checked={categoria === "geral"}
                onClick={() => setCategoria("geral")}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  categoria === "geral"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:border-foreground/30"
                }`}
              >
                <Users className="h-4 w-4" aria-hidden="true" /> Geral
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={categoria === "tecnico"}
                onClick={() => setCategoria("tecnico")}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  categoria === "tecnico"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:border-foreground/30"
                }`}
              >
                <GraduationCap className="h-4 w-4" aria-hidden="true" /> Curso Técnico
              </button>
            </div>
            {categoria === "tecnico" && (
              <p className="mt-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                Esta retirada será separada como netbooks do <strong>Curso Técnico</strong>.
              </p>
            )}
          </fieldset>

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
            <Stepper label="Positivo" value={qtdPositivo} onChange={setQtdPositivo} />
            <Stepper label="Multilaser" value={qtdMultilaser} onChange={setQtdMultilaser} />
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Últimas retiradas
            </h2>
            <div className="flex gap-1 rounded-md border p-0.5 text-xs">
              {(["todos", "geral", "tecnico"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltro(f)}
                  className={`rounded px-2 py-1 transition ${
                    filtro === f
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {f === "todos" ? "Todos" : CATEGORIA_LABEL[f]}
                </button>
              ))}
            </div>
          </div>

          <ul className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum registro.</p>
            )}
            {filtered.map((l) =>
              editingId === l.id ? (
                <EditLoanCard
                  key={l.id}
                  loan={l}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    fetchLoans();
                  }}
                />
              ) : (
                <li
                  key={l.id}
                  className={`rounded-lg border bg-card p-3 text-sm ${l.devolvido_at ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{l.nome}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          ({l.tipo_usuario})
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            l.categoria === "tecnico"
                              ? "bg-primary/15 text-primary"
                              : "bg-secondary text-foreground"
                          }`}
                        >
                          {CATEGORIA_LABEL[l.categoria]}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Sala {l.sala} · Positivo {l.qtd_positivo} · Multilaser{" "}
                        {l.qtd_multilaser}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(l.retirada_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {l.devolvido_at ? (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-center text-xs">
                          Devolvido
                        </span>
                      ) : (
                        <button
                          onClick={() => marcarDevolvido(l)}
                          aria-label={`Marcar ${l.nome} como devolvido`}
                          className="flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs min-h-9 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Check className="h-3 w-3" aria-hidden="true" /> Devolver
                        </button>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingId(l.id)}
                          aria-label={`Editar retirada de ${l.nome}`}
                          className="flex flex-1 items-center justify-center rounded-md border px-2 py-1.5 text-xs min-h-9 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => excluir(l)}
                          aria-label={`Excluir retirada de ${l.nome}`}
                          className="flex flex-1 items-center justify-center rounded-md border border-destructive/30 px-2 py-1.5 text-xs text-destructive min-h-9 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ),
            )}
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

function EditLoanCard({
  loan,
  onCancel,
  onSaved,
}: {
  loan: Loan;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(loan.nome);
  const [sala, setSala] = useState(loan.sala);
  const [categoria, setCategoria] = useState<Categoria>(loan.categoria);
  const [tipo, setTipo] = useState(loan.tipo_usuario);
  const [qtdPositivo, setQtdPositivo] = useState(loan.qtd_positivo);
  const [qtdMultilaser, setQtdMultilaser] = useState(loan.qtd_multilaser);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("netbook_loans")
      .update({
        nome: nome.trim(),
        sala: sala.trim(),
        categoria,
        tipo_usuario: tipo,
        qtd_positivo: qtdPositivo,
        qtd_multilaser: qtdMultilaser,
      })
      .eq("id", loan.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    await logActivity({
      action: "editar",
      entity: "retirada",
      entity_id: loan.id,
      description: `Retirada editada: ${nome.trim()} (Sala ${sala.trim()})`,
    });
    toast.success("Retirada atualizada");
    onSaved();
  };

  return (
    <li className="space-y-3 rounded-lg border-2 border-primary/40 bg-card p-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        {(["geral", "tecnico"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoria(c)}
            className={`min-h-9 rounded-md border px-2 py-1.5 text-xs transition ${
              categoria === c
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-foreground/30"
            }`}
          >
            {CATEGORIA_LABEL[c]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["professor", "aluno"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`min-h-9 rounded-md border px-2 py-1.5 text-xs capitalize transition ${
              tipo === t
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-foreground/30"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="input"
        placeholder="Nome"
      />
      <input
        value={sala}
        onChange={(e) => setSala(e.target.value)}
        className="input"
        placeholder="Sala"
      />
      <div className="grid grid-cols-2 gap-2">
        <Stepper label="Positivo" value={qtdPositivo} onChange={setQtdPositivo} />
        <Stepper label="Multilaser" value={qtdMultilaser} onChange={setQtdMultilaser} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 min-h-9"
        >
          <Check className="h-3 w-3" /> {saving ? "Salvando..." : "Salvar"}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 rounded-md border px-3 py-2 text-xs min-h-9 hover:bg-accent"
        >
          <X className="h-3 w-3" /> Cancelar
        </button>
      </div>
    </li>
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
