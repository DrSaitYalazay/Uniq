/** White Paper und Broschüre: PDF, Leseseite und Seitenbilder (public/doc/<key>-NN.webp). */
export type DocKey = 'wp' | 'br';
export const docInfo = {
  wp: { pages: 14, pdf: { de: '/docs/UniqSuite-WhitePaper-NIS2-ISO27001-DE.pdf', en: '/docs/UniqSuite-WhitePaper-NIS2-ISO27001-EN.pdf' }, path: { de: '/de/whitepaper/', en: '/en/white-paper/' } },
  br: { pages: 4, pdf: { de: '/docs/UniqSuite-Broschuere-DE.pdf', en: '/docs/UniqSuite-Brochure-EN.pdf' }, path: { de: '/de/broschuere/', en: '/en/brochure/' } },
} as const;
export const pageImg = (doc: DocKey, lang: 'de' | 'en', i: number) => `/img/doc-${doc}-${lang}-${String(i + 1).padStart(2, '0')}.webp`;
