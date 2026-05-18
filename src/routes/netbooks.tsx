import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check } from "lucide-react";

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
    if (!nome.trim() || !sala.trim()) return;
    if (tipo === "aluno" && !sobrenome.trim()) return;
    if (qtdPositivo + qtdMultilaser === 0) return;

    setLoading(true);
    const nomeCompleto =
      tipo === "aluno" ? `${nome.trim()} ${sobrenome.trim()}` : nome.trim();
    const { error } = await supabase.from("netbook_loans").insert({
      tipo_usuario: tipo,
      nome: nomeCompleto,
      sala: sala.trim(),
      qtd_positivo: qtdPositivo,
      qtd_multilaser: qtdMultilaser,
    });
    setLoading(false);
    if (!error) {
      setNome("");
      setSobrenome("");
      setSala("");
      setQtdPositivo(0);
      setQtdMultilaser(0);
      fetchLoans();
    }
  };

  const marcarDevolvido = async (id: string) => {
    await supabase
      .from("netbook_loans")
      .update({ devolvido_at: new Date().toISOString() })
      .eq("id", id);
    fetchLoans();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Retirada de Netbooks</h1>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-8 lg:grid-cols-2">
        <form
          onSubmit={submit}
          className="space-y-5 rounded-xl border bg-card p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Tipo</label>
            <div className="flex gap-2">
              {(["professor", "aluno"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize transition ${
                    tipo === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-foreground/30"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {tipo === "professor" ? (
            <Field label="Primeiro nome">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input"
                placeholder="Ex: Carlos"
                required
              />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome">
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input"
                  required
                />
              </Field>
              <Field label="Sobrenome">
                <input
                  value={sobrenome}
                  onChange={(e) => setSobrenome(e.target.value)}
                  className="input"
                  required
                />
              </Field>
            </div>
          )}

          <Field label="Sala de destino">
            <input
              value={sala}
              onChange={(e) => setSala(e.target.value)}
              className="input"
              placeholder="Ex: Sala 12"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Positivo">
              <input
                type="number"
                min={0}
                value={qtdPositivo}
                onChange={(e) => setQtdPositivo(Number(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Multilaser">
              <input
                type="number"
                min={0}
                value={qtdMultilaser}
                onChange={(e) => setQtdMultilaser(Number(e.target.value))}
                className="input"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Registrar retirada"}
          </button>
        </form>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Últimas retiradas
          </h2>
          <div className="space-y-2">
            {loans.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
            )}
            {loans.map((l) => (
              <div
                key={l.id}
                className="rounded-lg border bg-card p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
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
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                      Devolvido
                    </span>
                  ) : (
                    <button
                      onClick={() => marcarDevolvido(l.id)}
                      className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                    >
                      <Check className="h-3 w-3" /> Devolver
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: var(--ring); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
