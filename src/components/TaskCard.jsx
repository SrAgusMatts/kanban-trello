import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, CalendarClock } from "lucide-react";

export const TaskCard = ({ task, deleteTask, openEditModal }) => {
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
    data: { type: "Task", task },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    // +1 día para compensar la zona horaria al guardar solo YYYY-MM-DD
    const dateUser = new Date(date.valueOf() + date.getTimezoneOffset() * 60000); 
    return dateUser.toLocaleDateString("es-ES", { day: '2-digit', month: '2-digit' });
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="task-card opacity-30 border-2 border-blue-500"
      />
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
      onClick={() => openEditModal(task)}
    >
      {/* ETIQUETAS */}
      {task.tags && task.tags.length > 0 && (
        <div className="task-tags-container">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="task-tag-mini"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* CONTENIDO (RENDER HTML SEGURO) */}
      <div 
        className="task-content"
        dangerouslySetInnerHTML={{ __html: task.content }} 
      />

      {/* FECHA (Si existe) */}
      {task.dueDate && (
        <div className="task-date-badge">
            <CalendarClock size={14} />
            <span>{formatDate(task.dueDate)}</span>
        </div>
      )}

      {/* BOTÓN BORRAR RÁPIDO */}
      {mouseIsOver && (
        <div className="task-actions">
          <button
            className="btn-delete"
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task.id);
            }}
            title="Borrar tarea"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};