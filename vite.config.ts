import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const readNvidiaKey = () => {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const contents = fs.readFileSync(envPath, 'utf8');
    const match = contents.match(/^NVIDIA_API_KEY=(?:"([^"]+)"|([^"\r\n]+))/m);
    return match?.[1] || match?.[2] || '';
  } catch {
    return '';
  }
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './test/setup.ts'
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-charts': ['lightweight-charts'],
              'vendor-tiptap': [
                '@tiptap/react',
                '@tiptap/starter-kit',
                '@tiptap/extension-image',
                '@tiptap/extension-link',
                '@tiptap/extension-table',
                '@tiptap/extension-color',
                '@tiptap/extension-text-style',
                '@tiptap/extension-underline',
                '@tiptap/extension-task-list',
                '@tiptap/extension-task-item',
              ],
              'vendor-ui': ['@dnd-kit/core', '@dnd-kit/sortable', 'motion', 'lucide-react'],
              'vendor-ai': ['@google/generative-ai', 'agentation'],
            },
          },
        },
        chunkSizeWarningLimit: 600,
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/metaapi-provisioning': {
            target: 'https://mt-provisioning-api-v1.metaapi.cloud',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api\/metaapi-provisioning/, ''),
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('proxy error', err);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('Sending Request to the Target:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
              });
            }
          },
          '/api/metaapi-client': {
            target: 'https://mt-client-api-v1.new-york.metaapi.cloud',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api\/metaapi-client/, ''),
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('proxy error', err);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('Sending Request to the Target:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
              });
            }
          },
          '/api/nvidia': {
            target: 'https://integrate.api.nvidia.com',
            changeOrigin: true,
            secure: true,
            rewrite: () => '/v1/chat/completions',
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                const nvidiaKey = readNvidiaKey() || env.NVIDIA_API_KEY || env.VITE_NVIDIA_API_KEY;
                if (nvidiaKey) {
                  proxyReq.setHeader('Authorization', `Bearer ${nvidiaKey}`);
                }
                console.log('Sending Request to NVIDIA:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('Received Response from NVIDIA:', proxyRes.statusCode, req.url);
              });
              proxy.on('error', (err, _req, _res) => {
                console.log('NVIDIA proxy error', err);
              });
            }
          },
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'use-sync-external-store/shim': path.resolve(__dirname, 'shims/use-sync-external-store/shim'),
        }
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'lucide-react'],
        exclude: ['@google/generative-ai'],
      }
    };
});
