-- Adicionar colunas do SuperFrete e Correios à tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS superfrete_token TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS superfrete_sandbox BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS superfrete_enabled BOOLEAN DEFAULT false;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correios_user TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correios_password TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correios_contract TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correios_card TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correios_sandbox BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correios_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correios_pac_code TEXT DEFAULT '03298';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correios_sedex_code TEXT DEFAULT '03220';
