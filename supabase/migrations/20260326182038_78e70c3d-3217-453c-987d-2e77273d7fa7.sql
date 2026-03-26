
CREATE OR REPLACE FUNCTION public.link_patient_by_email(p_email text, p_exam_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
BEGIN
  SELECT id INTO v_patient_id FROM auth.users WHERE email = p_email;
  IF v_patient_id IS NOT NULL THEN
    UPDATE public.examinations SET patient_id = v_patient_id WHERE id = p_exam_id;
    UPDATE public.appointments SET patient_id = v_patient_id WHERE examination_id = p_exam_id;
  END IF;
END;
$$;

-- Also update the trigger that links on user creation
CREATE OR REPLACE FUNCTION public.link_examinations_to_patient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.examinations SET patient_id = NEW.id WHERE patient_email = NEW.email AND patient_id IS NULL;
  UPDATE public.appointments SET patient_id = NEW.id WHERE examination_id IN (
    SELECT id FROM public.examinations WHERE patient_email = NEW.email
  ) AND patient_id IS NULL;
  RETURN NEW;
END;
$$;
