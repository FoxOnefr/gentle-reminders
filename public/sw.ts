/// <reference lib="webworker" />

// Cast self once — évite le conflit avec la déclaration globale de webworker
const sw = self as unknown as ServiceWorkerGlobalScope;

// ─── Store des notifications planifiées ─────────────────────────────────────
const scheduled = new Map<string, {
  title: string;
  body: string;
  triggerTimestamp: number;
  timeoutId: ReturnType<typeof setTimeout>;
}>();

const STORE_KEY = "gr-scheduled-notifications";

// ─── Persistance dans CacheStorage (survit aux redémarrages du SW) ───────────
async function persistScheduled(): Promise<void> {
  const data = Array.from(scheduled.entries()).map(([id, v]) => ({
    id,
    title: v.title,
    body: v.body,
    triggerTimestamp: v.triggerTimestamp,
  }));
  const cache = await caches.open(STORE_KEY);
  await cache.put(
    "data",
    new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    })
  );
}

async function loadScheduled(): Promise<void> {
  try {
    const cache = await caches.open(STORE_KEY);
    const res = await cache.match("data");
    if (!res) return;
    const data: { id: string; title: string; body: string; triggerTimestamp: number }[] =
      await res.json();
    for (const item of data) {
      scheduleItem(item.id, item.title, item.body, item.triggerTimestamp);
    }
  } catch {
    // Cache vide ou corrompu — on ignore
  }
}

// ─── Planification ───────────────────────────────────────────────────────────
function scheduleItem(
  id: string,
  title: string,
  body: string,
  triggerTimestamp: number
): void {
  const delay = triggerTimestamp - Date.now();

  if (delay <= 0) {
    // Date déjà passée — on envoie immédiatement
    fireNotification(id, title, body);
    return;
  }

  const timeoutId = setTimeout(() => {
    fireNotification(id, title, body);
    scheduled.delete(id);
    persistScheduled();
  }, delay);

  scheduled.set(id, { title, body, triggerTimestamp, timeoutId });
}

function fireNotification(id: string, title: string, body: string): void {
  sw.registration.showNotification(title, {
    body,
    tag: id,
    requireInteraction: true, // La notif reste jusqu'à interaction de l'utilisateur
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { id },
    // actions est une propriété étendue non incluse dans le type standard — cast nécessaire
    ...({ actions: [
      { action: "open", title: "Ouvrir l'app" },
      { action: "dismiss", title: "Ignorer" },
    ] } as object),
  } as NotificationOptions);
}

// ─── Messages depuis le thread principal ─────────────────────────────────────
sw.addEventListener("message", (event: ExtendableMessageEvent) => {
  const { type, payload } = (event.data as { type: string; payload: Record<string, unknown> }) || {};

  if (type === "SCHEDULE_NOTIFICATION") {
    const { id, title, body, triggerTimestamp } = payload as {
      id: string;
      title: string;
      body: string;
      triggerTimestamp: number;
    };
    // Annule l'existant si déjà planifié
    if (scheduled.has(id)) {
      clearTimeout(scheduled.get(id)!.timeoutId);
      scheduled.delete(id);
    }
    scheduleItem(id, title, body, triggerTimestamp);
    persistScheduled();
  }

  if (type === "CANCEL_NOTIFICATION") {
    const { id } = payload as { id: string };
    if (scheduled.has(id)) {
      clearTimeout(scheduled.get(id)!.timeoutId);
      scheduled.delete(id);
      persistScheduled();
    }
    // Ferme aussi la notification visible si elle est affichée
    sw.registration
      .getNotifications({ tag: id })
      .then((notifs) => notifs.forEach((n) => n.close()));
  }
});

// ─── Clic sur une notification ───────────────────────────────────────────────
sw.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  event.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        if (clients.length > 0) return clients[0].focus();
        return sw.clients.openWindow("/");
      })
  );
});

// ─── Lifecycle ───────────────────────────────────────────────────────────────
sw.addEventListener("install", () => {
  sw.skipWaiting(); // Active le nouveau SW immédiatement
});

sw.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    Promise.all([
      sw.clients.claim(), // Prend le contrôle des clients ouverts sans rechargement
      loadScheduled(),    // Recharge les notifications planifiées depuis le cache
    ])
  );
});