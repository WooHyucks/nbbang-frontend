import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';

// 기존 서비스 워커 강제 삭제 (배포된 사이트 사용자 대응)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
        registration.unregister();
    });
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
