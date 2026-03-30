
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
