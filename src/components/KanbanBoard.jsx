import { useState, useMemo, useEffect } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { ColumnContainer } from "./ColumnContainer";
import { createPortal } from "react-dom";
import { TaskCard } from "./TaskCard";
import { CalendarView } from "./CalendarView";
import { RichTextEditor } from "./RichTextEditor";
import { LogOut, Layout, Calendar, Settings, Trash2, AlertTriangle } from "lucide-react";

const DEFAULT_TAGS = [
  { name: "Urgente", color: "#ef4444" },
  { name: "Diseño", color: "#a855f7" },
  { name: "Dev", color: "#3b82f6" },
];

function generateId() { return Math.floor(Math.random() * 10001).toString(); }

export const KanbanBoard = ({ user, onLogout }) => {
  const userKey = `kanban-data-${user}`;
  const tagsKey = `kanban-tags-${user}`;

  const [columns, setColumns] = useState(() => {
    try { return JSON.parse(localStorage.getItem(userKey)) || []; } catch { return []; }
  });
  const [availableTags, setAvailableTags] = useState(() => {
    try { return JSON.parse(localStorage.getItem(tagsKey)) || DEFAULT_TAGS; } catch { return DEFAULT_TAGS; }
  });

  const [viewMode, setViewMode] = useState("board");
  const [activeColumn, setActiveColumn] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  // Estados Modales
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  
  // ESTADO TAREA (Creación y Edición)
  const [editingTask, setEditingTask] = useState(null); 
  const [targetColumnId, setTargetColumnId] = useState(null); // Para saber donde guardar si es nueva
  
  // Datos del form tarea
  const [editTaskContent, setEditTaskContent] = useState("");
  const [editTaskTags, setEditTaskTags] = useState([]);
  const [editTaskDate, setEditTaskDate] = useState("");

  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#58a6ff");
  const [tagToDelete, setTagToDelete] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

  useEffect(() => { localStorage.setItem(userKey, JSON.stringify(columns)); }, [columns, userKey]);
  useEffect(() => { localStorage.setItem(tagsKey, JSON.stringify(availableTags)); }, [availableTags, tagsKey]);

  // --- LÓGICA ETIQUETAS ---
  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    if (availableTags.some((t) => t.name.toLowerCase() === newTagName.trim().toLowerCase())) return;
    const newTag = { name: newTagName.trim(), color: newTagColor };
    setAvailableTags([...availableTags, newTag]);
    setEditTaskTags([...editTaskTags, newTag]);
    setNewTagName(""); setIsCreatingTag(false);
  };

  const confirmTagDeletion = () => {
    if (tagToDelete) {
        setAvailableTags(availableTags.filter(t => t.name !== tagToDelete));
        setEditTaskTags(editTaskTags.filter(t => t.name !== tagToDelete));
        setTagToDelete(null);
    }
  };

  // --- GESTIÓN DE TAREAS (FLUJO NUEVO) ---
  
  // 1. Abrir modal para CREAR (Botón + en header de columna)
  const openCreateTaskModal = (colId) => {
      setTargetColumnId(colId);
      setEditingTask({ id: "NEW", content: "", tags: [], dueDate: "" }); // Tarea temporal vacía
      setEditTaskContent("");
      setEditTaskTags([]);
      setEditTaskDate("");
      setIsCreatingTag(false);
      setIsManagingTags(false);
  };

  // 2. Abrir modal para EDITAR (Click en tarjeta)
  const openEditTaskModal = (task) => {
      setTargetColumnId(null); // No necesitamos colId al editar, ya existe
      setEditingTask(task);
      setEditTaskContent(task.content);
      setEditTaskTags(task.tags || []);
      setEditTaskDate(task.dueDate || "");
      setIsCreatingTag(false); 
      setIsManagingTags(false);
  };

  // 3. Guardar (Funciona para ambos casos)
  const saveTaskChanges = () => {
    if (!editingTask) return;

    if (editingTask.id === "NEW" && targetColumnId) {
        // CREAR NUEVA
        const newTask = { 
            id: generateId(), 
            content: editTaskContent || "Nueva Tarea", 
            tags: editTaskTags, 
            dueDate: editTaskDate 
        };
        setColumns(prev => prev.map(col => col.id === targetColumnId ? { ...col, tasks: [...col.tasks, newTask] } : col));
    } else {
        // ACTUALIZAR EXISTENTE
        setColumns(prev => prev.map(col => ({
          ...col,
          tasks: col.tasks.map(t => t.id === editingTask.id ? { ...t, content: editTaskContent, tags: editTaskTags, dueDate: editTaskDate } : t)
        })));
    }
    setEditingTask(null);
    setTargetColumnId(null);
  };

  const deleteTask = (taskId) => {
    setColumns(prev => prev.map(col => ({ ...col, tasks: col.tasks.filter(t => t.id !== taskId) })));
  };

  // --- RESTO DE CRUD COLUMN Y DRAG (Igual que antes) ---
  const confirmCreateColumn = () => { if(!newColumnTitle.trim()) return; setColumns([...columns, { id: "col-"+generateId(), title: newColumnTitle, tasks: [] }]); setShowAddColumnModal(false); };
  const confirmDeleteColumn = () => { setColumns(columns.filter(c => c.id !== columnToDelete)); setColumnToDelete(null); };
  const confirmEditColumn = () => { setColumns(prev => prev.map(c => c.id === editingColumn.id ? {...c, title: editingColumn.title} : c)); setEditingColumn(null); };

  const onDragStart = (e) => {
    if (e.active.data.current?.type === "Column") setActiveColumn(e.active.data.current.column);
    if (e.active.data.current?.type === "Task") setActiveTask(e.active.data.current.task);
  };
  const onDragOver = (e) => {
    const { active, over } = e; if (!over) return; const activeId = active.id; const overId = over.id; if (activeId === overId) return;
    const isActiveTask = active.data.current?.type === "Task"; const isOverTask = over.data.current?.type === "Task"; const isOverColumn = over.data.current?.type === "Column";
    if (isActiveTask && isOverTask) {
      setColumns((prev) => {
        const activeColIndex = prev.findIndex((col) => col.tasks.some((t) => t.id === activeId));
        const overColIndex = prev.findIndex((col) => col.tasks.some((t) => t.id === overId));
        if (activeColIndex === overColIndex) {
          const newColumns = [...prev];
          const activeTask = newColumns[activeColIndex].tasks.find((t) => t.id === activeId);
          newColumns[activeColIndex].tasks = newColumns[activeColIndex].tasks.filter((t) => t.id !== activeId);
          const overTaskIndex = newColumns[overColIndex].tasks.findIndex((t) => t.id === overId);
          newColumns[overColIndex].tasks.splice(overTaskIndex, 0, activeTask);
          return newColumns;
        } else {
          const newColumns = [...prev];
          const activeTask = newColumns[activeColIndex].tasks.find((t) => t.id === activeId);
          newColumns[activeColIndex].tasks = newColumns[activeColIndex].tasks.filter((t) => t.id !== activeId);
          const overTaskIndex = newColumns[overColIndex].tasks.findIndex((t) => t.id === overId);
          newColumns[overColIndex].tasks.splice(overTaskIndex, 0, activeTask);
          return newColumns;
        }
      });
    }
    if (isActiveTask && isOverColumn) {
      setColumns((prev) => {
        const activeColIndex = prev.findIndex((col) => col.tasks.some((t) => t.id === activeId));
        const overColIndex = prev.findIndex((col) => col.id === overId);
        if (activeColIndex === overColIndex) return prev;
        const newColumns = [...prev];
        const activeTask = newColumns[activeColIndex].tasks.find((t) => t.id === activeId);
        newColumns[activeColIndex].tasks = newColumns[activeColIndex].tasks.filter((t) => t.id !== activeId);
        newColumns[overColIndex].tasks.push(activeTask);
        return newColumns;
      });
    }
  };
  const onDragEnd = (e) => {
    setActiveColumn(null); setActiveTask(null);
    const { active, over } = e; if (!over) return;
    if (active.id === over.id) return;
    if (active.data.current?.type === "Column") {
      setColumns((prev) => {
        const activeIndex = prev.findIndex((col) => col.id === active.id);
        const overIndex = prev.findIndex((col) => col.id === over.id);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);
  const allTasks = useMemo(() => columns.flatMap(col => col.tasks), [columns]);

  return (
    <>
      <header className="main-header">
        <div className="header-logo"><Layout size={24} color="#58a6ff" /><span>Kanban Board</span></div>
        <div className="view-switcher">
            <button className={`view-btn ${viewMode === 'board' ? 'active' : ''}`} onClick={() => setViewMode('board')}><Layout size={16} style={{marginRight: 5}}/> Tablero</button>
            <button className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}><Calendar size={16} style={{marginRight: 5}}/> Calendario</button>
        </div>
        <div className="user-section"><span className="user-welcome">Hola, <b>{user}</b></span><button className="btn-logout" onClick={onLogout}><LogOut size={18} /></button></div>
      </header>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <div className="app-container" style={{paddingTop: "20px"}}>
            {viewMode === 'board' ? (
                <div className="kanban-board">
                    <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
                    {columns.map((col) => (
                        <ColumnContainer
                        key={col.id} column={col} 
                        onAddClick={openCreateTaskModal} // PASAMOS LA FUNCIÓN DE ABRIR MODAL
                        deleteTask={deleteTask} updateTask={saveTaskChanges} // updateTask no se usa directo aqui, pero por compatibilidad
                        deleteColumn={(id) => setColumnToDelete(id)}
                        updateColumn={(id) => { const c = columns.find(x => x.id === id); setEditingColumn({...c}); }}
                        openEditModal={openEditTaskModal}
                        />
                    ))}
                    </SortableContext>
                    <button className="btn-add-column" onClick={() => { setNewColumnTitle(""); setShowAddColumnModal(true); }}>+ Añadir Columna</button>
                </div>
            ) : (
                <CalendarView tasks={allTasks} />
            )}
        </div>

        {createPortal(
            <>
            <DragOverlay>
                {activeColumn && <ColumnContainer column={activeColumn} />}
                {activeTask && <TaskCard task={activeTask} />}
            </DragOverlay>

            {/* Modales de Columna (Simplificado visualmente para el ejemplo, es igual al anterior) */}
            {showAddColumnModal && (
                <div className="modal-overlay" onClick={() => setShowAddColumnModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{width: "400px"}}>
                    <div className="modal-header">Nueva Columna</div>
                    <div className="modal-body"><input className="modal-input" placeholder="Ej: Testing..." value={newColumnTitle} autoFocus onChange={(e) => setNewColumnTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmCreateColumn()} /></div>
                    <div className="modal-footer"><button className="btn-modal btn-secondary" onClick={() => setShowAddColumnModal(false)}>Cancelar</button><button className="btn-modal btn-primary" onClick={confirmCreateColumn}>Crear</button></div>
                </div>
                </div>
            )}
            {columnToDelete && (<div className="modal-overlay" onClick={() => setColumnToDelete(null)}><div className="modal-content" onClick={(e) => e.stopPropagation()} style={{width: "400px"}}><div className="modal-header">¿Borrar columna?</div><div className="modal-body"><p>Se eliminarán todas las tareas.</p></div><div className="modal-footer"><button className="btn-modal btn-secondary" onClick={() => setColumnToDelete(null)}>Cancelar</button><button className="btn-modal btn-danger" onClick={confirmDeleteColumn}>Eliminar</button></div></div></div>)}
            {editingColumn && (<div className="modal-overlay" onClick={() => setEditingColumn(null)}><div className="modal-content" onClick={(e) => e.stopPropagation()} style={{width: "400px"}}><div className="modal-header">Editar Columna</div><div className="modal-body"><input className="modal-input" value={editingColumn.title} autoFocus onChange={(e) => setEditingColumn({ ...editingColumn, title: e.target.value })} onKeyDown={(e) => e.key === "Enter" && confirmEditColumn()} /></div><div className="modal-footer"><button className="btn-modal btn-secondary" onClick={() => setEditingColumn(null)}>Cancelar</button><button className="btn-modal btn-primary" onClick={confirmEditColumn}>Guardar</button></div></div></div>)}

            {/* MODAL UNIFICADO: CREAR / EDITAR TAREA */}
            {editingTask && (
                <div className="modal-overlay" onClick={() => setEditingTask(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">{editingTask.id === "NEW" ? "Crear Nueva Tarea" : "Detalles de Tarea"}</div>
                    <div className="modal-body">
                        <div style={{marginBottom: "15px"}}>
                             <label style={{ display: "block", marginBottom: "5px", color: "#8b949e", fontSize: "0.9rem" }}>Fecha Límite:</label>
                             <input type="date" className="modal-input" style={{colorScheme: "dark"}} value={editTaskDate} onChange={(e) => setEditTaskDate(e.target.value)} />
                        </div>
                        
                        <label style={{ display: "block", marginBottom: "5px", color: "#8b949e", fontSize: "0.9rem" }}>Descripción:</label>
                        <RichTextEditor content={editTaskContent} onChange={(html) => setEditTaskContent(html)} />

                        {/* Etiquetas */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px", marginTop: "15px" }}>
                            <label style={{ color: "#8b949e" }}>Etiquetas:</label>
                            {!isCreatingTag && (
                            <button onClick={() => setIsManagingTags(!isManagingTags)} style={{ background: "transparent", border: "none", color: isManagingTags ? "#58a6ff" : "#8b949e", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "5px" }}>
                                <Settings size={14} /> {isManagingTags ? "Listo" : "Gestionar"}
                            </button>
                            )}
                        </div>
                        
                        {isCreatingTag ? (
                            <div style={{ background: "#161c22", padding: "10px", borderRadius: "5px", border: "1px solid #30363d" }}>
                            <div style={{ marginBottom: "8px" }}><label style={{ fontSize: "0.8rem", color: "#8b949e" }}>Nombre:</label><input className="modal-input" style={{ padding: "5px", fontSize: "0.9rem" }} value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Ej: Marketing" autoFocus /></div>
                            <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}><label style={{ fontSize: "0.8rem", color: "#8b949e" }}>Color:</label><input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} style={{ border: "none", background: "transparent", cursor: "pointer", width: "40px", height: "30px" }} /></div>
                            <div style={{ display: "flex", gap: "5px", justifyContent: "flex-end" }}><button className="btn-modal btn-secondary" style={{ fontSize: "0.8rem", padding: "4px 8px" }} onClick={() => setIsCreatingTag(false)}>Cancelar</button><button className="btn-modal btn-primary" style={{ fontSize: "0.8rem", padding: "4px 8px" }} onClick={handleCreateTag}>Guardar</button></div>
                            </div>
                        ) : isManagingTags ? (
                            <div className="tags-management-list" style={{ background: "#161c22", padding: "10px", borderRadius: "5px", border: "1px solid #30363d", maxHeight: "150px", overflowY: "auto" }}>
                                {availableTags.map((tag) => (
                                    <div key={tag.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d1117", padding: "5px 10px", borderRadius: "4px", border: "1px solid #30363d", marginBottom: "5px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", background: tag.color }}></div><span>{tag.name}</span></div>
                                        <button onClick={() => setTagToDelete(tag.name)} style={{ background: "transparent", border: "none", color: "#f85149", cursor: "pointer" }}><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <select className="modal-input" value="" onChange={(e) => { if (e.target.value === "__CREATE_NEW__") { setIsCreatingTag(true); return; } const t = availableTags.find((t) => t.name === e.target.value); if (t && !editTaskTags.some((tag) => tag.name === t.name)) setEditTaskTags([...editTaskTags, t]); }}>
                                <option value="">Seleccionar etiqueta...</option>
                                {availableTags.map((tag) => (<option key={tag.name} value={tag.name} style={{ color: tag.color }}>{tag.name}</option>))}
                                <option value="__CREATE_NEW__" style={{ fontWeight: "bold", color: "#58a6ff" }}>+ Crear nueva etiqueta...</option>
                            </select>
                        )}
                        <div className="tags-list" style={{ marginTop: "10px" }}>
                            {editTaskTags.map((tag) => (
                                <span key={tag.name} className="tag-pill" style={{ backgroundColor: tag.color, border: `1px solid ${tag.color}`, display: "flex", alignItems: "center", gap: "5px" }} onClick={() => setEditTaskTags(editTaskTags.filter((t) => t.name !== tag.name))}>
                                {tag.name} <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>✕</span>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                    <button className="btn-modal btn-secondary" onClick={() => setEditingTask(null)}>Cerrar</button>
                    <button className="btn-modal btn-primary" onClick={saveTaskChanges}>
                        {editingTask.id === "NEW" ? "Crear Tarea" : "Guardar Cambios"}
                    </button>
                    </div>
                </div>
                </div>
            )}

            {tagToDelete && (
                <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setTagToDelete(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "350px" }}>
                    <div className="modal-header" style={{ display: "flex", alignItems: "center", gap: "10px", color: "#f85149" }}><AlertTriangle /> ¿Eliminar etiqueta?</div>
                    <div className="modal-body"><p>Se eliminará "<b>{tagToDelete}</b>".</p></div>
                    <div className="modal-footer"><button className="btn-modal btn-secondary" onClick={() => setTagToDelete(null)}>Cancelar</button><button className="btn-modal btn-danger" onClick={confirmTagDeletion}>Eliminar</button></div>
                </div>
                </div>
            )}
            </>
        , document.body)}
      </DndContext>
    </>
  );
};