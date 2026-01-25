import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';

// 기존 서비스 워커 강제 삭제 (배포된 사이트 사용자 대응)
// 좀비 서비스 워커 완전 제거를 위한 강화된 로직
if ('serviceWorker' in navigator) {
    // 1. 모든 등록된 서비스 워커 찾기 및 삭제
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
            console.log('[Service Worker] Unregistering:', registration.scope);
            registration.unregister().then((success) => {
                if (success) {
                    console.log('[Service Worker] Successfully unregistered:', registration.scope);
                } else {
                    console.warn('[Service Worker] Failed to unregister:', registration.scope);
                }
            });
        });
    });

    // 2. ready 상태의 서비스 워커도 삭제
    navigator.serviceWorker.ready.then((registration) => {
        console.log('[Service Worker] Unregistering ready worker:', registration.scope);
        registration.unregister().then((success) => {
            if (success) {
                console.log('[Service Worker] Ready worker unregistered successfully');
                // 캐시도 함께 삭제
                if ('caches' in window) {
                    caches.keys().then((keys) => {
                        keys.forEach((key) => {
                            caches.delete(key).then(() => {
                                console.log('[Cache] Deleted:', key);
                            });
                        });
                    });
                }
            }
        });
    });

    // 3. 컨트롤러가 있는 경우 즉시 제거
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
}

// TanStack Query Client 생성
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <QueryClientProvider client={queryClient}>
        <App />
    </QueryClientProvider>
);
