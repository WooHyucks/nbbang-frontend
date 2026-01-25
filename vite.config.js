import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            strategies: 'injectManifest', // 커스텀 서비스 워커 사용
            srcDir: 'public',
            filename: 'service-worker.js',
            injectManifest: {
                injectionPoint: undefined, // 자동 주입 비활성화
            },
            registerType: 'autoUpdate',
            manifest: false,
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            // Supabase Edge Functions 프록시 설정
            '/api': {
                target: 'https://qdvwwnylfhhevwzdfumm.supabase.co/functions/v1',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
                configure: (proxy, _options) => {
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        // CORS 헤더 추가
                        proxyReq.setHeader('Origin', 'http://localhost:3000');
                    });
                },
            },
        },
    },
});
