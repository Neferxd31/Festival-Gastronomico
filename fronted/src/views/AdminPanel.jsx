import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PanelFuncionalidades({ token }) {
    const navigate = useNavigate();
    const { logoutAdmin } = useAuth();
    const [funcionalidades, setFuncionalidades] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/usuarios/panel/', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.status === 401) { logoutAdmin(); navigate('/'); }
                return res.json();
            })
            .then((data) => setFuncionalidades(data.funcionalidades || []))
            .catch(() => setError('No se pudieron cargar las funcionalidades.'));
    }, [token]);

    if (error) return <p className="login-error">{error}</p>;

    return (
        <div className="panel-grid">
            {funcionalidades.map((f) => (
                <div key={f.id} className="panel-card">
                    <h3>{f.nombre}</h3>
                    <span>{f.ruta}</span>
                </div>
            ))}
        </div>
    );
}

export default function AdminPanel() {
    const { adminSession, logoutAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!adminSession) navigate('/');
    }, [adminSession, navigate]);

    if (!adminSession) return null;

    return (
        <div className="panel-screen">
            <header className="panel-header">
                <h1>🥘 Panel de Administrador</h1>
                <div className="panel-user">
                    <span>{adminSession.usuario?.nombre}</span>
                    <button onClick={() => { logoutAdmin(); navigate('/'); }} className="logout-btn">
                        Cerrar sesión
                    </button>
                </div>
            </header>
            <main className="panel-main">
                <h2>Bienvenido, {adminSession.usuario?.nombre}</h2>
                <p>{adminSession.usuario?.email}</p>
                <PanelFuncionalidades token={adminSession.token} />
            </main>
        </div>
    );
}