import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { ImagePlus, X, Pencil, Trash2, Save, XCircle, KanbanSquare } from "lucide-react";
import {
  logActivity,
  STATUS_OPTIONS,
  statusColor,
  statusLabel,
  type ChamadoStatus,
} from "@/lib/logger";

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
  status: string;
  created_at: string;
};

async function uploadFiles(files: File[]): Promise<string[]> {
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
  return urls;
}

function ChamadosPage() {
  const navigate = useNavigate();
  const [numeroSerie, setNumeroSerie] = useState("");
  const [marca, setMarca] = useState<"Positivo" | "Multilaser">("Positivo");
  const [estado, setEstado] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [garantia, setGarantia] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [showArchived, setShowArchived] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const criarTarefaDoChamado = async (c: Chamado) => {
    const title = `Reparar ${c.marca} SN ${c.numero_serie}`;
    const description = `Chamado: ${c.estado}${c.detalhes ? `\n\n${c.detalhes}` : ""}${
      c.possui_garantia ? "\n\n(Possui garantia)" : ""
    }`;
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title,
        description,
        status: "a_fazer",
        priority: c.possui_garantia ? "media" : "alta",
        chamado_id: c.id,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Não foi possível criar a tarefa");
      return;
    }
    await logActivity({
      action: "criar",
      entity: "tarefa",
      entity_id: data.id,
      description: `Tarefa criada a partir do chamado SN ${c.numero_serie}`,
    });
    toast.success("Tarefa criada! Abrindo quadro...");
    navigate({ to: "/tarefas", search: { task: data.id } });
  };

  const fetchChamados = async () => {
    const { data } = await supabase
      .from("chamados")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
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
    if (!numeroSerie.trim() || !estado.trim()) {
      toast.error("Preencha número de série e estado");
      return;
    }
    setLoading(true);
    const urls = await uploadFiles(files);

    const { data, error } = await supabase
      .from("chamados")
      .insert({
        numero_serie: numeroSerie.trim(),
        marca,
        estado: estado.trim(),
        detalhes: detalhes.trim() || null,
        possui_garantia: garantia,
        imagens: urls,
      })
      .select()
      .single();

    setLoading(false);
    if (error) {
      toast.error("Erro ao registrar chamado");
      return;
    }
    await logActivity({
      action: "criar",
      entity: "chamado",
      entity_id: data?.id,
      description: `Novo chamado: ${marca} SN ${numeroSerie.trim()} — ${estado.trim()}`,
      metadata: { marca, numero_serie: numeroSerie.trim(), garantia },
    });
    toast.success("Chamado registrado");
    setNumeroSerie("");
    setEstado("");
    setDetalhes("");
    setGarantia(false);
    setFiles([]);
    setPreviews([]);
    fetchChamados();
  };

  const changeStatus = async (c: Chamado, status: ChamadoStatus) => {
    if (c.status === status) return;
    const { error } = await supabase
      .from("chamados")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", c.id);
    if (error) return toast.error("Erro ao alterar status");
    await logActivity({
      action: "status",
      entity: "chamado",
      entity_id: c.id,
      description: `SN ${c.numero_serie}: ${statusLabel(c.status)} → ${statusLabel(status)}`,
      metadata: { de: c.status, para: status },
    });
    toast.success(`Status: ${statusLabel(status)}`);
    fetchChamados();
  };

  const deleteChamado = async (c: Chamado) => {
    if (!confirm(`Excluir chamado SN ${c.numero_serie}? Esta ação é definitiva.`))
      return;
    const { error } = await supabase.from("chamados").delete().eq("id", c.id);
    if (error) return toast.error("Erro ao excluir");
    await logActivity({
      action: "excluir",
      entity: "chamado",
      entity_id: c.id,
      description: `Chamado excluído: ${c.marca} SN ${c.numero_serie} — ${c.estado}`,
    });
    toast.success("Chamado excluído");
    fetchChamados();
  };

  return (
    <AppShell>
      <h1 className="mb-5 text-xl font-semibold sm:text-2xl">Chamados</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={submit}
          className="space-y-5 rounded-xl border bg-card p-4 sm:p-6"
          aria-label="Formulário de novo chamado"
        >
          <Field label="Número de série" htmlFor="ns">
            <input
              id="ns"
              value={numeroSerie}
              onChange={(e) => setNumeroSerie(e.target.value)}
              className="input"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              required
            />
          </Field>

          <fieldset>
            <legend className="mb-2 block text-sm font-medium">Marca</legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {(["Positivo", "Multilaser"] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  role="radio"
                  aria-checked={marca === m}
                  onClick={() => setMarca(m)}
                  className={`min-h-11 rounded-md border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    marca === m
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-foreground/30"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </fieldset>

          <Field label="Estado / Problema" htmlFor="estado">
            <input
              id="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="input"
              placeholder="Ex: Tela quebrada"
              required
            />
          </Field>

          <Field label="Detalhes do problema" htmlFor="detalhes">
            <textarea
              id="detalhes"
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              className="input min-h-[96px]"
              placeholder="Descreva o problema..."
            />
          </Field>

          <label className="flex items-center gap-3 text-sm min-h-11">
            <input
              type="checkbox"
              checked={garantia}
              onChange={(e) => setGarantia(e.target.checked)}
              className="h-5 w-5"
            />
            Possui garantia
          </label>

          <div>
            <span className="mb-2 block text-sm font-medium">
              Imagens do dano
            </span>
            <label className="flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed py-6 text-sm text-muted-foreground hover:bg-accent focus-within:ring-2 focus-within:ring-ring">
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
              Tirar foto ou escolher
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="sr-only"
                onChange={(e) => onFiles(e.target.files)}
                aria-label="Adicionar fotos do dano"
              />
            </label>
            {previews.length > 0 && (
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <li key={i} className="relative">
                    <img
                      src={src}
                      alt={`Pré-visualização ${i + 1}`}
                      className="h-24 w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label={`Remover imagem ${i + 1}`}
                      className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {loading ? "Enviando..." : "Registrar chamado"}
          </button>
        </form>

        <section aria-label="Chamados">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Chamados ({chamados.length})
            </h2>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="h-4 w-4"
              />
              Mostrar resolvidos
            </label>
          </div>
          <ul className="space-y-3">
            {chamados.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum chamado ainda.
              </p>
            )}
            {chamados
              .filter((c) => showArchived || c.status !== "resolvido")
              .map((c) =>
                editingId === c.id ? (
                  <EditCard
                    key={c.id}
                    chamado={c}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => {
                      setEditingId(null);
                      fetchChamados();
                    }}
                  />
                ) : (
                  <ChamadoCard
                    key={c.id}
                    chamado={c}
                    onEdit={() => setEditingId(c.id)}
                    onDelete={() => deleteChamado(c)}
                    onStatus={(s) => changeStatus(c, s)}
                    onCreateTask={() => criarTarefaDoChamado(c)}
                  />
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

function ChamadoCard({
  chamado: c,
  onEdit,
  onDelete,
  onStatus,
  onCreateTask,
}: {
  chamado: Chamado;
  onEdit: () => void;
  onDelete: () => void;
  onStatus: (s: ChamadoStatus) => void;
  onCreateTask: () => void;
}) {
  const archived = c.status === "resolvido";
  return (
    <li
      className={`rounded-lg border bg-card p-4 text-sm transition ${archived ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium">{c.estado}</div>
          <div className="text-xs text-muted-foreground">
            {c.marca} · SN: {c.numero_serie}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusColor(c.status)}`}
          >
            {statusLabel(c.status)}
          </span>
          {c.possui_garantia && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
              Garantia
            </span>
          )}
        </div>
      </div>

      {c.detalhes && (
        <p className="mt-2 text-xs text-muted-foreground">{c.detalhes}</p>
      )}

      {c.imagens.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {c.imagens.map((url, i) => (
            <li key={i}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <img
                  src={url}
                  alt={`Foto ${i + 1} do dano`}
                  loading="lazy"
                  className="h-16 w-16 rounded object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => onStatus(o.value)}
            aria-pressed={c.status === o.value}
            className={`min-h-9 rounded-full border px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              c.status === o.value
                ? `${o.color} border-transparent font-medium`
                : "hover:bg-accent"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {new Date(c.created_at).toLocaleString("pt-BR")}
        </span>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            aria-label="Editar chamado"
            className="inline-flex min-h-9 items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            onClick={onDelete}
            aria-label="Excluir chamado"
            className="inline-flex min-h-9 items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </button>
        </div>
      </div>
    </li>
  );
}

function EditCard({
  chamado,
  onCancel,
  onSaved,
}: {
  chamado: Chamado;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [numeroSerie, setNumeroSerie] = useState(chamado.numero_serie);
  const [marca, setMarca] = useState<string>(chamado.marca);
  const [estado, setEstado] = useState(chamado.estado);
  const [detalhes, setDetalhes] = useState(chamado.detalhes ?? "");
  const [garantia, setGarantia] = useState(chamado.possui_garantia);
  const [imagens, setImagens] = useState<string[]>(chamado.imagens);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    const arr = Array.from(fl);
    setNewFiles((p) => [...p, ...arr]);
    setNewPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const save = async () => {
    setSaving(true);
    const uploaded = await uploadFiles(newFiles);
    const finalImgs = [...imagens, ...uploaded];
    const { error } = await supabase
      .from("chamados")
      .update({
        numero_serie: numeroSerie.trim(),
        marca,
        estado: estado.trim(),
        detalhes: detalhes.trim() || null,
        possui_garantia: garantia,
        imagens: finalImgs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chamado.id);
    setSaving(false);
    if (error) return toast.error("Erro ao salvar");
    await logActivity({
      action: "editar",
      entity: "chamado",
      entity_id: chamado.id,
      description: `Chamado editado: SN ${numeroSerie.trim()}`,
      metadata: { antes: chamado, novas_imagens: uploaded.length },
    });
    toast.success("Chamado atualizado");
    onSaved();
  };

  return (
    <li className="space-y-3 rounded-lg border-2 border-primary/40 bg-card p-4 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={numeroSerie}
          onChange={(e) => setNumeroSerie(e.target.value)}
          className="input"
          placeholder="Número de série"
        />
        <select
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          className="input"
        >
          <option>Positivo</option>
          <option>Multilaser</option>
        </select>
      </div>
      <input
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
        className="input"
        placeholder="Estado/Problema"
      />
      <textarea
        value={detalhes}
        onChange={(e) => setDetalhes(e.target.value)}
        className="input min-h-[80px]"
        placeholder="Detalhes"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={garantia}
          onChange={(e) => setGarantia(e.target.checked)}
          className="h-5 w-5"
        />
        Possui garantia
      </label>

      {imagens.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {imagens.map((url, i) => (
            <li key={url} className="relative">
              <img
                src={url}
                alt=""
                className="h-20 w-full rounded object-cover"
              />
              <button
                type="button"
                onClick={() => setImagens((p) => p.filter((_, j) => j !== i))}
                aria-label="Remover imagem"
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {newPreviews.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {newPreviews.map((src, i) => (
            <li key={i} className="relative">
              <img
                src={src}
                alt=""
                className="h-20 w-full rounded object-cover ring-2 ring-primary/40"
              />
              <button
                type="button"
                onClick={() => {
                  setNewFiles((p) => p.filter((_, j) => j !== i));
                  setNewPreviews((p) => p.filter((_, j) => j !== i));
                }}
                aria-label="Remover nova imagem"
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed py-2 text-xs text-muted-foreground hover:bg-accent">
        <ImagePlus className="h-4 w-4" />
        Adicionar imagens
        <input
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
      </label>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex flex-1 min-h-10 items-center justify-center gap-1 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
        </button>
        <button
          onClick={onCancel}
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-md border px-3 text-sm hover:bg-accent"
        >
          <XCircle className="h-4 w-4" /> Cancelar
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
