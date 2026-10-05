import { SITE_URL } from '../config';
import { steps, stepHref } from '../data/steps';
import { features, featureHref } from '../data/features';
import { fwOrder, fwHref } from '../data/frameworks';
import { topicOrder, topicHref, topicHub } from '../data/topics';
import { reportOrder, reportHref, reportHub } from '../data/reports';
const pairs: [string, string][] = [
  ['/de/', '/en/'],
  ...steps.de.map((_, i): [string, string] => [stepHref('de', i), stepHref('en', i)]),
  ...features.de.map((_, i): [string, string] => [featureHref('de', i), featureHref('en', i)]),
  ...fwOrder.map((f): [string, string] => [fwHref('de', f), fwHref('en', f)]),
  [topicHub('de'), topicHub('en')],
  ...topicOrder.map((k): [string, string] => [topicHref('de', k), topicHref('en', k)]),
  [reportHub('de'), reportHub('en')],
  ...reportOrder.map((k): [string, string] => [reportHref('de', k), reportHref('en', k)]),
  ['/de/whitepaper/', '/en/white-paper/'],
  ['/de/broschuere/', '/en/brochure/'],
  ['/de/datenschutz/', '/en/privacy/'],
  ['/de/barrierefreiheit/', '/en/accessibility/'],
];
export function GET() {
  const url = (p: string) => new URL(p, SITE_URL).href;
  const entries = pairs.flatMap(([de, en]) => [de, en].map((p) => `  <url>
    <loc>${url(p)}</loc>
    <lastmod>2026-10-04</lastmod>
    <xhtml:link rel="alternate" hreflang="de" href="${url(de)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${url(en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${url(de)}"/>
  </url>`)).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
