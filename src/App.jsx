import { useState, useEffect } from "react";
import { KanbanBoard } from "./components/KanbanBoard";
import { LoginPage } from "./components/LoginPage";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("kanban-current-user");
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const handleLogin = (username) => {
    setUser(username);
    localStorage.setItem("kanban-current-user", username);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("kanban-current-user");
  };

  return (
    <div className="app-container">
      
      {!user ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <KanbanBoard user={user} onLogout={handleLogout} key={user} />
      )}
    </div>
  );
}

export default App;