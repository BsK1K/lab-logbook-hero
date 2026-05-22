
-- TASKS
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'a_fazer',
  priority text NOT NULL DEFAULT 'media',
  assignee text,
  due_date date,
  position integer NOT NULL DEFAULT 0,
  chamado_id uuid REFERENCES public.chamados(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "public insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "public update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "public delete tasks" ON public.tasks FOR DELETE USING (true);

CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_chamado ON public.tasks(chamado_id);

-- TASK COMMENTS
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read task_comments" ON public.task_comments FOR SELECT USING (true);
CREATE POLICY "public insert task_comments" ON public.task_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "public update task_comments" ON public.task_comments FOR UPDATE USING (true);
CREATE POLICY "public delete task_comments" ON public.task_comments FOR DELETE USING (true);

CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);

-- NOTES
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  color text,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read notes" ON public.notes FOR SELECT USING (true);
CREATE POLICY "public insert notes" ON public.notes FOR INSERT WITH CHECK (true);
CREATE POLICY "public update notes" ON public.notes FOR UPDATE USING (true);
CREATE POLICY "public delete notes" ON public.notes FOR DELETE USING (true);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
