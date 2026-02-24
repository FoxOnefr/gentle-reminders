import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { scheduleNotification, cancelNotification } from "@/lib/notifications";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notificationId?: string;
  notified: boolean;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAYS = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem("gr-events");
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [visible, setVisible] = useState(false);

  useEffect(() => { setVisible(true); }, []);
  useEffect(() => {
    localStorage.setItem("gr-events", JSON.stringify(events));
  }, [events]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const formatDate = (d: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const eventsForDate = (dateStr: string) =>
    events.filter((e) => e.date === dateStr);

  const addEvent = async () => {
    if (!newTitle.trim() || !selectedDate) return;
    const id = crypto.randomUUID();
    const [h, m] = newTime.split(":").map(Number);
    const triggerDate = new Date(selectedDate + "T" + newTime);

    let notificationId: string | undefined;
    if (triggerDate > new Date()) {
      notificationId = await scheduleNotification({
        id,
        title: "🔔 Gentle Reminders",
        body: newTitle.trim(),
        triggerDate,
      });
    }

    setEvents((prev) => [
      ...prev,
      {
        id,
        title: newTitle.trim(),
        date: selectedDate,
        time: newTime,
        notificationId,
        notified: false,
      },
    ]);
    setNewTitle("");
    setNewTime("09:00");
    setShowForm(false);
  };

  const deleteEvent = (id: string) => {
    const event = events.find((e) => e.id === id);
    if (event?.notificationId) cancelNotification(event.notificationId);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  return (
    <div className="app-container">
      <header className={cn("app-header", visible && "fade-in")}>
        <div className="header-top">
          <div>
            <h1 className="app-title">Calendrier</h1>
            <p className="app-subtitle">Rappels & événements</p>
          </div>
          <Link to="/" className="calendar-btn" aria-label="Retour">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
        </div>
      </header>

      <main className={cn("calendar-main", visible && "fade-in-delay")}>
        {/* Month navigation */}
        <div className="month-nav">
          <button className="month-btn" onClick={prevMonth}>‹</button>
          <span className="month-label">{MONTHS[month]} {year}</span>
          <button className="month-btn" onClick={nextMonth}>›</button>
        </div>

        {/* Day headers */}
        <div className="cal-grid">
          {DAYS.map((d) => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}

          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = formatDate(day);
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();
            const isSelected = selectedDate === dateStr;
            const hasEvents = eventsForDate(dateStr).length > 0;

            return (
              <button
                key={day}
                className={cn(
                  "cal-day",
                  isToday && "cal-today",
                  isSelected && "cal-selected",
                )}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setShowForm(false);
                }}
              >
                {day}
                {hasEvents && <span className="cal-dot" />}
              </button>
            );
          })}
        </div>

        {/* Selected day panel */}
        {selectedDate && (
          <div className="day-panel">
            <div className="day-panel-header">
              <span className="day-panel-title">
                {new Date(selectedDate + "T12:00").toLocaleDateString("fr-FR", {
                  weekday: "long", day: "numeric", month: "long",
                })}
              </span>
              <button
                className="add-btn small"
                onClick={() => setShowForm((v) => !v)}
                aria-label="Ajouter un événement"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>

            {showForm && (
              <div className="event-form">
                <input
                  className="todo-input"
                  placeholder="Titre du rappel…"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEvent()}
                  autoFocus
                />
                <div className="time-row">
                  <label className="time-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    Heure
                  </label>
                  <input
                    type="time"
                    className="time-input"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
                <button className="confirm-btn" onClick={addEvent}>
                  Programmer le rappel
                </button>
              </div>
            )}

            <ul className="event-list">
              {selectedEvents.length === 0 && !showForm && (
                <li className="empty-state small">
                  <span>Aucun rappel ce jour</span>
                </li>
              )}
              {selectedEvents.map((ev) => (
                <li key={ev.id} className="event-item">
                  <span className="event-time">{ev.time}</span>
                  <span className="event-title">{ev.title}</span>
                  <button
                    className="todo-delete"
                    onClick={() => deleteEvent(ev.id)}
                    aria-label="Supprimer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
