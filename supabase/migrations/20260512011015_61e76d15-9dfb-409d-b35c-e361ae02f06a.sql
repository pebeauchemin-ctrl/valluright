ALTER TABLE public.scenarios
  ADD COLUMN IF NOT EXISTS action_steps text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS roadmap_phase text;