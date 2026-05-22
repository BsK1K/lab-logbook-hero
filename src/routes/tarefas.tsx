import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import {
  Plus,
  X,
  Trash2,
  Pencil,
  Save,
  MessageSquare,
  Calendar,
  User,
  Link2,
  Send,
} from "lucide-react";
import {
  logActivity,
  TASK_COLUMNS,
  TASK_PRIORITIES,
  taskColumnLabel,
  priorityColor,
  priorityLabel,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/logger";

export const Route = createFileRoute("/tarefas")({
  validateSearch: (s: Record<string, unknown>) => ({
    task: typeof s.task === "string" ? s.task : undefined,
  }),
  component: TarefasPage,
});

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string | null;
  due_date: string | null;
  position: number;
  chamado_id: string | null;
  created_at: string;
  updated_at: string;
};

type Comment = {
  id: string;
  task_id: string;
  author: string;
  content: string;
  created_at: string;
};

function TarefasPage() {
  const { task: openTaskId } = useSearch({ from: "/tarefas" });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [creating, setCreating] = useState<TaskStatus | null>(null);
  const [search, setSearch] = useState("");

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    if (data) setTasks(data as Task[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Open task from query string (?task=id), e.g. after creating from chamado
  useEffect(() => {
    if (openTaskId && tasks.length > 0) {
      const t = tasks.find((t) => t.id === openTaskId);
      if (t) setOpenTask(t);
    }
  }, [openTaskId, tasks]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.assignee ?? "").toLowerCase().includes(q),
    );
  }, [tasks, search]);

  const moveTask = async (task: Task, newStatus: TaskStatus) => {
    if (task.status === newStatus) return;
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id);
    if (error) {
      toast.error("Erro ao mover");
      return;
    }
    await logActivity({
      action: "mover",
      entity: "tarefa",
      entity_id: task.id,
      description: `Tarefa "${task.title}" movida de ${taskColumnLabel(task.status)} para ${taskColumnLabel(newStatus)}`,
    });
    fetchTasks();
  };

  const deleteTask = async (task: Task) => {
    if (!confirm(`Excluir a tarefa "${task.title}"?`)) return;
    await supabase.from("tasks").delete().eq("id", task.id);
    await logActivity({
      action: "excluir",
      entity: "tarefa",
      entity_id: task.id,
      description: `Tarefa excluída: "${task.title}"`,
    });
    setOpenTask(null);
    fetchTasks();
    toast.success("Tarefa excluída");
  };

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Quadro de Tarefas</h1>
          <p className="text-sm text-muted-foreground">
            Organize o trabalho em colunas. Arraste para mover ou use os botões.
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tarefa..."
          className="w-full max-w-xs rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TASK_COLUMNS.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.value);
            return (
              <Column
                key={col.value}
                colValue={col.value}
                colLabel={col.label}
                tasks={colTasks}
                onDropTask={(taskId) => {
                  const t = tasks.find((x) => x.id === taskId);
                  if (t) moveTask(t, col.value);
                }}
                onOpen={(t) => setOpenTask(t)}
                onAdd={() => setCreating(col.value)}
              />
            );
          })}
        </div>
      )}

      {creating && (
        <CreateTaskModal
          status={creating}
          onClose={() => setCreating(null)}
          onCreated={() => {
            setCreating(null);
            fetchTasks();
          }}
        />
      )}

      {openTask && (
        <TaskDetail
          task={openTask}
          onClose={() => setOpenTask(null)}
          onChange={fetchTasks}
          onDelete={() => deleteTask(openTask)}
        />
      )}
    </AppShell>
  );
}

