ALTER TABLE public.netbook_loans
ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'geral';

CREATE INDEX IF NOT EXISTS idx_netbook_loans_categoria ON public.netbook_loans(categoria);