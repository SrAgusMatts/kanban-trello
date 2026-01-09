import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Edit } from "lucide-react";

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
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
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
    >
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

      <p className="task-content">{task.content}</p>

      {mouseIsOver && (
        <div className="task-actions">
          <button
            className="btn-action"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(task);
            }}
          >
            <Edit size={18} />
          </button>

          <button
            className="btn-delete"
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task.id);
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  );
};