function Column({
  colValue,
  colLabel,
  tasks,
  onDropTask,
  onOpen,
  onAdd,
}: {
  colValue: TaskStatus;
  colLabel: string;
  tasks: Task[];
  onDropTask: (taskId: string) => void;
  onOpen: (t: Task) => void;
  onAdd: () => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDropTask(id);
      }}
      className={`flex flex-col rounded-xl border bg-card/40 p-3 transition ${
        over ? "border-primary bg-primary/5" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{colLabel}</h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          aria-label={`Adicionar tarefa em ${colLabel}`}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col gap-2 min-h-24">
        {tasks.length === 0 && (
          <li className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            Sem tarefas
          </li>
        )}
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onOpen={() => onOpen(t)} />
        ))}
      </ul>
    </div>
  );
}

function TaskCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const overdue =
    task.due_date && task.status !== "concluido"
      ? new Date(task.due_date) < new Date(new Date().toDateString())
      : false;
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onOpen}
      className={`group cursor-pointer rounded-lg border bg-card p-3 text-sm shadow-sm transition hover:border-primary hover:shadow ${
        task.status === "concluido" ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`font-medium ${task.status === "concluido" ? "line-through" : ""}`}>
          {task.title}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColor(task.priority)}`}
        >
          {priorityLabel(task.priority)}
        </span>
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {task.assignee && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" /> {task.assignee}
          </span>
        )}
        {task.due_date && (
          <span
            className={`flex items-center gap-1 ${overdue ? "text-destructive font-medium" : ""}`}
          >
            <Calendar className="h-3 w-3" />
            {new Date(task.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
          </span>
        )}
        {task.chamado_id && (
          <span className="flex items-center gap-1" title="Vinculada a um chamado">
            <Link2 className="h-3 w-3" /> chamado
          </span>
        )}
      </div>
    </li>
  );
}

function CreateTaskModal({
  status,
  onClose,
  onCreated,
}: {
  status: TaskStatus;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("media");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        assignee: assignee.trim() || null,
        due_date: dueDate || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error("Erro ao criar tarefa");
      return;
    }
    await logActivity({
      action: "criar",
      entity: "tarefa",
      entity_id: data?.id,
      description: `Tarefa criada: "${title.trim()}" em ${taskColumnLabel(status)}`,
    });
    toast.success("Tarefa criada");
    onCreated();
  };

  return (
    <Modal onClose={onClose} title="Nova tarefa">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Título *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Descrição">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prioridade">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prazo">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <Field label="Responsável">
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Nome de quem vai executar"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
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
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Criar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TaskDetail({
  task,
  onClose,
  onChange,
  onDelete,
}: {
  task: Task;
  onClose: () => void;
  onChange: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assignee, setAssignee] = useState(task.assignee ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);

  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState(() => localStorage.getItem("lastAuthor") ?? "");
  const [newComment, setNewComment] = useState("");

  const fetchComments = async () => {
    const { data } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", task.id)
      .order("created_at", { ascending: true });
    if (data) setComments(data as Comment[]);
  };

  useEffect(() => {
    fetchComments();
    // realtime
    const ch = supabase
      .channel(`comments-${task.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${task.id}` },
        () => fetchComments(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  const save = async () => {
    const { error } = await supabase
      .from("tasks")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        assignee: assignee.trim() || null,
        due_date: dueDate || null,
        status,
      })
      .eq("id", task.id);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    await logActivity({
      action: "editar",
      entity: "tarefa",
      entity_id: task.id,
      description: `Tarefa editada: "${title.trim()}"`,
    });
    toast.success("Tarefa atualizada");
    setEditing(false);
    onChange();
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !author.trim()) {
      toast.error("Informe seu nome e a mensagem");
      return;
    }
    localStorage.setItem("lastAuthor", author.trim());
    const { error } = await supabase.from("task_comments").insert({
      task_id: task.id,
      author: author.trim(),
      content: newComment.trim(),
    });
    if (error) {
      toast.error("Erro ao comentar");
      return;
    }
    await logActivity({
      action: "comentar",
      entity: "tarefa",
      entity_id: task.id,
      description: `${author.trim()} comentou em "${task.title}"`,
    });
    setNewComment("");
  };

  return (
    <Modal onClose={onClose} title={editing ? "Editar tarefa" : task.title} wide>
      <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
        {/* Left: details */}
        <div className="space-y-3">
          {editing ? (
            <>
              <Field label="Título">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Descrição">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {TASK_COLUMNS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Prioridade">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Prazo">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Responsável">
                  <input
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </Field>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={save}
                  className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Save className="h-4 w-4" /> Salvar
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setTitle(task.title);
                    setDescription(task.description ?? "");
                    setPriority(task.priority);
                    setAssignee(task.assignee ?? "");
                    setDueDate(task.due_date ?? "");
                    setStatus(task.status);
                  }}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${priorityColor(task.priority)}`}>
                  {priorityLabel(task.priority)}
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                  {taskColumnLabel(task.status)}
                </span>
                {task.assignee && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" /> {task.assignee}
                  </span>
                )}
                {task.due_date && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(task.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
              {task.description ? (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {task.description}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">Sem descrição</p>
              )}
              {task.chamado_id && (
                <p className="text-xs text-muted-foreground">
                  <Link2 className="mr-1 inline h-3 w-3" />
                  Vinculada ao chamado <code>{task.chamado_id.slice(0, 8)}</code>
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent"
                >
                  <Pencil className="h-4 w-4" /> Editar
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: comments */}
        <div className="flex min-h-80 flex-col rounded-lg border bg-muted/30">
          <div className="border-b px-3 py-2 text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Conversa ({comments.length})
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 max-h-96">
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="rounded-md bg-card border p-2 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-xs text-primary">{c.author}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.content}</p>
              </div>
            ))}
          </div>
          <form onSubmit={addComment} className="border-t p-2 space-y-2">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
            />
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escrever mensagem..."
                className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
              />
              <button
                type="submit"
                aria-label="Enviar"
                className="flex items-center justify-center rounded-md bg-primary px-3 text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}

function Modal({
  children,
  onClose,
  title,
  wide,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-4xl" : "max-w-md"} max-h-[92vh] overflow-y-auto rounded-t-xl bg-background p-4 sm:rounded-xl sm:p-6`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
