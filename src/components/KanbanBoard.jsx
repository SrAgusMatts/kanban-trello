import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ColumnContainer } from "./ColumnContainer";
import { createPortal } from "react-dom";
import { TaskCard } from "./TaskCard";
import { LogOut, Plus, Settings, Trash2, AlertTriangle } from "lucide-react";

const DEFAULT_TAGS = [
  { name: "Urgente", color: "#ef4444" },
  { name: "Diseño", color: "#a855f7" },
  { name: "Dev", color: "#3b82f6" },
];

function generateId() {
  return Math.floor(Math.random() * 10001).toString();
}

export const KanbanBoard = ({ user, onLogout }) => {
  const userKey = `kanban-data-${user}`;
  const tagsKey = `kanban-tags-${user}`;

  const [columns, setColumns] = useState(() => {
    const savedData = localStorage.getItem(userKey);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [availableTags, setAvailableTags] = useState(() => {
    const savedTags = localStorage.getItem(tagsKey);
    if (savedTags) {
      try {
        return JSON.parse(savedTags);
      } catch (e) {
        return DEFAULT_TAGS;
      }
    }
    return DEFAULT_TAGS;
  });

  const [isManagingTags, setIsManagingTags] = useState(false);
  const [activeColumn, setActiveColumn] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskContent, setEditTaskContent] = useState("");
  const [editTaskTags, setEditTaskTags] = useState([]);

  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#58a6ff");

  const [tagToDelete, setTagToDelete] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  useEffect(() => {
    localStorage.setItem(userKey, JSON.stringify(columns));
  }, [columns, userKey]);

  useEffect(() => {
    localStorage.setItem(tagsKey, JSON.stringify(availableTags));
  }, [availableTags, tagsKey]);

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;

    if (availableTags.some((t) => t.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      alert("¡Ya existe una etiqueta con ese nombre!");
      return;
    }

    const newTag = { name: newTagName.trim(), color: newTagColor };
    setAvailableTags([...availableTags, newTag]);
    setEditTaskTags([...editTaskTags, newTag]);

    setNewTagName("");
    setNewTagColor("#58a6ff");
    setIsCreatingTag(false);
  };

  const handleDeleteTagClick = (tagName) => {
    setTagToDelete(tagName);
  };

  const confirmTagDeletion = () => {
    if (tagToDelete) {
        setAvailableTags(availableTags.filter(t => t.name !== tagToDelete));
        setEditTaskTags(editTaskTags.filter(t => t.name !== tagToDelete));
        setTagToDelete(null);
    }
  };

  const createNewTask = (columnId) => {
    const newTask = { id: generateId(), content: `Nueva Tarea`, tags: [] };
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
      )
    );
  };

  const deleteTask = (taskId) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }))
    );
  };

  const updateTask = (id, newContent, newTags) => {
    setColumns((prev) => {
      return prev.map((col) => {
        if (!col.tasks.some((task) => task.id === id)) return col;
        return {
          ...col,
          tasks: col.tasks.map((task) => {
            if (task.id === id) {
              return { ...task, content: newContent, tags: newTags };
            }
            return task;
          }),
        };
      });
    });
  };

  const onDragStart = (e) => {
    if (e.active.data.current?.type === "Column")
      setActiveColumn(e.active.data.current.column);
    if (e.active.data.current?.type === "Task")
      setActiveTask(e.active.data.current.task);
  };

  const onDragOver = (e) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;
    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (isActiveTask && isOverTask) {
      setColumns((prev) => {
        const activeColIndex = prev.findIndex((col) =>
          col.tasks.some((t) => t.id === activeId)
        );
        const overColIndex = prev.findIndex((col) =>
          col.tasks.some((t) => t.id === overId)
        );
        if (activeColIndex === overColIndex) {
          const newColumns = [...prev];
          const activeTask = newColumns[activeColIndex].tasks.find(
            (t) => t.id === activeId
          );
          newColumns[activeColIndex].tasks = newColumns[
            activeColIndex
          ].tasks.filter((t) => t.id !== activeId);
          const overTaskIndex = newColumns[overColIndex].tasks.findIndex(
            (t) => t.id === overId
          );
          newColumns[overColIndex].tasks.splice(
            overTaskIndex,
            0,
            activeTask
          );
          return newColumns;
        } else {
          const newColumns = [...prev];
          const activeTask = newColumns[activeColIndex].tasks.find(
            (t) => t.id === activeId
          );
          newColumns[activeColIndex].tasks = newColumns[
            activeColIndex
          ].tasks.filter((t) => t.id !== activeId);
          const overTaskIndex = newColumns[overColIndex].tasks.findIndex(
            (t) => t.id === overId
          );
          newColumns[overColIndex].tasks.splice(
            overTaskIndex,
            0,
            activeTask
          );
          return newColumns;
        }
      });
    }
    if (isActiveTask && isOverColumn) {
      setColumns((prev) => {
        const activeColIndex = prev.findIndex((col) =>
          col.tasks.some((t) => t.id === activeId)
        );
        const overColIndex = prev.findIndex((col) => col.id === overId);
        if (activeColIndex === overColIndex) return prev;
        const newColumns = [...prev];
        const activeTask = newColumns[activeColIndex].tasks.find(
          (t) => t.id === activeId
        );
        newColumns[activeColIndex].tasks = newColumns[
          activeColIndex
        ].tasks.filter((t) => t.id !== activeId);
        newColumns[overColIndex].tasks.push(activeTask);
        return newColumns;
      });
    }
  };

  const onDragEnd = (e) => {
    setActiveColumn(null);
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;
    if (active.data.current?.type === "Column") {
      setColumns((prev) => {
        const activeIndex = prev.findIndex((col) => col.id === activeId);
        const overIndex = prev.findIndex((col) => col.id === overId);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  const openCreateColumnModal = () => {
    setNewColumnTitle("");
    setShowAddColumnModal(true);
  };

  const confirmCreateColumn = () => {
    if (!newColumnTitle.trim()) return;
    setColumns([
      ...columns,
      { id: "col-" + generateId(), title: newColumnTitle, tasks: [] },
    ]);
    setShowAddColumnModal(false);
  };

  const openDeleteColumnModal = (id) => setColumnToDelete(id);

  const confirmDeleteColumn = () => {
    setColumns(columns.filter((c) => c.id !== columnToDelete));
    setColumnToDelete(null);
  };

  const confirmEditColumn = () => {
    setColumns((prev) =>
      prev.map((c) =>
        c.id === editingColumn.id ? { ...c, title: editingColumn.title } : c
      )
    );
    setEditingColumn(null);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setEditTaskContent(task.content);
    setEditTaskTags(task.tags || []);
    setIsCreatingTag(false);
    setIsManagingTags(false);
  };

  const saveTaskChanges = () => {
    if (!editingTask) return;
    updateTask(editingTask.id, editTaskContent, editTaskTags);
    setEditingTask(null);
  };

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="kanban-board">
        <div className="board-header-info">
          <span className="user-welcome">
            Hola, <b>{user}</b> 👋
          </span>
          <button
            className="btn-logout"
            onClick={onLogout}
            title="Cerrar Sesión"
          >
            <LogOut size={18} /> Salir
          </button>
        </div>

        <SortableContext
          items={columnsId}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((col) => (
            <ColumnContainer
              key={col.id}
              column={col}
              createTask={createNewTask}
              deleteTask={deleteTask}
              updateTask={updateTask}
              deleteColumn={openDeleteColumnModal}
              updateColumn={(id) => {
                const colToEdit = columns.find((c) => c.id === id);
                setEditingColumn({ ...colToEdit });
              }}
              openEditModal={openEditTaskModal}
            />
          ))}
        </SortableContext>

        <button className="btn-add-column" onClick={openCreateColumnModal}>
          + Añadir Columna
        </button>
      </div>

      {createPortal(
        <>
          <DragOverlay>
            {activeColumn && <ColumnContainer column={activeColumn} />}
            {activeTask && <TaskCard task={activeTask} />}
          </DragOverlay>

          {/* Modal Crear Columna */}
          {showAddColumnModal && (
            <div className="modal-overlay" onClick={() => setShowAddColumnModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">Nueva Columna</div>
                <div className="modal-body">
                  <input
                    className="modal-input"
                    placeholder="Ej: Testing..."
                    value={newColumnTitle}
                    autoFocus
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmCreateColumn()}
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn-modal btn-secondary" onClick={() => setShowAddColumnModal(false)}>Cancelar</button>
                  <button className="btn-modal btn-primary" onClick={confirmCreateColumn}>Crear</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Borrar Columna */}
          {columnToDelete && (
            <div className="modal-overlay" onClick={() => setColumnToDelete(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">¿Borrar columna?</div>
                <div className="modal-body">
                  <p>Se eliminarán todas las tareas.</p>
                </div>
                <div className="modal-footer">
                  <button className="btn-modal btn-secondary" onClick={() => setColumnToDelete(null)}>Cancelar</button>
                  <button className="btn-modal btn-danger" onClick={confirmDeleteColumn}>Eliminar</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Editar Columna */}
          {editingColumn && (
            <div className="modal-overlay" onClick={() => setEditingColumn(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">Editar Columna</div>
                <div className="modal-body">
                  <input
                    className="modal-input"
                    value={editingColumn.title}
                    autoFocus
                    onChange={(e) => setEditingColumn({ ...editingColumn, title: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && confirmEditColumn()}
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn-modal btn-secondary" onClick={() => setEditingColumn(null)}>Cancelar</button>
                  <button className="btn-modal btn-primary" onClick={confirmEditColumn}>Guardar</button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL EDITAR TAREA */}
          {editingTask && (
            <div className="modal-overlay" onClick={() => setEditingTask(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">Editar Tarea</div>

                <div className="modal-body">
                  <label style={{ display: "block", marginBottom: "5px", color: "#8b949e" }}>Descripción:</label>
                  <textarea
                    className="modal-input"
                    style={{ minHeight: "100px", resize: "vertical", fontFamily: "inherit", marginBottom: "15px" }}
                    value={editTaskContent}
                    autoFocus
                    onChange={(e) => setEditTaskContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        saveTaskChanges();
                      }
                    }}
                  />

                  {/* Header zona etiquetas */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <label style={{ color: "#8b949e" }}>Etiquetas:</label>
                    {!isCreatingTag && (
                      <button
                        onClick={() => setIsManagingTags(!isManagingTags)}
                        style={{
                          background: "transparent", border: "none", color: isManagingTags ? "#58a6ff" : "#8b949e",
                          cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "5px",
                        }}
                        title="Gestionar lista de etiquetas"
                      >
                        <Settings size={14} /> {isManagingTags ? "Listo" : "Gestionar"}
                      </button>
                    )}
                  </div>

                  {isCreatingTag ? (
                    <div style={{ background: "#161c22", padding: "10px", borderRadius: "5px", border: "1px solid #30363d" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <label style={{ fontSize: "0.8rem", color: "#8b949e" }}>Nombre:</label>
                        <input
                          className="modal-input"
                          style={{ padding: "5px", fontSize: "0.9rem" }}
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          placeholder="Ej: Marketing"
                          autoFocus
                        />
                      </div>
                      <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <label style={{ fontSize: "0.8rem", color: "#8b949e" }}>Color:</label>
                        <input
                          type="color"
                          value={newTagColor}
                          onChange={(e) => setNewTagColor(e.target.value)}
                          style={{ border: "none", background: "transparent", cursor: "pointer", width: "40px", height: "30px" }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "5px", justifyContent: "flex-end" }}>
                        <button className="btn-modal btn-secondary" style={{ fontSize: "0.8rem", padding: "4px 8px" }} onClick={() => setIsCreatingTag(false)}>Cancelar</button>
                        <button className="btn-modal btn-primary" style={{ fontSize: "0.8rem", padding: "4px 8px" }} onClick={handleCreateTag}>Guardar</button>
                      </div>
                    </div>
                  ) : isManagingTags ? (
                    <div
                      className="tags-management-list"
                      style={{
                        background: "#161c22", padding: "10px", borderRadius: "5px", border: "1px solid #30363d",
                        maxHeight: "150px", overflowY: "auto",
                      }}
                    >
                      <small style={{ display: "block", marginBottom: "8px", color: "#8b949e" }}>Eliminar de la lista de opciones:</small>
                      {availableTags.length === 0 ? <span style={{ color: "#555" }}>No hay etiquetas creadas.</span> : null}

                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        {availableTags.map((tag) => (
                          <div
                            key={tag.name}
                            style={{
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              background: "#0d1117", padding: "5px 10px", borderRadius: "4px", border: "1px solid #30363d",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: tag.color }}></div>
                              <span>{tag.name}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteTagClick(tag.name)}
                              style={{ background: "transparent", border: "none", color: "#f85149", cursor: "pointer" }}
                              title="Eliminar permanentemente"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <select
                      className="modal-input"
                      value=""
                      onChange={(e) => {
                        if (e.target.value === "__CREATE_NEW__") {
                          setIsCreatingTag(true);
                          return;
                        }
                        const tagName = e.target.value;
                        if (!tagName) return;
                        const tagToAdd = availableTags.find((t) => t.name === tagName);
                        if (tagToAdd && !editTaskTags.some((t) => t.name === tagName)) {
                          setEditTaskTags([...editTaskTags, tagToAdd]);
                        }
                      }}
                    >
                      <option value="">Seleccionar etiqueta...</option>
                      {availableTags.map((tag) => (
                        <option key={tag.name} value={tag.name} style={{ color: tag.color }}>
                          {tag.name}
                        </option>
                      ))}
                      <option value="__CREATE_NEW__" style={{ fontWeight: "bold", color: "#58a6ff" }}>
                        + Crear nueva etiqueta...
                      </option>
                    </select>
                  )}

                  <div className="tags-list" style={{ marginTop: "10px" }}>
                    {editTaskTags.map((tag) => (
                      <span
                        key={tag.name}
                        className="tag-pill"
                        style={{
                          backgroundColor: tag.color, border: `1px solid ${tag.color}`,
                          display: "flex", alignItems: "center", gap: "5px",
                        }}
                        onClick={() => setEditTaskTags(editTaskTags.filter((t) => t.name !== tag.name))}
                        title="Clic para quitar"
                      >
                        {tag.name}
                        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>✕</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn-modal btn-secondary" onClick={() => setEditingTask(null)}>Cancelar</button>
                  <button className="btn-modal btn-primary" onClick={saveTaskChanges}>Guardar Cambios</button>
                </div>
              </div>
            </div>
          )}

          {/* 🌟 NUEVO: MODAL CONFIRMACIÓN BORRAR ETIQUETA 🌟 */}
          {tagToDelete && (
            <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setTagToDelete(null)}> {/* zIndex alto para estar sobre el otro modal */}
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "350px" }}>
                <div className="modal-header" style={{ display: "flex", alignItems: "center", gap: "10px", color: "#f85149" }}>
                   <AlertTriangle /> ¿Eliminar etiqueta?
                </div>
                <div className="modal-body">
                  <p>Se eliminará "<b>{tagToDelete}</b>" de la lista de opciones de este tablero.</p>
                </div>
                <div className="modal-footer">
                  <button className="btn-modal btn-secondary" onClick={() => setTagToDelete(null)}>Cancelar</button>
                  <button className="btn-modal btn-danger" onClick={confirmTagDeletion}>Eliminar</button>
                </div>
              </div>
            </div>
          )}

        </>,
        document.body
      )}
    </DndContext>
  );
};