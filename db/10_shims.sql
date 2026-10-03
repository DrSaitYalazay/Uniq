-- ============================================================================
-- cy — Supabase eklenti shim'leri
-- ----------------------------------------------------------------------------
-- Supabase'e özgü eklentileri (pgmq, pg_net, supabase_vault, pg_cron) düz
-- Postgres'te taklit eder. Migration'lardaki `CREATE EXTENSION ...` satırları
-- build sırasında çıkarılır (build-schema.sh); onların yerine bu objeler gelir.
--
-- E-posta kuyruğu (pgmq) GERÇEK olarak çalışır — Node "email worker" bu kuyruğu
-- pgmq.send/read/delete ile işler. Vault/cron/http_post sadece migration'ın
-- yüklenmesi için gerekli; asıl iş Node tarafında yapılır.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS pgmq;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS vault;
CREATE SCHEMA IF NOT EXISTS cron;
CREATE SCHEMA IF NOT EXISTS net;

GRANT USAGE ON SCHEMA pgmq, extensions, vault, cron, net TO authenticated, service_role, anon;

-- ----------------------------------------------------------------------------
-- pgmq — minimal ama gerçek mesaj kuyruğu
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pgmq.create(queue_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format($f$
    CREATE TABLE IF NOT EXISTS pgmq.%I (
      msg_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      read_ct      int         NOT NULL DEFAULT 0,
      enqueued_at  timestamptz NOT NULL DEFAULT now(),
      vt           timestamptz NOT NULL DEFAULT now(),
      message      jsonb
    )$f$, 'q_' || queue_name);
END;
$$;

-- pgmq.send(queue, payload) -> msg_id
CREATE OR REPLACE FUNCTION pgmq.send(queue_name text, msg jsonb)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE new_id bigint;
BEGIN
  EXECUTE format(
    'INSERT INTO pgmq.%I (message, vt) VALUES ($1, now()) RETURNING msg_id',
    'q_' || queue_name
  ) INTO new_id USING msg;
  RETURN new_id;
END;
$$;

-- pgmq.read(queue, vt_seconds, qty) -> görünürlük zaman aşımıyla mesaj oku
CREATE OR REPLACE FUNCTION pgmq.read(queue_name text, p_vt int, qty int)
RETURNS TABLE(msg_id bigint, read_ct int, enqueued_at timestamptz, vt timestamptz, message jsonb)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY EXECUTE format($f$
    WITH cte AS (
      SELECT t.msg_id FROM pgmq.%1$I t
      WHERE t.vt <= now()
      ORDER BY t.msg_id
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE pgmq.%1$I q
       SET vt = now() + ($2 || ' seconds')::interval,
           read_ct = q.read_ct + 1
      FROM cte
     WHERE q.msg_id = cte.msg_id
    RETURNING q.msg_id, q.read_ct, q.enqueued_at, q.vt, q.message
  $f$, 'q_' || queue_name) USING qty, p_vt;
END;
$$;

-- pgmq.delete(queue, msg_id) -> boolean
CREATE OR REPLACE FUNCTION pgmq.delete(queue_name text, msg_id bigint)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE n int;
BEGIN
  EXECUTE format('DELETE FROM pgmq.%I WHERE msg_id = $1', 'q_' || queue_name)
    USING msg_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgmq TO service_role, authenticated;

-- ----------------------------------------------------------------------------
-- pg_net / extensions.http_post — no-op (DB'den giden HTTP yok; işi Node yapar)
-- Migration'daki trigger fonksiyonu named-arg ile çağırır (url, headers, body).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION extensions.http_post(
  url                   text,
  body                  jsonb DEFAULT '{}'::jsonb,
  params                jsonb DEFAULT '{}'::jsonb,
  headers               jsonb DEFAULT '{}'::jsonb,
  timeout_milliseconds  int   DEFAULT 5000
)
RETURNS bigint
LANGUAGE sql
AS $$ SELECT 0::bigint $$;

CREATE OR REPLACE FUNCTION net.http_post(
  url                   text,
  body                  jsonb DEFAULT '{}'::jsonb,
  params                jsonb DEFAULT '{}'::jsonb,
  headers               jsonb DEFAULT '{}'::jsonb,
  timeout_milliseconds  int   DEFAULT 5000
)
RETURNS bigint
LANGUAGE sql
AS $$ SELECT 0::bigint $$;

-- ----------------------------------------------------------------------------
-- supabase_vault — sadece güvenli yükleme için minimal tablo/fonksiyon
-- (gerçek sırlar Node .env'de tutulur)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vault.secrets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text UNIQUE,
  secret      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION vault.create_secret(new_secret text, new_name text DEFAULT NULL, new_description text DEFAULT '')
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE nid uuid;
BEGIN
  INSERT INTO vault.secrets(name, secret) VALUES (new_name, new_secret)
  ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret, updated_at = now()
  RETURNING id INTO nid;
  RETURN nid;
END;
$$;

CREATE OR REPLACE FUNCTION vault.update_secret(secret_id uuid, new_secret text DEFAULT NULL, new_name text DEFAULT NULL, new_description text DEFAULT NULL)
RETURNS void
LANGUAGE sql
AS $$ UPDATE vault.secrets SET secret = COALESCE(new_secret, secret), name = COALESCE(new_name, name), updated_at = now() WHERE id = secret_id $$;

-- ----------------------------------------------------------------------------
-- pg_cron — no-op (zamanlamayı Node worker yapar)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cron.schedule(job_name text, schedule text, command text)
RETURNS bigint LANGUAGE sql AS $$ SELECT 0::bigint $$;

CREATE OR REPLACE FUNCTION cron.unschedule(job_name text)
RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
