-- Allow doctors to update appointments linked to their examinations
CREATE POLICY "Doctors can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (examination_id IN (
  SELECT id FROM public.examinations WHERE doctor_id = auth.uid()
))
WITH CHECK (examination_id IN (
  SELECT id FROM public.examinations WHERE doctor_id = auth.uid()
));