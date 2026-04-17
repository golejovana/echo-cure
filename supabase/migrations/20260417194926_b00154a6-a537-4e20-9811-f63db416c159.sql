ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS specialization text,
ADD COLUMN IF NOT EXISTS doctor_id_number text,
ADD COLUMN IF NOT EXISTS jmbg text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS phone text;