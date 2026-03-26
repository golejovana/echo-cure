-- Drop the duplicate overload (swapped params)
DROP FUNCTION IF EXISTS public.link_patient_by_email(uuid, text);

-- Recreate the single correct version
CREATE OR REPLACE FUNCTION public.link_patient_by_email(p_email text, p_exam_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_patient_id uuid;
BEGIN
  SELECT id INTO v_patient_id FROM auth.users WHERE email = p_email;
  IF v_patient_id IS NOT NULL THEN
    UPDATE public.examinations SET patient_id = v_patient_id, updated_at = now() WHERE id = p_exam_id;
    UPDATE public.appointments SET patient_id = v_patient_id WHERE examination_id = p_exam_id;
  END IF;
END;
$$;

-- Fix existing data: link examinations by email
UPDATE public.examinations e
SET patient_id = u.id
FROM auth.users u
WHERE e.patient_email = u.email AND e.patient_id IS NULL;

-- Fix existing data: link appointments via examinations
UPDATE public.appointments a
SET patient_id = e.patient_id
FROM public.examinations e
WHERE a.examination_id = e.id AND a.patient_id IS NULL AND e.patient_id IS NOT NULL;