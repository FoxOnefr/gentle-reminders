import { useEffect } from "react";
import { requestNotificationPermission } from "@/lib/notifications";

export function useServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] Registered:", reg.scope);
        // Ask for notification permission on first load
        requestNotificationPermission();
      })
      .catch((err) => console.error("[SW] Registration failed:", err));
  }, []);
}
