
-- Examinations table: stores the doctor's anamnesis sent to a patient
CREATE TABLE public.examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  patient_email TEXT NOT NULL,
  patient_id UUID,
  patient_name TEXT,
  diagnosis_codes TEXT,
  chief_complaints TEXT,
  present_illness TEXT,
  clinical_timeline TEXT,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  simplified_explanation TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Appointments table: linked to an examination
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  patient_id UUID,
  title TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS for examinations: doctors see their own, patients see theirs (matched by user_id)
CREATE POLICY "Doctors can insert examinations"
  ON public.examinations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can read own examinations"
  ON public.examinations FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can read own examinations"
  ON public.examinations FOR SELECT TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can update own examinations"
  ON public.examinations FOR UPDATE TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- RLS for appointments
CREATE POLICY "Doctors can insert appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (
    patient_id = auth.uid() OR
    examination_id IN (SELECT id FROM public.examinations WHERE doctor_id = auth.uid())
  );

-- Function to auto-link patient_id when a patient with matching email registers
CREATE OR REPLACE FUNCTION public.link_examinations_to_patient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update examinations where patient_email matches the new user's email
  UPDATE public.examinations
  SET patient_id = NEW.id, updated_at = now()
  WHERE patient_email = NEW.email AND patient_id IS NULL;

  -- Also update appointments
  UPDATE public.appointments a
  SET patient_id = NEW.id
  FROM public.examinations e
  WHERE a.examination_id = e.id AND e.patient_id = NEW.id AND a.patient_id IS NULL;

  RETURN NEW;
END;
$$;

-- Trigger on auth.users insert to auto-link
CREATE TRIGGER on_auth_user_created_link_exams
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_examinations_to_patient();

-- Also create a function doctors can call to link existing patients
CREATE OR REPLACE FUNCTION public.link_patient_by_email(p_exam_id UUID, p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO v_patient_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_patient_id IS NOT NULL THEN
    UPDATE public.examinations SET patient_id = v_patient_id, updated_at = now() WHERE id = p_exam_id;
    UPDATE public.appointments SET patient_id = v_patient_id WHERE examination_id = p_exam_id;
  END IF;
END;
$$;

-- Enable realtime for examinations
ALTER PUBLICATION supabase_realtime ADD TABLE public.examinations;
