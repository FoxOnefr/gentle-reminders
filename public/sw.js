// Service Worker - JavaScript pur (pas de TypeScript)

var scheduled = {};
var STORE_KEY = "gr-scheduled-notifications";

function persistScheduled() {
  var data = Object.keys(scheduled).map(function(id) {
    return { id: id, title: scheduled[id].title, body: scheduled[id].body, triggerTimestamp: scheduled[id].triggerTimestamp };
  });
  return caches.open(STORE_KEY).then(function(cache) {
    return cache.put("data", new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } }));
  });
}

function loadScheduled() {
  return caches.open(STORE_KEY).then(function(cache) {
    return cache.match("data").then(function(res) {
      if (!res) return;
      return res.json().then(function(data) {
        data.forEach(function(item) {
          scheduleItem(item.id, item.title, item.body, item.triggerTimestamp);
        });
      });
    });
  }).catch(function() {});
}

function scheduleItem(id, title, body, triggerTimestamp) {
  var delay = triggerTimestamp - Date.now();
  if (delay <= 0) {
    fireNotification(id, title, body);
    return;
  }
  // Annule l'existant
  if (scheduled[id] && scheduled[id].timeoutId) {
    clearTimeout(scheduled[id].timeoutId);
  }
  var timeoutId = setTimeout(function() {
    fireNotification(id, title, body);
    delete scheduled[id];
    persistScheduled();
  }, delay);
  scheduled[id] = { title: title, body: body, triggerTimestamp: triggerTimestamp, timeoutId: timeoutId };
}

function fireNotification(id, title, body) {
  return self.registration.showNotification(title, {
    body: body,
    tag: id,
    requireInteraction: true,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { id: id },
    actions: [
      { action: "open", title: "Ouvrir l'app" },
      { action: "dismiss", title: "Ignorer" }
    ]
  });
}

self.addEventListener("message", function(event) {
  var data = event.data || {};
  var type = data.type;
  var payload = data.payload || {};

  if (type === "SCHEDULE_NOTIFICATION") {
    var id = payload.id;
    var title = payload.title;
    var body = payload.body;
    var triggerTimestamp = payload.triggerTimestamp;
    if (scheduled[id] && scheduled[id].timeoutId) {
      clearTimeout(scheduled[id].timeoutId);
      delete scheduled[id];
    }
    scheduleItem(id, title, body, triggerTimestamp);
    persistScheduled();
    // Confirme la réception au thread principal
    if (event.source) {
      event.source.postMessage({ type: "NOTIFICATION_SCHEDULED", id: id });
    }
  }

  if (type === "CANCEL_NOTIFICATION") {
    var cid = payload.id;
    if (scheduled[cid] && scheduled[cid].timeoutId) {
      clearTimeout(scheduled[cid].timeoutId);
      delete scheduled[cid];
      persistScheduled();
    }
    self.registration.getNotifications({ tag: cid }).then(function(notifs) {
      notifs.forEach(function(n) { n.close(); });
    });
  }

  // Test immédiat pour debug
  if (type === "TEST_NOTIFICATION") {
    fireNotification("test-" + Date.now(), "🔔 Test", "Les notifications fonctionnent !");
  }
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  if (event.action === "dismiss") return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clients) {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow("/");
    })
  );
});

self.addEventListener("install", function() {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    Promise.all([self.clients.claim(), loadScheduled()])
  );
});