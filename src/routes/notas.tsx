import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { Plus, X, Pin, PinOff, Trash2, Pencil, Save, Tag } from "lucide-react";
import { logActivity } from "@/lib/logger";

export const Route = createFileRoute("/notas")({
  component: NotasPage,
});

type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

const COLORS = [
  { value: null, label: "Padrão", className: "bg-card" },
  { value: "yellow", label: "Amarelo", className: "bg-amber-100 dark:bg-amber-900/40" },
  { value: "green", label: "Verde", className: "bg-emerald-100 dark:bg-emerald-900/40" },
  { value: "blue", label: "Azul", className: "bg-blue-100 dark:bg-blue-900/40" },
  { value: "pink", label: "Rosa", className: "bg-pink-100 dark:bg-pink-900/40" },
  { value: "purple", label: "Roxo", className: "bg-purple-100 dark:bg-purple-900/40" },
] as const;

function colorClass(c: string | null) {
  return COLORS.find((x) => x.value === c)?.className ?? "bg-card";
}

function NotasPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    if (data) setNotes(data as Note[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [notes]);

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (activeTag && !n.tags.includes(activeTag)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !n.title.toLowerCase().includes(q) &&
          !n.content.toLowerCase().includes(q) &&
          !n.tags.some((t) => t.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [notes, search, activeTag]);

  const togglePin = async (n: Note) => {
    await supabase.from("notes").update({ pinned: !n.pinned }).eq("id", n.id);
    fetchNotes();
  };

  const deleteNote = async (n: Note) => {
    if (!confirm(`Excluir a nota "${n.title}"?`)) return;
    await supabase.from("notes").delete().eq("id", n.id);
    await logActivity({
      action: "excluir",
      entity: "nota",
      entity_id: n.id,
      description: `Nota excluída: "${n.title}"`,
    });
    fetchNotes();
    toast.success("Nota excluída");
  };

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Anotações</h1>
          <p className="text-sm text-muted-foreground">
            Páginas rápidas para documentar, lembrar e organizar.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 sm:w-64 rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Nova
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-2.5 py-1 text-xs border ${!activeTag ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
          >
            Todas
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(t === activeTag ? null : t)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border ${activeTag === t ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
            >
              <Tag className="h-3 w-3" /> {t}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma nota encontrada.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((n) => (
            <article
              key={n.id}
              className={`group relative flex flex-col rounded-xl border p-4 shadow-sm transition hover:shadow-md ${colorClass(n.color)}`}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight">{n.title}</h3>
                <button
                  onClick={() => togglePin(n)}
                  aria-label={n.pinned ? "Desafixar" : "Fixar"}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {n.pinned ? <Pin className="h-4 w-4 fill-current" /> : <PinOff className="h-4 w-4" />}
                </button>
              </div>
              <p className="line-clamp-6 whitespace-pre-wrap text-sm text-muted-foreground flex-1">
                {n.content || "—"}
              </p>
              {n.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {n.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground border"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t pt-2 text-[10px] text-muted-foreground">
                <span>{new Date(n.updated_at).toLocaleDateString("pt-BR")}</span>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => setEditing(n)}
                    aria-label="Editar"
                    className="rounded p-1 hover:bg-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteNote(n)}
                    aria-label="Excluir"
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <NoteEditor
          note={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            fetchNotes();
          }}
        />
      )}
    </AppShell>
  );
}

function NoteEditor({
  note,
  onClose,
  onSaved,
}: {
  note: Note | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [tagsStr, setTagsStr] = useState(note?.tags.join(", ") ?? "");
  const [color, setColor] = useState<string | null>(note?.color ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe um título");
      return;
    }
    setSaving(true);
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
    const payload = {
      title: title.trim(),
      content,
      tags,
      color,
    };
    if (note) {
      const { error } = await supabase.from("notes").update(payload).eq("id", note.id);
      if (!error) {
        await logActivity({
          action: "editar",
          entity: "nota",
          entity_id: note.id,
          description: `Nota editada: "${title.trim()}"`,
        });
        toast.success("Nota atualizada");
        onSaved();
      } else toast.error("Erro ao salvar");
    } else {
      const { data, error } = await supabase.from("notes").insert(payload).select().single();
      if (!error) {
        await logActivity({
          action: "criar",
          entity: "nota",
          entity_id: data?.id,
          description: `Nota criada: "${title.trim()}"`,
        });
        toast.success("Nota criada");
        onSaved();
      } else toast.error("Erro ao criar");
    }
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-xl p-4 sm:rounded-xl sm:p-6 ${colorClass(color)}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold sm:text-lg">
            {note ? "Editar nota" : "Nova nota"}
          </h2>
          <button onClick={onClose} aria-label="Fechar" className="rounded-md p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            autoFocus
            className="w-full rounded-md border bg-background/70 px-3 py-2 text-base font-semibold"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva aqui... (suporta múltiplas linhas)"
            rows={10}
            className="w-full rounded-md border bg-background/70 px-3 py-2 text-sm"
          />
          <input
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="Tags separadas por vírgula (ex: manutencao, urgente)"
            className="w-full rounded-md border bg-background/70 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Cor:</span>
            {COLORS.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setColor(c.value)}
                aria-label={c.label}
                className={`h-7 w-7 rounded-full border-2 ${c.className} ${color === c.value ? "border-primary" : "border-transparent"}`}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
