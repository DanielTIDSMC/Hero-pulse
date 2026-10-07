const CACHE_NAME = 'heropulse-shell-v4';
const APP_SHELL = [
    './',
    './index.html',
    './styles.css',
    './config.js',
    './app.js',
    './manifest.json',
    './assets/icons/icon.svg',
    './assets/icons/icon-192x192.png',
    './assets/icons/icon-512x512.png',
    './assets/avatars/spiderman.jpg',
    './assets/avatars/ironman.jpg',
    './assets/avatars/wolverine.jpg',
    './assets/avatars/thor.jpg',
    './assets/avatars/hulk.jpg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((key) => key.startsWith('heropulse-') && key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
                    }
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return response;
            });
        })
    );
});

self.addEventListener('push', (event) => {
    let data = { title: 'HeroPulse', body: 'Hay una nueva actualización del equipo.' };
    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (error) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(self.registration.showNotification(data.title, {
        body: data.body,
        icon: './assets/icons/icon-192x192.png',
        badge: './assets/icons/icon-192x192.png',
        data: { url: './' }
    }));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            const appWindow = clients.find((client) => 'focus' in client);
            return appWindow ? appWindow.focus() : self.clients.openWindow('./');
        })
    );
});
