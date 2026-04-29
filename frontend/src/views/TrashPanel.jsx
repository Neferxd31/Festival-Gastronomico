import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/TrashPanel.css';

export default function TrashPanel() {
  const { adminSession } = useAuth();
  const navigate = useNavigate();

  const token = adminSession?.token;

  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!adminSession) {
      navigate('/');
      return;
    }
  }, [adminSession, navigate]);

  useEffect(() => {
    if (!token) return;

    fetch('http://127.0.0.1:8000/api/restaurantes/eliminados/', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.detail || 'Error');
        return data;
      })
      .then(data => setDatos(Array.isArray(data) ? data : []))
      .catch(console.log)
      .finally(() => setCargando(false));

  }, [token]);

  const restaurar = async (id) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/restaurantes/${id}/restaurar/`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.ok) {
        setDatos(prev => prev.filter(x => x.id !== id));
      }

    } catch (error) {
      console.log(error);
    }
  };

  if (cargando) return <p className="trash-empty">Cargando papelera...</p>;

  return (
    <div className="trash-screen">

      <div className="trash-header">
        <h1>Papelera</h1>

        <button
          className="trash-back"
          onClick={() => navigate('/admin/panel')}
        >
          ← Volver
        </button>
      </div>

      {datos.length === 0 ? (
        <p className="trash-empty">No hay participantes eliminados.</p>
      ) : (
        <div className="trash-grid">

          {datos.map(r => (
            <div key={r.id} className="trash-card">

              <div className="trash-top">
                <h3>{r.nombre}</h3>
                <span className="trash-badge">
                  Eliminado
                </span>
              </div>

              <p>{r.direccion}</p>

              {r.fecha_eliminacion && (
                <small>
                  Eliminado: {new Date(r.fecha_eliminacion).toLocaleDateString()}
                </small>
              )}

              <button
                className="trash-restore"
                onClick={() => restaurar(r.id)}
              >
                ♻ Restaurar
              </button>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}