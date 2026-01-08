import { useState } from "react";
import { LogIn } from "lucide-react";

export const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    onLogin(username);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Kanban Board</h1>
        <p className="login-subtitle">Ingresa tu usuario para ver tus tareas</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Ej: agustinDev"
            className="modal-input login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-modal btn-primary login-btn">
            <LogIn size={18} style={{ marginRight: "8px" }} />
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};