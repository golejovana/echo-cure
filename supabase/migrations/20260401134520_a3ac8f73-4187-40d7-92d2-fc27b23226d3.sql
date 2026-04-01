
-- Allow doctors to delete their own examinations
CREATE POLICY "Doctors can delete own examinations"
ON public.examinations
FOR DELETE
TO authenticated
USING (auth.uid() = doctor_id);

-- Allow doctors to update their own examinations (for editing diagnosis)
CREATE POLICY "Doctors can update own examinations"
ON public.examinations
FOR UPDATE
TO authenticated
USING (auth.uid() = doctor_id)
WITH CHECK (auth.uid() = doctor_id);

-- Allow doctors to delete appointments linked to their examinations
CREATE POLICY "Doctors can delete appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (examination_id IN (
  SELECT id FROM public.examinations WHERE doctor_id = auth.uid()
));

-- Allow doctors to delete journal entries linked to their examinations
CREATE POLICY "Doctors can delete linked journal entries"
ON public.journal_entries
FOR DELETE
TO authenticated
USING (examination_id IN (
  SELECT id FROM public.examinations WHERE doctor_id = auth.uid()
));
