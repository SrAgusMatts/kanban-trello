import { useMemo } from "react";
import { PlusCircle, Trash2, Edit2 } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const ColumnContainer = ({
    column,
    createTask,
    deleteTask,
    updateTask,
    deleteColumn,
    updateColumn,
    openEditModal,
}) => {
    const taskIds = useMemo(() => {
        return column.tasks.map((task) => task.id);
    }, [column.tasks]);

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column,
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
                style={{
                    ...style,
                    opacity: 0.4,
                    border: "2px dashed #58a6ff",
                }}
                className="column-container"
            >
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="column-container"
        >
            <div className="column-header">
                <div className="column-title">
                    {column.title}
                    <span className="task-count">{column.tasks.length}</span>

                    <button className="btn-add" onClick={() => createTask(column.id)}>
                        <PlusCircle size={18} />
                    </button>

                    <button
                        className="btn-edit-column"
                        onClick={() => updateColumn(column.id)}
                        title="Renombrar columna"
                    >
                        <Edit2 size={18} />
                    </button>

                    <button
                        className="btn-delete-column"
                        onClick={() => deleteColumn(column.id)}
                        title="Borrar columna"
                    >
                        <Trash2 size={18} />
                    </button>

                </div>
            </div>

            <div className="column-content">
                <SortableContext items={taskIds}>
                    {column.tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            deleteTask={deleteTask}
                            updateTask={updateTask}
                            openEditModal={openEditModal}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};