import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const CalendarView = ({ tasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generar años (2020 - 2030)
  const years = Array.from({length: 11}, (_, i) => 2020 + i);
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay(); // 0 = Domingo

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // --- NAVEGACIÓN ---
  
  // 1. Por Selects (Saltos largos)
  const handleYearChange = (e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1));
  const handleMonthChange = (e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1));
  
  // 2. Por Flechas (De 1 en 1)
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  
  const goToday = () => setCurrentDate(new Date());

  // Construir celdas
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ type: "empty", key: `empty-${i}` });
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    // Filtrar tareas de este día
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

    cells.push({ type: "day", day: d, dateStr, tasks: dayTasks, isToday, key: `day-${d}` });
  }

  // Relleno final para cuadrar la grilla
  while (cells.length % 7 !== 0) {
      cells.push({ type: "empty", key: `empty-end-${cells.length}` });
  }

  return (
    <div className="calendar-container">
      {/* HEADER CON DOBLE NAVEGACIÓN */}
      <div className="calendar-header">
        <div className="calendar-controls">
            {/* Flecha Atrás */}
            <button onClick={prevMonth} className="cal-nav-btn" title="Mes anterior">
                <ChevronLeft size={20}/>
            </button>

            {/* Selectores */}
            <div style={{display: 'flex', gap: 10}}>
                <select className="cal-select" value={month} onChange={handleMonthChange}>
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select className="cal-select" value={year} onChange={handleYearChange}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Flecha Adelante */}
            <button onClick={nextMonth} className="cal-nav-btn" title="Mes siguiente">
                <ChevronRight size={20}/>
            </button>
        </div>

        <button onClick={goToday} className="btn-modal btn-primary" style={{padding: "6px 12px", fontSize: "0.9rem"}}>Hoy</button>
      </div>

      {/* CABEZAL DIAS */}
      <div className="calendar-grid-header">
        <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
      </div>

      {/* GRILLA PERFECTA */}
      <div className="calendar-grid">
        {cells.map(cell => {
            if (cell.type === "empty") return <div key={cell.key} className="cal-cell empty"></div>;
            
            return (
                <div key={cell.key} className={`cal-cell ${cell.isToday ? 'today' : ''}`}>
                    <span className="day-number" style={{color: cell.isToday ? '#58a6ff' : 'inherit'}}>{cell.day}</span>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        {cell.tasks.map(task => (
                            <div key={task.id} className="cal-task-pill" title={task.content.replace(/<[^>]*>?/gm, '')}>
                                {task.tags[0] && <div className="cal-dot" style={{background: task.tags[0].color}}></div>}
                                <span>{task.content.replace(/<[^>]*>?/gm, '').substring(0, 12) || "Tarea"}...</span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
};