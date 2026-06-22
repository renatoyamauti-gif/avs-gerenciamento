-- Alter products table RLS policy to support team sharing
-- Execute this script in your Supabase SQL Editor

DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;

CREATE POLICY "Users can manage their own products" ON public.products FOR ALL
  USING (user_id = public.get_effective_user_id())
  WITH CHECK (user_id = public.get_effective_user_id());

-- Reload scheme cache
NOTIFY pgrst, 'reload schema';
