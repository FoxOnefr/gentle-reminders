import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { scheduleNotification, cancelNotification } from "@/lib/notifications";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  notificationId?: string;
  notified: boolean;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS = ["Di","Lu","Ma","Me","Je","Ve","Sa"];

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem("gr-events");
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [visible, setVisible] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setVisible(true); }, []);
  useEffect(() => {
    localStorage.setItem("gr-events", JSON.stringify(events));
  }, [events]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, calMonth);
  const firstDay = getFirstDayOfMonth(year, calMonth);

  const formatDate = (d: number) => {
    const mm = String(calMonth + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const eventsForDate = (dateStr: string) => events.filter((e) => e.date === dateStr);

  const addEvent = async () => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle || !selectedDate) return;

    setLoading(true);
    const id = crypto.randomUUID();
    const triggerDate = new Date(selectedDate + "T" + newTime);
    const isPast = triggerDate <= new Date();

    let notificationId: string | undefined;
    let notifStatus: "scheduled" | "past" | "failed" = "past";

    if (!isPast) {
      try {
        // Timeout 5s si le SW ne répond pas
        notificationId = await Promise.race([
          scheduleNotification({ id, title: "🔔 Gentle Reminders", body: trimmedTitle, triggerDate }),
          new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 5000)),
        ]);
        notifStatus = notificationId ? "scheduled" : "failed";
      } catch (err) {
        console.error("[Calendar] scheduleNotification error:", err);
        notifStatus = "failed";
      }
    }

    setEvents((prev) => [...prev, { id, title: trimmedTitle, date: selectedDate, time: newTime, notificationId, notified: false }]);

    if (notifStatus === "scheduled") setStatusMsg("✓ Rappel programmé");
    else if (notifStatus === "past") setStatusMsg("⚠ Heure passée — rappel enregistré sans alarme");
    else setStatusMsg("⚠ Rappel enregistré (autorise les notifications dans les réglages)");
    setTimeout(() => setStatusMsg(""), 4000);

    setNewTitle("");
    setNewTime("09:00");
    setShowForm(false);
    setLoading(false);
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
        <div className="month-nav">
          <button className="month-btn" onClick={prevMonth}>‹</button>
          <span className="month-label">{MONTHS[calMonth]} {year}</span>
          <button className="month-btn" onClick={nextMonth}>›</button>
        </div>

        <div className="cal-grid">
          {DAYS.map((d) => <div key={d} className="cal-day-header">{d}</div>)}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = formatDate(day);
            const isToday = day === today.getDate() && calMonth === today.getMonth() && year === today.getFullYear();
            const isSelected = selectedDate === dateStr;
            const hasEvents = eventsForDate(dateStr).length > 0;
            return (
              <button key={day} className={cn("cal-day", isToday && "cal-today", isSelected && "cal-selected")}
                onClick={() => { setSelectedDate(dateStr); setShowForm(false); setStatusMsg(""); }}>
                {day}
                {hasEvents && <span className="cal-dot" />}
              </button>
            );
          })}
        </div>

        {statusMsg && (
          <div className={cn("status-msg", statusMsg.startsWith("✓") ? "status-ok" : "status-warn")}>
            {statusMsg}
          </div>
        )}

        {selectedDate && (
          <div className="day-panel">
            <div className="day-panel-header">
              <span className="day-panel-title">
                {new Date(selectedDate + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              <button className="add-btn small" onClick={() => { setShowForm((v) => !v); setStatusMsg(""); }} aria-label="Ajouter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>

            {showForm && (
              <div className="event-form">
                <input className="todo-input" placeholder="Titre du rappel…" value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && addEvent()}
                  autoFocus disabled={loading} />
                <div className="time-row">
                  <label className="time-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                    </svg>
                    Heure
                  </label>
                  <input type="time" className="time-input" value={newTime}
                    onChange={(e) => setNewTime(e.target.value)} disabled={loading} />
                </div>
                <button className="confirm-btn" onClick={addEvent} disabled={loading || !newTitle.trim()}>
                  {loading ? "Enregistrement…" : "Programmer le rappel"}
                </button>
              </div>
            )}

            <ul className="event-list">
              {selectedEvents.length === 0 && !showForm && (
                <li className="empty-state small"><span>Aucun rappel ce jour</span></li>
              )}
              {selectedEvents.map((ev) => (
                <li key={ev.id} className="event-item">
                  <span className="event-time">{ev.time}</span>
                  <span className="event-title">{ev.title}</span>
                  <button className="todo-delete" onClick={() => deleteEvent(ev.id)} aria-label="Supprimer">
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