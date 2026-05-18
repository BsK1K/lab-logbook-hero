
-- Netbook loans table
CREATE TABLE public.netbook_loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('professor','aluno')),
  nome TEXT NOT NULL,
  sala TEXT NOT NULL,
  qtd_positivo INT NOT NULL DEFAULT 0,
  qtd_multilaser INT NOT NULL DEFAULT 0,
  retirada_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  devolvido_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.netbook_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read loans" ON public.netbook_loans FOR SELECT USING (true);
CREATE POLICY "public insert loans" ON public.netbook_loans FOR INSERT WITH CHECK (true);
CREATE POLICY "public update loans" ON public.netbook_loans FOR UPDATE USING (true);
CREATE POLICY "public delete loans" ON public.netbook_loans FOR DELETE USING (true);

-- Chamados (tickets)
CREATE TABLE public.chamados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_serie TEXT NOT NULL,
  marca TEXT NOT NULL CHECK (marca IN ('Positivo','Multilaser')),
  estado TEXT NOT NULL,
  detalhes TEXT,
  possui_garantia BOOLEAN NOT NULL DEFAULT false,
  imagens TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read chamados" ON public.chamados FOR SELECT USING (true);
CREATE POLICY "public insert chamados" ON public.chamados FOR INSERT WITH CHECK (true);
CREATE POLICY "public update chamados" ON public.chamados FOR UPDATE USING (true);
CREATE POLICY "public delete chamados" ON public.chamados FOR DELETE USING (true);

-- Storage bucket for chamado images
INSERT INTO storage.buckets (id, name, public) VALUES ('chamados', 'chamados', true);
CREATE POLICY "public read chamados bucket" ON storage.objects FOR SELECT USING (bucket_id = 'chamados');
CREATE POLICY "public upload chamados bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chamados');
CREATE POLICY "public delete chamados bucket" ON storage.objects FOR DELETE USING (bucket_id = 'chamados');
