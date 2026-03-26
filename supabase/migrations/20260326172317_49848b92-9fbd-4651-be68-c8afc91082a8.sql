
-- Fix overly permissive INSERT policy on appointments
DROP POLICY "Doctors can insert appointments" ON public.appointments;

CREATE POLICY "Doctors can insert appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (
    examination_id IN (SELECT id FROM public.examinations WHERE doctor_id = auth.uid())
  );
