import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ImagePlus, X } from "lucide-react";

export const Route = createFileRoute("/chamados")({
  component: ChamadosPage,
});

type Chamado = {
  id: string;
  numero_serie: string;
  marca: string;
  estado: string;
  detalhes: string | null;
  possui_garantia: boolean;
  imagens: string[];
  created_at: string;
};

function ChamadosPage() {
  const [numeroSerie, setNumeroSerie] = useState("");
  const [marca, setMarca] = useState<"Positivo" | "Multilaser">("Positivo");
  const [estado, setEstado] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [garantia, setGarantia] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [chamados, setChamados] = useState<Chamado[]>([]);

  const fetchChamados = async () => {
    const { data } = await supabase
      .from("chamados")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setChamados(data as Chamado[]);
  };

  useEffect(() => {
    fetchChamados();
  }, []);

  const onFiles = (fl: FileList | null) => {
    if (!fl) return;
    const arr = Array.from(fl);
    setFiles((prev) => [...prev, ...arr]);
    setPreviews((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (idx: number) => {
    setFiles((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroSerie.trim() || !estado.trim()) return;
    setLoading(true);

    const urls: string[] = [];
    for (const file of files) {
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage
        .from("chamados")
        .upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("chamados").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }

    const { error } = await supabase.from("chamados").insert({
      numero_serie: numeroSerie.trim(),
      marca,
      estado: estado.trim(),
      detalhes: detalhes.trim() || null,
      possui_garantia: garantia,
      imagens: urls,
    });

    setLoading(false);
    if (!error) {
      setNumeroSerie("");
      setEstado("");
      setDetalhes("");
      setGarantia(false);
      setFiles([]);
      setPreviews([]);
      fetchChamados();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Chamados</h1>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-8 lg:grid-cols-2">
        <form onSubmit={submit} className="space-y-5 rounded-xl border bg-card p-6">
          <Field label="Número de série">
            <input
              value={numeroSerie}
              onChange={(e) => setNumeroSerie(e.target.value)}
              className="input"
              required
            />
          </Field>

          <div>
            <label className="mb-2 block text-sm font-medium">Marca</label>
            <div className="flex gap-2">
              {(["Positivo", "Multilaser"] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMarca(m)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
                    marca === m
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-foreground/30"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <Field label="Estado / Problema">
            <input
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="input"
              placeholder="Ex: Tela quebrada"
              required
            />
          </Field>

          <Field label="Detalhes do problema">
            <textarea
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Descreva o problema..."
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={garantia}
              onChange={(e) => setGarantia(e.target.checked)}
              className="h-4 w-4"
            />
            Possui garantia
          </label>

          <div>
            <label className="mb-2 block text-sm font-medium">Imagens do dano</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed py-6 text-sm text-muted-foreground hover:bg-accent">
              <ImagePlus className="h-5 w-5" />
              Adicionar fotos
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>
            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} className="h-20 w-full rounded-md object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Registrar chamado"}
          </button>
        </form>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Últimos chamados
          </h2>
          <div className="space-y-3">
            {chamados.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum chamado ainda.</p>
            )}
            {chamados.map((c) => (
              <div key={c.id} className="rounded-lg border bg-card p-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{c.estado}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.marca} · SN: {c.numero_serie}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      c.possui_garantia
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary"
                    }`}
                  >
                    {c.possui_garantia ? "Com garantia" : "Sem garantia"}
                  </span>
                </div>
                {c.detalhes && (
                  <p className="mt-2 text-xs text-muted-foreground">{c.detalhes}</p>
                )}
                {c.imagens.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    {c.imagens.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          className="h-14 w-14 rounded object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleString("pt-BR")}
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
