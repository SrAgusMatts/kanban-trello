import { useState,useMemo } from "react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { INITIAL_DATA } from "../data";
import { ColumnContainer } from "./ColumnContainer";
import { createPortal } from "react-dom";
import { TaskCard } from "./TaskCard";

export const KanbanBoard = () => {
    const [columns, setColumns] = useState(INITIAL_DATA);
    const [activeColumn, setActiveColumn] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

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

    const createNewColumn = () => {
        const title = window.prompt("Nombre de la nueva columna:");

        if (!title) return;

        const newColumn = {
            id: "col-" + generateId(),
            title: title,
            tasks: [],
        };

        setColumns([...columns, newColumn]);
    };

    const deleteColumn = (columnId) => {
        if (window.confirm("¿Seguro que quieres borrar esta columna y sus tareas?")) {
            const newColumns = columns.filter((col) => col.id !== columnId);
            setColumns(newColumns);
        }
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

        // Si arrastramos una TAREA
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
                {/* El SortableContext envuelve al mapeo */}
                <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
                    {columns.map((col) => (
                        <ColumnContainer
                            key={col.id}
                            column={col}
                            createTask={createNewTask}
                            deleteTask={deleteTask}
                            updateTask={updateTask}
                            deleteColumn={deleteColumn}
                        />
                    ))}
                </SortableContext>

                <button className="btn-add-column" onClick={createNewColumn}>
                    + Añadir Columna
                </button>
            </div>

            {createPortal(
                <DragOverlay>
                    {/* Caso A: Estamos arrastrando una Columna */}
                    {activeColumn && (
                        <ColumnContainer
                            column={activeColumn}
                            createTask={createNewTask}
                            deleteTask={deleteTask}
                            updateTask={updateTask}
                            deleteColumn={deleteColumn}
                        />
                    )}

                    {/* Caso B: Estamos arrastrando una Tarea */}
                    {activeTask && (
                        <TaskCard task={activeTask} deleteTask={deleteTask} updateTask={updateTask} />
                    )}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
};

function generateId() {
    return Math.floor(Math.random() * 10001).toString();
}