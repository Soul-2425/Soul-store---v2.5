self.addEventListener('push', function (event) {
  if (event.data) {
    let data = {};
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '🟢 Soul Store', body: event.data.text() };
    }

    const options = {
      body: data.body || 'Tienes una nueva actualización en Soul Store.',
      icon: data.icon || '/images/whatsapp-icon.png',
      badge: data.badge || '/badge.png',
      image: data.image || undefined,
      vibrate: [200, 100, 200], // Estilo vibración WhatsApp
      tag: data.tag || `soul-msg-${Date.now()}`,
      renotify: true,
      data: {
        dateOfArrival: Date.now(),
        url: data.url || '/',
      },
      actions: [
        {
          action: 'open',
          title: '💬 Ver Pedido',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title || '🟢 Soul Store', options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
