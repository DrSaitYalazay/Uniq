// ============================================================================
// cy — Storage servisi (Supabase Storage muadili, company-logos bucket)
//   upload / download / remove / getPublicUrl
// Dosyalar diskte STORAGE_DIR altında; metadata storage.objects tablosunda (RLS).
// ============================================================================
import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { withClaims } from './db.js';

const STORAGE_DIR = process.env.STORAGE_DIR || '/data/storage';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const storageRouter = Router();

// F-11: Bei vorhandenem, aber ungültigem/abgelaufenem Bearer 401 (statt still auf
// anon zu fallen) — dann erneuert der Client sein Token und wiederholt. Kein
// Header (echt anon) bleibt zulässig.
storageRouter.use((req, res, next) => {
  if (req.authInvalid) return res.status(401).json({ error: { code: '401', message: 'Token abgelaufen' } });
  next();
});

// V-4: Gespeichertes XSS über hochgeladene Dateien schliessen.
// Der Typ einer Datei stammt vom Hochladenden (Content-Type beim PUT) und wurde
// unverändert zurückgeliefert. Die App holt Nachweise per fetch() als Blob und
// öffnet sie mit window.open(URL.createObjectURL(blob)) (EvidencePanel). Eine
// Blob-URL gehört zum Origin der App: ein als text/html oder image/svg+xml
// hochgeladener "Nachweis" läuft beim Öffnen als Seite der App und liest die
// Sitzung (access + refresh token) aus localStorage — die eines Kollegen, eines
// Admins oder eines Betreuers, der den Mandanten gerade ansieht.
// Deshalb gilt ab hier: alles, was ein Browser als Dokument mit Skript ausführen
// kann (HTML, XML/XHTML, SVG, JavaScript, multipart, message, unbekannte text/*),
// geht als application/octet-stream + Download raus — dann entsteht auch eine
// Blob-URL ohne ausführbaren Typ. SVG bleibt nur im Logo-Bucket SVG: dort wird
// es ausschliesslich als Bild (data:-URL in <img>) verwendet, und Skripte in
// Bildern laufen nicht. Zusätzlich nosniff und — ausser bei PDF, dessen Ansicht
// unter Sandbox nicht lädt — eine Sandbox-CSP für den direkten Aufruf.
const HARMLOSE_TEXTTYPEN = new Set(['text/plain', 'text/csv']);
export function ausliefernAls(res, gespeicherterTyp, bucket) {
  const typ = String(gespeicherterTyp || '').split(';')[0].trim().toLowerCase();
  const aktiv = typ === ''
    || (typ.startsWith('text/') && !HARMLOSE_TEXTTYPEN.has(typ))
    || typ.endsWith('+xml') || typ === 'application/xml'
    || /^application\/(x-)?(java|ecma)script$/.test(typ)
    || typ.startsWith('multipart/') || typ.startsWith('message/');
  const logoSvg = bucket === 'company-logos' && typ === 'image/svg+xml';
  if (aktiv && !logoSvg) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment');
  } else {
    res.setHeader('Content-Type', typ);
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (typ !== 'application/pdf') {
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");
  }
}

function safeObjectPath(bucket, name) {
  // ".." vb. path traversal engelle
  const clean = path.posix.normalize(name).replace(/^(\.\.(\/|$))+/, '');
  if (clean.startsWith('/') || clean.includes('..')) throw new Error('Geçersiz yol');
  return path.join(STORAGE_DIR, bucket, clean);
}

// UPLOAD (upsert destekli): PUT /storage/:bucket/*
storageRouter.put('/:bucket/*', upload.single('file'), async (req, res) => {
  const bucket = req.params.bucket;
  const name = req.params[0];
  const upsert = req.query.upsert === 'true' || req.headers['x-upsert'] === 'true';
  const contentType = req.headers['content-type']?.startsWith('multipart')
    ? (req.file?.mimetype || 'application/octet-stream')
    : (req.headers['content-type'] || 'application/octet-stream');
  const buf = req.file ? req.file.buffer : req.body; // multipart veya ham gövde
  try {
    // storage.objects satırını RLS altında yaz (tenant izolasyonu policy'lerce)
    const result = await withClaims(req.claims, async (c) => {
      const existing = await c.query('SELECT id FROM storage.objects WHERE bucket_id=$1 AND name=$2', [bucket, name]);
      if (existing.rowCount && !upsert) throw Object.assign(new Error('Nesne zaten var'), { status: 409 });
      if (existing.rowCount) {
        await c.query('UPDATE storage.objects SET updated_at=now(), metadata=$3 WHERE bucket_id=$1 AND name=$2',
          [bucket, name, { mimetype: contentType, size: buf?.length || 0 }]);
      } else {
        await c.query('INSERT INTO storage.objects(bucket_id, name, owner, metadata) VALUES ($1,$2,$3,$4)',
          [bucket, name, req.claims?.sub || null, { mimetype: contentType, size: buf?.length || 0 }]);
      }
      return true;
    });
    // RLS geçtiyse dosyayı diske yaz
    const full = safeObjectPath(bucket, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, buf);
    res.json({ data: { path: name }, error: null });
  } catch (e) {
    res.status(e.status || 400).json({ data: null, error: { message: e.message } });
  }
});

// DOWNLOAD: GET /storage/:bucket/*
storageRouter.get('/:bucket/*', async (req, res) => {
  const bucket = req.params.bucket;
  const name = req.params[0];
  try {
    // RLS ile erişim kontrolü (satır görünüyorsa izin var)
    const ok = await withClaims(req.claims, async (c) =>
      (await c.query('SELECT metadata FROM storage.objects WHERE bucket_id=$1 AND name=$2', [bucket, name])).rows[0]);
    if (!ok) return res.status(404).json({ error: { message: 'Bulunamadı' } });
    const full = safeObjectPath(bucket, name);
    if (!fs.existsSync(full)) return res.status(404).json({ error: { message: 'Dosya yok' } });
    ausliefernAls(res, ok.metadata?.mimetype, bucket);
    fs.createReadStream(full).pipe(res);
  } catch (e) {
    res.status(e.status || 400).json({ error: { message: e.message } });
  }
});

// REMOVE: DELETE /storage/:bucket/*
storageRouter.delete('/:bucket/*', async (req, res) => {
  const bucket = req.params.bucket;
  const name = req.params[0];
  try {
    await withClaims(req.claims, (c) =>
      c.query('DELETE FROM storage.objects WHERE bucket_id=$1 AND name=$2', [bucket, name]));
    const full = safeObjectPath(bucket, name);
    if (fs.existsSync(full)) fs.unlinkSync(full);
    res.json({ data: {}, error: null });
  } catch (e) {
    res.status(e.status || 400).json({ data: null, error: { message: e.message } });
  }
});
