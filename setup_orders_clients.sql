-- 1. Criar a tabela de Clientes (clients)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cpf_cnpj TEXT,
  phone TEXT,
  email TEXT,
  postal_code TEXT,
  address TEXT,
  number TEXT,
  district TEXT,
  city TEXT,
  state TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS para clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança RLS para clients
CREATE POLICY "Users can manage their own clients"
ON clients FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 2. Criar a tabela de Pedidos (orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  raca TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'Pendente', -- 'Pendente', 'Enviado', 'Cancelado'
  shipping_cost NUMERIC DEFAULT 0,
  delivery_time INTEGER DEFAULT 0,
  tracking_code TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS para orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança RLS para orders
CREATE POLICY "Users can manage their own orders"
ON orders FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
