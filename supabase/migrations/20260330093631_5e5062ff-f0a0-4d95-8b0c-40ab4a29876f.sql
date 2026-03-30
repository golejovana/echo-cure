
-- Journal entries for patient daily check-ins
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  examination_id UUID REFERENCES public.examinations(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  symptoms TEXT,
  medication_taken BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  is_severe BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Patients can insert their own entries
CREATE POLICY "Patients can insert own journal entries"
  ON public.journal_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

-- Patients can read their own entries
CREATE POLICY "Patients can read own journal entries"
  ON public.journal_entries FOR SELECT TO authenticated
  USING (auth.uid() = patient_id);

-- Doctors can read journal entries for their patients
CREATE POLICY "Doctors can read patient journal entries"
  ON public.journal_entries FOR SELECT TO authenticated
  USING (
    examination_id IN (
      SELECT id FROM public.examinations WHERE doctor_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
