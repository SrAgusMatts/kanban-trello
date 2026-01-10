import { useMemo, useState } from "react";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./TaskCard";
import { MoreHorizontal, Plus, Trash2, Edit, X } from "lucide-react";

export const ColumnContainer = ({ 
    column, 
    onAddClick, 
    deleteTask, 
    updateTask, 
    deleteColumn, 
    updateColumn, 
    openEditModal 
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const taskIds = useMemo(() => column.tasks.map((task) => task.id), [column.tasks]);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column },
    disabled: menuOpen || isAddingTask
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleAddTask = () => {
      if(!newTaskTitle.trim()) { setIsAddingTask(false); return; }
      createTask(column.id, newTaskTitle);
      setNewTaskTitle("");
      setIsAddingTask(false);
  };

  // --- CORRECCIÓN VISUAL AL ARRASTRAR ---
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="column-container column-drag-placeholder"
      ></div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="column-container">
      {/* HEADER */}
      <div className="column-header" {...attributes} {...listeners}>
        <div className="column-title">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="task-count">{column.tasks.length}</span>
            {column.title}
          </div>
          
          <div className="column-actions">
              <button className="btn-icon add" onClick={(e) => { e.stopPropagation(); onAddClick(column.id); }} title="Nueva Tarea">
                  <Plus size={18} />
              </button>
              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
                 <MoreHorizontal size={18} />
              </button>
          </div>

          {menuOpen && (
            <div className="column-dropdown-menu" onMouseLeave={() => setMenuOpen(false)} onMouseDown={(e) => e.stopPropagation()}>
                <button className="menu-item" onClick={() => { setMenuOpen(false); updateColumn(column.id); }}><Edit size={16} /> Renombrar</button>
                <div style={{borderTop: "1px solid #30363d", margin: "5px 0"}}></div>
                <button className="menu-item danger" onClick={() => { setMenuOpen(false); deleteColumn(column.id); }}><Trash2 size={16} /> Eliminar Columna</button>
            </div>
          )}
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="column-content">
        <SortableContext items={taskIds}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} deleteTask={deleteTask} updateTask={updateTask} openEditModal={openEditModal} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};