import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export default function Index() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem("gr-todos");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("gr-todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      { id: crypto.randomUUID(), text: trimmed, done: false, createdAt: Date.now() },
      ...prev,
    ]);
    setInput("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const remaining = todos.filter((t) => !t.done).length;
  const total = todos.length;

  return (
    <div className="app-container">
      <header className={cn("app-header", visible && "fade-in")}>
        <div className="header-top">
          <div>
            <h1 className="app-title">Gentle<br />Reminders</h1>
            <p className="app-subtitle">
              {total === 0
                ? "Rien pour aujourd'hui"
                : remaining === 0
                ? "Tout est fait ✓"
                : `${remaining} chose${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`}
            </p>
          </div>
          <Link to="/calendar" className="calendar-btn" aria-label="Calendrier">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </Link>
        </div>

        {total > 0 && (
          <div className="progress-bar-wrap">
            <div
              className="progress-bar-fill"
              style={{ width: `${((total - remaining) / total) * 100}%` }}
            />
          </div>
        )}
      </header>

      <main className={cn("todo-main", visible && "fade-in-delay")}>
        <div className="add-row">
          <input
            className="todo-input"
            placeholder="Ajouter une tâche…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
          />
          <button className="add-btn" onClick={addTodo} aria-label="Ajouter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <ul className="todo-list">
          {todos.length === 0 && (
            <li className="empty-state">
              <span className="empty-icon">◎</span>
              <span>Ta journée est libre</span>
            </li>
          )}
          {todos.map((todo, i) => (
            <li
              key={todo.id}
              className={cn("todo-item", todo.done && "todo-done")}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <button
                className="todo-check"
                onClick={() => toggleTodo(todo.id)}
                aria-label={todo.done ? "Décocher" : "Cocher"}
              >
                {todo.done ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12l3 3 5-5" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </button>
              <span className="todo-text">{todo.text}</span>
              <button
                className="todo-delete"
                onClick={() => deleteTodo(todo.id)}
                aria-label="Supprimer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
