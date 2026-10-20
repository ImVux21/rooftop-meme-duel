import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Essential for CrazyGames relative asset path in zip
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false
  }
});
