// Service Worker para Web Push - Soul Store
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  let title = '🟢 Soul Store • Nuevo Pedido';
  let body = 'Tienes una nueva actualización en tu pedido.';
  let url = '/admin';
  let tag = 'soul-' + Date.now();

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) body = data.body;
      if (data.url) url = data.url;
      if (data.tag) tag = data.tag;
    } catch (e) {
      const text = event.data.text();
      if (text) body = text;
    }
  }

  const options = {
    body: body,
    icon: '/icon.png',
    badge: '/badge.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: tag,
    renotify: true,
    requireInteraction: true,
    data: {
      url: url,
      dateOfArrival: Date.now(),
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch(function () {
      return self.registration.showNotification(title, {
        body: body,
        data: { url: url },
      });
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client && client.url && client.url.includes(self.location.origin)) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
