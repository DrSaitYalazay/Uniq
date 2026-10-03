
CREATE TABLE public.user_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  taken_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL DEFAULT 'manual' CHECK (kind IN ('auto','manual')),
  label text NOT NULL DEFAULT '',
  size_bytes integer NOT NULL DEFAULT 0,
  payload_gz bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_snapshots_user_taken ON public.user_snapshots(user_id, taken_at DESC);

ALTER TABLE public.user_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
  ON public.user_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snapshots"
  ON public.user_snapshots FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all snapshots"
  ON public.user_snapshots FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- inserts/restores happen via edge functions using service role; no client INSERT/UPDATE policies

-- Prune trigger: keep newest 4 per user
CREATE OR REPLACE FUNCTION public.prune_user_snapshots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_snapshots
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM public.user_snapshots
      WHERE user_id = NEW.user_id
      ORDER BY taken_at DESC
      LIMIT 4
    );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prune_user_snapshots
AFTER INSERT ON public.user_snapshots
FOR EACH ROW EXECUTE FUNCTION public.prune_user_snapshots();
