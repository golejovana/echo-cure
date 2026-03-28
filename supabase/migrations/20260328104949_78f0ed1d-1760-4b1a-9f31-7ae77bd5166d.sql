DROP POLICY IF EXISTS "Users can read own appointments" ON public.appointments;

CREATE POLICY "Users can read own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  (patient_id = auth.uid())
  OR (examination_id IN (
    SELECT id FROM examinations WHERE doctor_id = auth.uid()
  ))
  OR (examination_id IN (
    SELECT id FROM examinations WHERE patient_id = auth.uid()
  ))
);