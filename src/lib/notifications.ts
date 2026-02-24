export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export interface ScheduleOptions {
  id: string;
  title: string;
  body: string;
  triggerDate: Date;
}

/**
 * Attend que le SW soit actif (pas juste enregistré)
 */
async function getActiveWorker(): Promise<ServiceWorker | null> {
  if (!("serviceWorker" in navigator)) return null;

  const reg = await navigator.serviceWorker.ready;

  // Si déjà actif, on l'utilise directement
  if (reg.active) return reg.active;

  // Sinon on attend l'activation
  return new Promise((resolve) => {
    const sw = reg.installing || reg.waiting;
    if (!sw) { resolve(null); return; }
    sw.addEventListener("statechange", function handler() {
      if (sw.state === "activated") {
        sw.removeEventListener("statechange", handler);
        resolve(sw);
      }
    });
    setTimeout(() => resolve(null), 8000); // Timeout 8s
  });
}

export async function scheduleNotification(options: ScheduleOptions): Promise<string | undefined> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    console.warn("[Notifications] Permission refusée");
    return undefined;
  }

  const worker = await getActiveWorker();
  if (!worker) {
    console.warn("[Notifications] Service Worker non disponible");
    return undefined;
  }

  return new Promise((resolve) => {
    // Écoute la confirmation du SW
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_SCHEDULED" && event.data?.id === options.id) {
        navigator.serviceWorker.removeEventListener("message", handler);
        resolve(options.id);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);

    // Timeout si pas de confirmation dans 5s
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener("message", handler);
      resolve(undefined);
    }, 5000);

    worker.postMessage({
      type: "SCHEDULE_NOTIFICATION",
      payload: {
        id: options.id,
        title: options.title,
        body: options.body,
        triggerTimestamp: options.triggerDate.getTime(),
      },
    });
  });
}

export async function cancelNotification(id: string): Promise<void> {
  const worker = await getActiveWorker();
  worker?.postMessage({ type: "CANCEL_NOTIFICATION", payload: { id } });
}

/** Envoie une notification de test immédiate — utile pour vérifier que tout fonctionne */
export async function testNotification(): Promise<void> {
  const worker = await getActiveWorker();
  worker?.postMessage({ type: "TEST_NOTIFICATION" });
}
