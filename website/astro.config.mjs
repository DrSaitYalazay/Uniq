// @ts-check
import { defineConfig } from 'astro/config';
import { SITE_URL } from './src/config.ts';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Keine Inline-Styles/-Skripte → strikte CSP ohne 'unsafe-inline'
    inlineStylesheets: 'never',
    assets: '_assets',
  },
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  devToolbar: { enabled: false },
  vite: {
    build: { assetsInlineLimit: 0, chunkSizeWarningLimit: 900 },
  },
});
