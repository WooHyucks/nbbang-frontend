/*
 * Service Worker - No Cache, Auto Update
 * 캐시를 사용하지 않고 항상 네트워크에서 최신 버전을 가져옵니다.
 * 업데이트 시 즉시 활성화되어 모든 캐시를 정리합니다.
 */

const VERSION = 'v1.0.0'; // 버전을 변경하면 브라우저가 업데이트를 감지합니다

console.log(`[SW] Service Worker ${VERSION} loaded`);

// 설치 시 즉시 활성화
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing ${VERSION}...`);
    self.skipWaiting(); // 대기하지 않고 즉시 활성화
});

// 활성화 시 모든 캐시 삭제 + 클라이언트 제어권 확보
self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating ${VERSION}...`);

    event.waitUntil(
        (async () => {
            // 1. 모든 기존 캐시 삭제
            const cacheNames = await caches.keys();
            console.log('[SW] Deleting all caches:', cacheNames);
            await Promise.all(cacheNames.map((name) => caches.delete(name)));

            // 2. 즉시 모든 클라이언트 제어
            await self.clients.claim();

            console.log(`[SW] ${VERSION} activated successfully!`);
        })(),
    );
});

// fetch 이벤트: 캐시 사용 안 함, 항상 네트워크에서 가져오기
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request, {
            cache: 'no-store', // 캐시 저장 안 함
        }).catch((error) => {
            console.error('[SW] Fetch failed:', error);
            throw error;
        }),
    );
});

// 메시지 수신: 클라이언트로부터 명령 받기
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
