import { useState } from "react";
import { Trash2, Edit, Check } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const TaskCard = ({ task, deleteTask, updateTask }) => {
  const [editMode, setEditMode] = useState(false);
  const [mouseIsOver, setMouseIsOver] = useState(false);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
    disabled: editMode,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
    setMouseIsOver(false);
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, opacity: 0.3, border: "2px dashed #58a6ff" }}
        className="task-card"
      />
    );
  }

  if (editMode) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="task-card task-card-editing"
      >
        <textarea
          className="task-input"
          value={task.content}
          autoFocus
          placeholder="Escribe tu tarea aquí..."
          onBlur={toggleEditMode}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              toggleEditMode();
            }
          }}
          onChange={(e) => updateTask(task.id, e.target.value)}
        ></textarea>

        <button 
            className="btn-save" 
            onMouseDown={(e) => {
                e.preventDefault(); 
                toggleEditMode();
            }}
        >
            <Check size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="task-card"
      onMouseEnter={() => setMouseIsOver(true)}
      onMouseLeave={() => setMouseIsOver(false)}
    >
      <p style={{ whiteSpace: "pre-wrap", overflow: "hidden" }}>
        {task.content}
      </p>

      {mouseIsOver && (
        <div className="task-actions">
          <button 
            className="btn-action" 
            onClick={toggleEditMode}
            title="Editar"
          >
            <Edit size={16} />
          </button>
          
          <button 
            className="btn-action btn-delete" 
            onClick={() => deleteTask(task.id)}
            title="Borrar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};