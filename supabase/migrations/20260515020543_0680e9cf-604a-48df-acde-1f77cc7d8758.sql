ALTER TABLE public.advisor_invites
  ADD COLUMN IF NOT EXISTS advisor_role text,
  ADD COLUMN IF NOT EXISTS permission_level text NOT NULL DEFAULT 'view_only';