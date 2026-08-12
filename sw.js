// ==========================================
// 서비스 워커 (Service Worker) - 모바일 푸시 알림
// ==========================================

const CACHE_NAME = 'praise-sticker-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 백그라운드 푸시 수신 이벤트 핸들러
self.addEventListener('push', (event) => {
    let data = { title: '🎉 새로운 칭찬 스티커 도착!', body: '편집님이 칭찬 스티커를 부착했습니다.' };
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body || '편집님이 칭찬 스티커를 부착했습니다!',
        icon: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'praise-sticker-notification',
        renotify: true,
        data: {
            url: self.registration.scope
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || '🎉 새로운 칭찬 스티커 도착!', options)
    );
});

// 모바일 상단 알림 터치/클릭 시 브라우저 또는 모바일 앱으로 전환
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow('/');
            }
        })
    );
});
