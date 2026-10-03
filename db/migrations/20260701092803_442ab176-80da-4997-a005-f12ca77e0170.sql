
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'demo@nis2suite.com';
  IF uid IS NOT NULL THEN
    UPDATE auth.users
      SET email = 'demo@uniqsuite.com',
          raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data,'{}'::jsonb), '{display_name}', '"Demo Account"'),
          updated_at = now()
      WHERE id = uid;
    UPDATE auth.identities
      SET identity_data = jsonb_set(identity_data, '{email}', '"demo@uniqsuite.com"'),
          updated_at = now()
      WHERE user_id = uid AND provider = 'email';
    UPDATE public.profiles SET email = 'demo@uniqsuite.com' WHERE user_id = uid;
  END IF;
END $$;
