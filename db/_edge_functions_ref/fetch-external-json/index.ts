// Proxies a single HTTP GET against an external JSON API on behalf of the user.
// Used by the REST Import wizard to preview data before mapping.
// Security: JWT-verified caller, HTTPS-only, 15s timeout, 5MB cap.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 15_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: aErr } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (aErr || !claims?.claims) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const { url, headers, method = 'GET' } = body ?? {};

    if (typeof url !== 'string') return json({ error: 'url required' }, 400);
    let parsed: URL;
    try { parsed = new URL(url); } catch { return json({ error: 'invalid url' }, 400); }
    if (parsed.protocol !== 'https:') return json({ error: 'https only' }, 400);
    // Block private ranges
    const host = parsed.hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|::1)/.test(host)) {
      return json({ error: 'private hosts not allowed' }, 400);
    }
    if (!['GET', 'POST'].includes(method)) return json({ error: 'method not allowed' }, 400);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const outboundHeaders: Record<string, string> = { Accept: 'application/json' };
    if (headers && typeof headers === 'object') {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === 'string' && !/^(host|content-length|connection)$/i.test(k)) {
          outboundHeaders[k] = v;
        }
      }
    }
    const resp = await fetch(parsed.toString(), { method, headers: outboundHeaders, signal: ctrl.signal }).catch((e) => {
      clearTimeout(timer);
      throw new Error(`upstream fetch failed: ${e.message}`);
    });
    clearTimeout(timer);

    // Enforce byte cap while reading
    const reader = resp.body?.getReader();
    if (!reader) return json({ error: 'empty response body' }, 502);
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        reader.cancel();
        return json({ error: 'response too large (>5MB)' }, 413);
      }
      chunks.push(value);
    }
    const buf = new Uint8Array(total);
    let off = 0; for (const c of chunks) { buf.set(c, off); off += c.byteLength; }
    const text = new TextDecoder().decode(buf);

    let parsedJson: unknown = null;
    try { parsedJson = JSON.parse(text); } catch {
      return json({ error: 'upstream returned non-JSON', status: resp.status, body_preview: text.slice(0, 500) }, 502);
    }

    return json({ status: resp.status, data: parsedJson });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
