/**
 * Notifications utility
 * Requests permission and schedules notifications via Service Worker.
 * On mobile PWA, the SW will fire the notification even when the app is closed.
 */

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
 * Schedules a notification via the Service Worker.
 * Returns the notification id (same as options.id).
 */
export async function scheduleNotification(options: ScheduleOptions): Promise<string | undefined> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    console.warn("[Notifications] Permission denied");
    return undefined;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn("[Notifications] Service Worker not supported");
    return undefined;
  }

  const reg = await navigator.serviceWorker.ready;

  // Send schedule request to service worker
  reg.active?.postMessage({
    type: "SCHEDULE_NOTIFICATION",
    payload: {
      id: options.id,
      title: options.title,
      body: options.body,
      triggerTimestamp: options.triggerDate.getTime(),
    },
  });

  return options.id;
}

/**
 * Cancels a scheduled notification.
 */
export async function cancelNotification(id: string): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  reg.active?.postMessage({
    type: "CANCEL_NOTIFICATION",
    payload: { id },
  });
}
