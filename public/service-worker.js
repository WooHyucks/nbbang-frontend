// [Self-Destruct Mode]
// 이 코드는 기존에 설치된 좀비 서비스 워커를 제거하고 페이지를 강제 새로고침합니다.
// 배포 후 브라우저가 이 파일을 감지하면 즉시 설치되어 기존 서비스 워커를 대체하고 자동으로 삭제됩니다.

const CACHE_NAMES = [
    'nbbang-cache-v1',
    'nbbang-cache',
    'workbox-precache-v2',
    'workbox-runtime-cache',
]; // 일반적인 캐시 이름들 포함

console.log('[Service Worker] Self-destruct worker loaded');

self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installing self-destruct worker...');
    // 대기하지 않고 즉시 설치 (가장 중요)
    // 이렇게 하면 기존 서비스 워커를 즉시 대체합니다
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    console.log('[Service Worker] Activating self-destruct worker...');
    
    e.waitUntil(
        Promise.all([
            // 1. 스스로 등록 해제 (Unregister)
            self.registration.unregister()
                .then((success) => {
                    if (success) {
                        console.log('[Service Worker] Successfully unregistered self');
                    } else {
                        console.warn('[Service Worker] Failed to unregister self');
                    }
                })
                .catch((err) => {
                    console.error('[Service Worker] Error unregistering:', err);
                }),
            
            // 2. 모든 캐시 저장소 삭제
            caches.keys()
                .then((keyList) => {
                    console.log('[Service Worker] Found caches:', keyList);
                    return Promise.all(
                        keyList.map((key) => {
                            console.log('[Service Worker] Deleting cache:', key);
                            return caches.delete(key);
                        })
                    );
                })
                .then(() => {
                    console.log('[Service Worker] All caches deleted');
                })
                .catch((err) => {
                    console.error('[Service Worker] Error deleting caches:', err);
                }),
        ])
        .then(() => {
            // 3. 현재 제어 중인 모든 클라이언트(탭) 강제 새로고침
            return self.clients.matchAll({ 
                type: 'window',
                includeUncontrolled: true 
            });
        })
        .then((clients) => {
            console.log('[Service Worker] Found clients:', clients.length);
            clients.forEach((client) => {
                if (client.url && 'navigate' in client) {
                    console.log('[Service Worker] Reloading client:', client.url);
                    client.navigate(client.url);
                } else if (client.focus) {
                    // navigate가 없는 경우 focus 후 reload
                    client.focus();
                    client.postMessage({ type: 'FORCE_RELOAD' });
                }
            });
            
            // 클라이언트가 없는 경우에도 페이지 새로고침 시도
            if (clients.length === 0) {
                console.log('[Service Worker] No clients found, sending reload message');
            }
        })
        .catch((err) => {
            console.error('[Service Worker] Error in activate handler:', err);
        })
    );
});

// 메시지 리스너: 클라이언트로부터 SKIP_WAITING 메시지 받으면 즉시 활성화
self.addEventListener('message', (e) => {
    console.log('[Service Worker] Received message:', e.data);
    if (e.data && e.data.type === 'SKIP_WAITING') {
        console.log('[Service Worker] Skipping waiting...');
        self.skipWaiting();
    }
});

// fetch 이벤트는 처리하지 않음 (모든 요청을 네트워크로 전달)
self.addEventListener('fetch', (e) => {
    // 서비스 워커가 삭제되기 전까지는 네트워크 요청을 그대로 통과시킴
    e.respondWith(fetch(e.request));
});

