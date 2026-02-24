import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { CalendarEvent } from "@/hooks/use-todos";
import { Plus, Trash2, Bell, BellOff } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (title: string, date: Date) => void;
  onDeleteEvent: (id: string) => void;
  onDismissEvent: (id: string) => void;
}

const CalendarView = ({ events, onAddEvent, onDeleteEvent, onDismissEvent }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && selectedDate) {
      onAddEvent(newTitle.trim(), selectedDate);
      setNewTitle("");
    }
  };

  const eventsForDate = events.filter(e => isSameDay(new Date(e.date), selectedDate));
  const eventDates = events.map(e => new Date(e.date));
  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => d && setSelectedDate(d)}
          locale={fr}
          modifiers={{ event: eventDates }}
          modifiersClassNames={{ event: "!bg-primary/20 !text-primary font-bold" }}
          className="glass-card p-3 rounded-lg"
        />
      </div>

      <div className="glass-card p-4 rounded-lg">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {format(selectedDate, "d MMMM yyyy", { locale: fr })}
        </h3>

        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Nouvel événement..."
            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          <button
            type="submit"
            className="bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {eventsForDate.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun événement</p>
        ) : (
          <div className="space-y-2">
            {eventsForDate.map(event => {
              const isActive = new Date(event.date) <= now && !event.dismissed;
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isActive
                      ? "border-primary/50 bg-primary/10 animate-pulse"
                      : event.dismissed
                      ? "border-border bg-secondary/50 opacity-60"
                      : "border-border bg-secondary"
                  }`}
                >
                  {isActive ? (
                    <Bell className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : event.dismissed ? (
                    <BellOff className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <Bell className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={`flex-1 text-sm ${event.dismissed ? "todo-checked" : "text-foreground"}`}>
                    {event.title}
                  </span>
                  {isActive && (
                    <button
                      onClick={() => onDismissEvent(event.id)}
                      className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90 transition-opacity"
                    >
                      Désactiver
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteEvent(event.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
