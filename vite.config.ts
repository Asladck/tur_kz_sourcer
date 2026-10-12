import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import site from './site.config.json' with { type: 'json' };

export default defineConfig({
  base: site.basePath,
  plugins: [react()],
  // The main chunk embeds the whole corpus (toponyms_kz_tr.json); the map chunk
  // is MapLibre GL and is loaded only on the map page.
  build: { chunkSizeWarningLimit: 1200 },
});
