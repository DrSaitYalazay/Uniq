
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@nis2suite.com') THEN
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'demo@nis2suite.com';
    UPDATE auth.users
      SET encrypted_password = crypt('NIS2Demo2026!', gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE id = new_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'demo@nis2suite.com',
      crypt('NIS2Demo2026!', gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers',ARRAY['email']),
      jsonb_build_object('display_name','Demo Account'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id, new_user_id::text,
      jsonb_build_object('sub', new_user_id::text, 'email', 'demo@nis2suite.com', 'email_verified', true),
      'email', now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles (user_id, email, display_name)
    VALUES (new_user_id, 'demo@nis2suite.com', 'Demo Account')
    ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;
