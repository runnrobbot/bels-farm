import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

interface ShimReq {
  method?: string;
  headers: IncomingMessage['headers'];
  body: unknown;
}
interface ShimRes {
  statusCode: number;
  status(code: number): ShimRes;
  json(body: unknown): void;
  setHeader(key: string, value: string): void;
  end(body?: string): void;
}

/**
 * Dev-only bridge so the Vercel serverless functions in /api also work under
 * `npm run dev`. It reads the request body, transpiles the handler via Vite's
 * SSR loader, and adapts a minimal (req,res) shim. Production uses real Vercel
 * functions, so this plugin only applies during `serve`.
 */
function devApiPlugin(): Plugin {
  return {
    name: 'bels-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/')) return next();
        const route = url.split('?')[0].replace(/^\/api\//, '').replace(/\/+$/, '');
        const file = path.resolve(__dirname, 'api', `${route}.ts`);
        if (!fs.existsSync(file)) return next();

        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          void (async () => {
            const shimRes: ShimRes = {
              statusCode: 200,
              status(code) {
                this.statusCode = code;
                return this;
              },
              json(body) {
                res.statusCode = this.statusCode;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(body));
              },
              setHeader(key, value) {
                res.setHeader(key, value);
              },
              end(body) {
                res.end(body);
              },
            };
            try {
              const raw = Buffer.concat(chunks).toString('utf8');
              let parsed: unknown;
              try {
                parsed = raw ? (JSON.parse(raw) as unknown) : undefined;
              } catch {
                parsed = undefined;
              }
              const shimReq: ShimReq = { method: req.method, headers: req.headers, body: parsed };
              const mod = await server.ssrLoadModule(`/api/${route}.ts`);
              const handler = (mod as { default: (rq: ShimReq, rs: ShimRes) => Promise<void> | void })
                .default;
              await handler(shimReq, shimRes);
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'dev api error' }));
            }
          })();
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Expose ALL env vars (incl. non-VITE server secrets) to the dev /api handlers.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    plugins: [
      react(),
      devApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'BELS FARM — Livestock ERP',
          short_name: 'BELS FARM',
          description: 'ERP + CRM + Livestock Management System for BELS FARM',
          theme_color: '#ffffff',
          background_color: '#f6faf7',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          navigateFallbackDenylist: [/^\/api/, /^\/auth/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/storage/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'supabase-storage',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    build: {
      target: 'es2022',
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
            'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
            'anim-vendor': ['animejs'],
          },
        },
      },
    },
  };
});
