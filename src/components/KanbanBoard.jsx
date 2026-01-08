import { useState, useMemo, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { LogOut } from "lucide-react";
import { ColumnContainer } from "./ColumnContainer";
import { createPortal } from "react-dom";
import { TaskCard } from "./TaskCard";

export const KanbanBoard = ({ user, onLogout }) => {

    const userKey = `kanban-data-${user}`;

    const [columns, setColumns] = useState(() => {
        const savedData = localStorage.getItem(userKey);
        if (savedData) {
            return JSON.parse(savedData);
        }
        return [];
    });
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [activeColumn, setActiveColumn] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [showAddColumnModal, setShowAddColumnModal] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState("");
    const [columnToDelete, setColumnToDelete] = useState(null);
    const [editingColumn, setEditingColumn] = useState(null);
    const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

    useEffect(() => {
        localStorage.setItem(userKey, JSON.stringify(columns));
    }, [columns, userKey]);

    const createNewTask = (columnId) => {
        const newTask = {
            id: generateId(),
            content: `Nueva Tarea`,
        };

        setColumns((prev) => {
            const newColumns = prev.map((col) => {
                if (col.id === columnId) {
                    return { ...col, tasks: [...col.tasks, newTask] };
                }
                return col;
            });
            return newColumns;
        });
    };

    const openCreateColumnModal = () => {
        setNewColumnTitle("");
        setShowAddColumnModal(true);
    };

    const updateTask = (id, content) => {
        setColumns((prev) => {
            const newColumns = prev.map((col) => {
                const taskExists = col.tasks.find((task) => task.id === id);

                if (taskExists) {
                    return {
                        ...col,
                        tasks: col.tasks.map((task) => {
                            if (task.id === id) {
                                return { ...task, content };
                            }
                            return task;
                        }),
                    };
                }
                return col;
            });
            return newColumns;
        });
    };

    const deleteTask = (taskId) => {
        setColumns((prev) => {
            const newColumns = prev.map((col) => ({
                ...col,
                tasks: col.tasks.filter((task) => task.id !== taskId),
            }));
            return newColumns;
        });
    };

    const confirmCreateColumn = () => {
        if (!newColumnTitle.trim()) return;

        const newColumn = {
            id: "col-" + generateId(),
            title: newColumnTitle,
            tasks: [],
        };

        setColumns([...columns, newColumn]);
        setShowAddColumnModal(false);
    };

    const confirmEditColumn = () => {
        if (!editingColumn || !editingColumn.title.trim()) return;

        setColumns((prev) =>
            prev.map((col) => {
                if (col.id === editingColumn.id) {
                    return { ...col, title: editingColumn.title };
                }
                return col;
            })
        );
        setEditingColumn(null);
    };

    const openDeleteColumnModal = (columnId) => {
        setColumnToDelete(columnId);
    };

    const confirmDeleteColumn = () => {
        if (!columnToDelete) return;

        const newColumns = columns.filter((col) => col.id !== columnToDelete);
        setColumns(newColumns);
        setColumnToDelete(null);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        })
    );

    const onDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const isActiveTask = active.data.current?.type === "Task";
        const isOverTask = over.data.current?.type === "Task";
        const isOverColumn = over.data.current?.type === "Column";

        if (!isActiveTask) return;

        if (isActiveTask && isOverTask) {
            setColumns((prev) => {
                const activeColIndex = prev.findIndex((col) => col.tasks.some((t) => t.id === activeId));
                const overColIndex = prev.findIndex((col) => col.tasks.some((t) => t.id === overId));

                if (activeColIndex === overColIndex) return prev;

                const newColumns = [...prev];
                const activeTask = newColumns[activeColIndex].tasks.find((t) => t.id === activeId);

                newColumns[activeColIndex].tasks = newColumns[activeColIndex].tasks.filter((t) => t.id !== activeId);

                const overTaskIndex = newColumns[overColIndex].tasks.findIndex((t) => t.id === overId);

                newColumns[overColIndex].tasks.splice(overTaskIndex, 0, activeTask);

                return newColumns;
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

    const onDragEnd = (event) => {
        setActiveColumn(null);
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveColumn = active.data.current?.type === "Column";
        if (isActiveColumn) {
            setColumns((prev) => {
                const activeIndex = prev.findIndex((col) => col.id === activeId);
                const overIndex = prev.findIndex((col) => col.id === overId);
                return arrayMove(prev, activeIndex, overIndex);
            });
            return;
        }

        setColumns((prev) => {
            const activeColIndex = prev.findIndex((col) => col.tasks.some((t) => t.id === activeId));
            if (activeColIndex === -1) return prev;

            const overColIndex = prev.findIndex((col) => col.tasks.some((t) => t.id === overId));

            if (activeColIndex !== overColIndex) return prev;

            const newColumns = [...prev];
            const oldIndex = newColumns[activeColIndex].tasks.findIndex(t => t.id === activeId);
            const newIndex = newColumns[activeColIndex].tasks.findIndex(t => t.id === overId);

            newColumns[activeColIndex].tasks = arrayMove(newColumns[activeColIndex].tasks, oldIndex, newIndex);

            return newColumns;
        });
    };

    const onDragStart = (event) => {
        if (event.active.data.current?.type === "Column") {
            setActiveColumn(event.active.data.current.column);
            return;
        }

        if (event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task);
            return;
        }
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="kanban-board">

                <div className="board-header-info">
                    <span className="user-welcome">Hola, <b>{user}</b> 👋</span>
                    <button className="btn-logout" onClick={onLogout} title="Cerrar Sesión">
                        <LogOut size={18} /> Salir
                    </button>
                </div>

                <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
                    {columns.map((col) => (
                        <ColumnContainer
                            key={col.id}
                            column={col}
                            createTask={createNewTask}
                            deleteTask={deleteTask}
                            updateTask={updateTask}
                            deleteColumn={openDeleteColumnModal}
                            updateColumn={(id) => {
                                const colToEdit = columns.find(c => c.id === id);
                                setEditingColumn({ ...colToEdit }); 
                            }}
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

                    {showAddColumnModal && (
                        <div className="modal-overlay" onClick={() => setShowAddColumnModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">Nueva Columna</div>
                                <div className="modal-body">
                                    <input
                                        className="modal-input"
                                        placeholder="Ej: Testing, En Revisión..."
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

                    {columnToDelete && (
                        <div className="modal-overlay" onClick={() => setColumnToDelete(null)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">¿Borrar columna?</div>
                                <div className="modal-body">
                                    <p>Se eliminarán todas las tareas que contenga. Esta acción no se puede deshacer.</p>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn-modal btn-secondary" onClick={() => setColumnToDelete(null)}>Cancelar</button>
                                    <button className="btn-modal btn-danger" onClick={confirmDeleteColumn}>Eliminar</button>
                                </div>
                            </div>
                        </div>
                    )}

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
                </>,
                document.body
            )}
        </DndContext>
    );
};

function generateId() {
    return Math.floor(Math.random() * 10001).toString();
}