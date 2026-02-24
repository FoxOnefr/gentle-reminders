import { useState, useEffect } from "react";
import { CheckSquare, Calendar as CalendarIcon } from "lucide-react";
import { useTodos, useEvents } from "@/hooks/use-todos";
import TodoItem from "@/components/TodoItem";
import AddTodo from "@/components/AddTodo";
import CalendarView from "@/components/CalendarView";
import AlertBanner from "@/components/AlertBanner";

const Index = () => {
  const [tab, setTab] = useState<"todos" | "calendar">("todos");
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos();
  const { events, addEvent, deleteEvent, dismissEvent, getActiveAlerts } = useEvents();
  const [alerts, setAlerts] = useState(getActiveAlerts());

  // Check for alerts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(getActiveAlerts());
    }, 30000);
    setAlerts(getActiveAlerts());
    return () => clearInterval(interval);
  }, [getActiveAlerts]);

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Ma journée</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Alerts */}
        <AlertBanner alerts={alerts} onDismiss={(id) => { dismissEvent(id); setAlerts(getActiveAlerts()); }} />

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-secondary rounded-lg p-1">
          <button
            onClick={() => setTab("todos")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              tab === "todos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Tâches
          </button>
          <button
            onClick={() => setTab("calendar")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              tab === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendrier
          </button>
        </div>

        {/* Content */}
        {tab === "todos" ? (
          <div>
            <AddTodo onAdd={addTodo} />

            {activeTodos.length === 0 && completedTodos.length === 0 && (
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucune tâche pour le moment</p>
              </div>
            )}

            {activeTodos.map(todo => (
              <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
            ))}

            {completedTodos.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-6 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">Terminées ({completedTodos.length})</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {completedTodos.map(todo => (
                  <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
                ))}
              </>
            )}
          </div>
        ) : (
          <CalendarView
            events={events}
            onAddEvent={addEvent}
            onDeleteEvent={deleteEvent}
            onDismissEvent={(id) => { dismissEvent(id); setAlerts(getActiveAlerts()); }}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
