// ==========================================
// 서비스 워커 (Service Worker) - 모바일 백그라운드 푸시 알림
// ==========================================

const CACHE_NAME = 'praise-sticker-v3';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 백그라운드 푸시 수신 이벤트 핸들러 (스티커 메모 수신 비활성화, 고정 단일 문구만 출력)
self.addEventListener('push', (event) => {
    const title = '새로운 스티커가 붙었습니다.';
    const body = '새로운 스티커가 붙었습니다.';

    const options = {
        body: body,
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
        self.registration.showNotification(title, options)
    );
});

// 클라이언트 메시지 수신 (페이지 닫힘/백그라운드 지원)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_STICKER_NOTIFICATION') {
        const title = '새로운 스티커가 붙었습니다.';
        const body = '새로운 스티커가 붙었습니다.';
        const options = {
            body: body,
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
            self.registration.showNotification(title, options)
        );
    }
});

// 모바일 상단 알림 터치 시 스티커판 앱으로 전환 및 열기
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
                return self.clients.openWindow('./index.html');
            }
        })
    );
});
