import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// import { VitePWA } from 'vite-plugin-pwa'; // PWA 필요 없음

export default defineConfig({
    plugins: [
        react(),
        // PWA 플러그인 제거 - 서비스 워커 수동 관리
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
