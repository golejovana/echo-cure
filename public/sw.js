self.addEventListener('push', (event) => {
  let data = { title: 'EchoCure', body: 'Imate novo obaveštenje.' };
  try {
    data = event.data.json();
  } catch (e) {
    // fallback
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(clients.openWindow(url));
});
