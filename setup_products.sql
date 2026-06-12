-- 1. Criar a tabela de Produtos (products)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  price NUMERIC DEFAULT 0,
  weight NUMERIC DEFAULT 0.1, -- Peso padrão em kg
  width NUMERIC DEFAULT 10,   -- Dimensões padrão em cm (largura)
  height NUMERIC DEFAULT 10,  -- altura
  length NUMERIC DEFAULT 10,  -- comprimento
  stock INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS (Row Level Security) para products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança RLS para products
CREATE POLICY "Users can manage their own products"
ON products FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Recarregar o cache de esquemas do Supabase/PostgREST
NOTIFY pgrst, 'reload schema';
