import { useState, useCallback } from "react";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  notified: boolean;
  dismissed: boolean;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem("todos");
    return saved ? JSON.parse(saved, (key, value) => key === "createdAt" ? new Date(value) : value) : [];
  });

  const save = (updated: Todo[]) => {
    setTodos(updated);
    localStorage.setItem("todos", JSON.stringify(updated));
  };

  const addTodo = useCallback((text: string) => {
    const newTodo: Todo = { id: crypto.randomUUID(), text, completed: false, createdAt: new Date() };
    save([newTodo, ...todos]);
  }, [todos]);

  const toggleTodo = useCallback((id: string) => {
    save(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, [todos]);

  const deleteTodo = useCallback((id: string) => {
    save(todos.filter(t => t.id !== id));
  }, [todos]);

  return { todos, addTodo, toggleTodo, deleteTodo };
}

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem("events");
    return saved ? JSON.parse(saved, (key, value) => key === "date" ? new Date(value) : value) : [];
  });

  const save = (updated: CalendarEvent[]) => {
    setEvents(updated);
    localStorage.setItem("events", JSON.stringify(updated));
  };

  const addEvent = useCallback((title: string, date: Date) => {
    const newEvent: CalendarEvent = { id: crypto.randomUUID(), title, date, notified: false, dismissed: false };
    save([...events, newEvent]);
  }, [events]);

  const deleteEvent = useCallback((id: string) => {
    save(events.filter(e => e.id !== id));
  }, [events]);

  const dismissEvent = useCallback((id: string) => {
    save(events.map(e => e.id === id ? { ...e, dismissed: true } : e));
  }, [events]);

  const getActiveAlerts = useCallback(() => {
    const now = new Date();
    return events.filter(e => new Date(e.date) <= now && !e.dismissed);
  }, [events]);

  return { events, addEvent, deleteEvent, dismissEvent, getActiveAlerts };
}
