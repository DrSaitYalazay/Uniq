
-- Enable pg_net for outbound webhook calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Admin notifications table
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete admin notifications"
  ON public.admin_notifications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_admin_notifications_created_at
  ON public.admin_notifications (created_at DESC);
CREATE INDEX idx_admin_notifications_unread
  ON public.admin_notifications (created_at DESC) WHERE read_at IS NULL;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- Extend handle_new_user to insert admin notification + dispatch email webhook
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  provider TEXT;
  display_name TEXT;
  fn_url TEXT;
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Determine signup provider for the notification
  provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.email
  );

  -- In-app admin notification (visible in bell dropdown)
  INSERT INTO public.admin_notifications (type, title, message, metadata)
  VALUES (
    'new_user_signup',
    'Yeni kullanıcı kaydı',
    display_name || ' (' || NEW.email || ') hesabı oluşturdu (' || provider || ')',
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'display_name', display_name,
      'provider', provider,
      'created_at', NEW.created_at
    )
  );

  -- Fire-and-forget email webhook via pg_net
  fn_url := 'https://peshpooxdysnolhesxeh.supabase.co/functions/v1/notify-admin-new-user';
  BEGIN
    PERFORM extensions.http_post(
      url := fn_url,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'display_name', display_name,
        'provider', provider,
        'created_at', NEW.created_at
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- never block signup on notification failure
    RAISE WARNING 'notify-admin-new-user webhook failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;
