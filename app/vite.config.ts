import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  define: { 'import.meta.env.MODE': JSON.stringify('release-prep'), 'import.meta.env.VITE_GITHUB_RELEASE': JSON.stringify('1') },
  plugins: [react(), { name:'disabled-legacy-course-trust', resolveId(id) { if (id === 'virtual:course-trust') return '\0course-trust'; }, load(id) { if (id === '\0course-trust') return 'export default null;'; } }, { name:'free-catalog-only', enforce:'pre', resolveId(source, importer) {
    const path = importer?.replaceAll('\\','/');
    if (source === '../content/pilotCatalog.json' && path?.endsWith('/product/catalog.ts')) return fileURLToPath(new URL('./src/product/marketCatalog.json', import.meta.url));
    if (source === './listeningCatalog.json' && path?.endsWith('/product/listeningCatalog.ts')) return fileURLToPath(new URL('./src/product/marketListeningCatalog.json', import.meta.url));
  }}],
  base:'./', build:{outDir:'dist',sourcemap:false},
});

