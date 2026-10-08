// Service Worker para Web Push - Soul Store
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  let data = {
    title: '🟢 Soul Store',
    body: 'Tienes una nueva actualización en tu pedido.',
    url: '/',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      const text = event.data.text();
      data = {
        title: '🟢 Soul Store',
        body: text || 'Tienes una nueva notificación de Soul Store.',
        url: '/',
      };
    }
  }

  const title = data.title || '🟢 Soul Store';
  const targetUrl = data.url || data.data?.url || '/';

  const options = {
    body: data.body || 'Tienes una nueva actualización en Soul Store.',
    icon: data.icon || '/icon.png',
    badge: data.badge || '/badge.png',
    image: data.image || undefined,
    vibrate: [300, 100, 300, 100, 300], // Patrón de vibración móvil
    tag: data.tag || `soul-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
    timestamp: Date.now(),
    data: {
      url: targetUrl,
      dateOfArrival: Date.now(),
    },
    actions: [
      {
        action: 'open',
        title: '💬 Ver Detalles',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch(function (err) {
      // Fallback si el dispositivo no soporta ciertos campos como actions
      return self.registration.showNotification(title, {
        body: options.body,
        icon: options.icon,
        data: options.data,
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
