-- Add collector_id column referencing profiles
ALTER TABLE public.egg_logs ADD COLUMN collector_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
