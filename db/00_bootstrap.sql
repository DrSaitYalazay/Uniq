-- ============================================================================
-- cy — Supabase -> düz PostgreSQL bootstrap
-- ----------------------------------------------------------------------------
-- Bu dosya migration'lardan ÖNCE çalışır. Amacı: Supabase'in sağladığı fakat
-- düz Postgres'te olmayan parçaları taklit etmek, böylece 98 migration ve
-- 316 RLS politikası HİÇ DEĞİŞTİRİLMEDEN çalışır.
--
-- Model: PostgREST ile aynı. API her isteği bir transaction içinde şu şekilde
-- çalıştırır:
--     SET LOCAL ROLE authenticated;   (veya anon / service_role)
--     SELECT set_config('request.jwt.claims', '{"sub":"<uuid>",...}', true);
-- Böylece auth.uid() JWT'deki sub'ı döndürür ve RLS devreye girer.
-- ============================================================================

-- Gerekli eklentiler ---------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;      -- gen_random_uuid(), crypt(), digest()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Supabase realtime publication'ı (migration'lar buna ADD TABLE yapar).
-- Düz Postgres'te logical replication publication'ı zararsızdır.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- 1) Supabase rolleri (PostgREST modeli)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    -- API'nin bağlandığı rol; diğer rollere SET ROLE yapabilir
    CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'authenticator_pw_change_me';
  END IF;
END
$$;

GRANT anon, authenticated, service_role TO authenticator;

-- ----------------------------------------------------------------------------
-- 2) auth şeması (GoTrue muadili — sadece uygulamanın ihtiyacı kadar)
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  instance_id           uuid DEFAULT '00000000-0000-0000-0000-000000000000',
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aud                   text DEFAULT 'authenticated',
  role                  text DEFAULT 'authenticated',
  email                 text UNIQUE,
  encrypted_password    text,
  email_confirmed_at    timestamptz,
  confirmation_token    text DEFAULT '',
  recovery_token        text DEFAULT '',
  email_change          text DEFAULT '',
  email_change_token_new text DEFAULT '',
  raw_user_meta_data    jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_app_meta_data     jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_super_admin        boolean DEFAULT false,
  phone                 text,
  banned_until          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  last_sign_in_at       timestamptz
);

-- Supabase auth.identities (bazı migration'lar buraya yazar)
CREATE TABLE IF NOT EXISTS auth.identities (
  id              uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id     text NOT NULL,
  identity_data   jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider        text NOT NULL,
  last_sign_in_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_id)
);

-- Refresh oturumları / token'lar
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id          bigserial PRIMARY KEY,
  token       text NOT NULL UNIQUE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revoked     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);

-- MFA (TOTP) faktörleri
CREATE TABLE IF NOT EXISTS auth.mfa_factors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friendly_name text,
  factor_type   text NOT NULL DEFAULT 'totp',
  status        text NOT NULL DEFAULT 'unverified',  -- unverified | verified
  secret        text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Supabase yardımcı fonksiyonları -------------------------------------------
-- JWT claim'lerini request.jwt.claims GUC'undan okur (API set eder)
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  )
$$;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
      ''
    ),
    ''
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    'anon'
  )
$$;

CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email'
$$;

-- ----------------------------------------------------------------------------
-- 3) storage şeması (Supabase Storage muadili — company-logos bucket için)
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  public      boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id   text NOT NULL REFERENCES storage.buckets(id),
  name        text NOT NULL,               -- dosya yolu (ör: <tenant>/logo.png)
  owner       uuid,
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket_id, name)
);

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- storage.foldername(name): Supabase yardımcısı — yol parçalarını dizi döndürür
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[]
LANGUAGE sql IMMUTABLE
AS $$
  SELECT string_to_array(regexp_replace(name, '/[^/]*$', ''), '/')
$$;

CREATE OR REPLACE FUNCTION storage.filename(name text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT regexp_replace(name, '^.*/', '')
$$;

-- Bilinen bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4) Yetkilendirme (PostgREST grant modeli)
--    RLS satır düzeyinde koruma sağlar; GRANT şema/tablo erişimi verir.
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public  TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth    TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

-- public şemasındaki mevcut + gelecekteki nesneler
GRANT ALL ON ALL TABLES    IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, service_role, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- auth & storage: fonksiyon çalıştırma + gerekli okuma
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth    TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA storage TO anon, authenticated, service_role;

-- auth şeması: service_role (auth servisinin bağlamı) tam yetkili;
-- authenticated sadece kendi kimliğini okuyabilir (RLS yok ama sadece SELECT).
GRANT ALL    ON auth.users, auth.refresh_tokens, auth.mfa_factors, auth.identities TO service_role;
GRANT SELECT ON auth.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO service_role;

GRANT ALL ON storage.objects, storage.buckets TO authenticated, service_role;
GRANT SELECT ON storage.objects, storage.buckets TO anon;
