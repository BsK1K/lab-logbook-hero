
-- Add status to chamados
ALTER TABLE public.chamados
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'aberto',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Activity logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read logs" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "public insert logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
