import { Check, Trash2 } from "lucide-react";
import { Todo } from "@/hooks/use-todos";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TodoItem = ({ todo, onToggle, onDelete }: TodoItemProps) => {
  return (
    <div className="group flex items-center gap-3 p-3 glass-card mb-2 transition-all duration-200 hover:border-primary/30">
      <button
        onClick={() => onToggle(todo.id)}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
          todo.completed
            ? "bg-primary border-primary"
            : "border-muted-foreground hover:border-primary"
        }`}
      >
        {todo.completed && <Check className="w-3 h-3 text-primary-foreground" />}
      </button>
      <span className={`flex-1 text-sm transition-all duration-200 ${todo.completed ? "todo-checked" : "text-foreground"}`}>
        {todo.text}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all duration-200"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TodoItem;
