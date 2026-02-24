import { useEffect } from "react";
import { CalendarEvent } from "@/hooks/use-todos";
import { Bell, X } from "lucide-react";

interface AlertBannerProps {
  alerts: CalendarEvent[];
  onDismiss: (id: string) => void;
}

const AlertBanner = ({ alerts, onDismiss }: AlertBannerProps) => {
  useEffect(() => {
    if (alerts.length > 0 && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    alerts.forEach(alert => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⏰ Rappel", {
          body: alert.title,
          requireInteraction: true,
          tag: alert.id,
        });
      }
    });
  }, [alerts]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-primary/50 bg-primary/10 animate-pulse"
        >
          <Bell className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="flex-1 text-sm font-medium text-foreground">{alert.title}</span>
          <button
            onClick={() => onDismiss(alert.id)}
            className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Désactiver
          </button>
        </div>
      ))}
    </div>
  );
};

export default AlertBanner;
