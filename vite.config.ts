import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Per GitHub Pages puoi compilare con:
// BASE_PATH=/nome-repository/ npm run build
// Su Cloudflare Pages, Netlify, Vercel e Surge puoi lasciare BASE_PATH non impostato.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx']
  }
});
