/* 
 * Service Worker - Cache Bypass Mode
 * 이 서비스 워커는 캐시를 사용하지 않고 모든 요청을 네트워크에서 직접 가져옵니다.
 * 브라우저가 이 파일의 변경을 감지하면 자동으로 업데이트되어 기존 캐시를 정리합니다.
 */

const CACHE_VERSION = 'no-cache-v1';

// 설치 시 즉시 활성화
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing (no-cache mode)...');
    // 대기하지 않고 즉시 활성화
    self.skipWaiting();
});

// 활성화 시 모든 캐시 삭제
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating (no-cache mode)...');
    
    event.waitUntil(
        Promise.all([
            // 1. 모든 기존 캐시 삭제
            caches.keys().then((cacheNames) => {
                console.log('[Service Worker] Found caches:', cacheNames);
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        console.log('[Service Worker] Deleting cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            }),
            // 2. 즉시 모든 클라이언트 제어
            self.clients.claim(),
        ]).then(() => {
            console.log('[Service Worker] All caches cleared, now active');
        })
    );
});

// fetch 이벤트: 캐시를 사용하지 않고 항상 네트워크에서 가져오기
self.addEventListener('fetch', (event) => {
    // 모든 요청을 네트워크에서 직접 가져옴 (캐시 사용 안 함)
    event.respondWith(
        fetch(event.request, {
            cache: 'no-store', // 캐시 저장 안 함
        }).catch((error) => {
            // 네트워크 실패 시 에러 로깅
            console.error('[Service Worker] Fetch failed:', error);
            throw error;
        })
    );
});

// 메시지 수신: 클라이언트로부터 명령 받기
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

