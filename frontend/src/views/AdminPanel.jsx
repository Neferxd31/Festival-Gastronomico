import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal';
import SuccessDeleteModal from '../components/modals/SuccessDeleteModal';
import '../styles/AdminPanel.css';

function TablaParticipantes({ token }) {
    const { logoutAdmin } = useAuth();
    const navigate = useNavigate();

    const [restaurantes, setRestaurantes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [toggling, setToggling] = useState(null);

    const [modalDelete, setModalDelete] = useState(false);
    const [seleccionado, setSeleccionado] = useState(null);
    const [modalDeleteSuccess, setModalDeleteSuccess] = useState(false);

    const cargar = useCallback(() => {
        setCargando(true);
        fetch('http://127.0.0.1:8000/api/restaurantes/admin/', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                if (res.status === 401) {
                    logoutAdmin();
                    navigate('/');
                }
                return res.json();
            })
            .then(data => setRestaurantes(data))
            .catch(() => setError('No se pudieron cargar los participantes.'))
            .finally(() => setCargando(false));
    }, [token, logoutAdmin, navigate]);

    useEffect(() => { cargar(); }, [cargar]);

    const handleToggle = async (id) => {
        setToggling(id);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/restaurantes/${id}/toggle/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setRestaurantes(prev =>
                    prev.map(r => r.id === id ? { ...r, habilitado: data.habilitado } : r)
                );
            }
        } finally {
            setToggling(null);
        }
    };

    const eliminarParticipante = async () => {
        try {
            const res = await fetch(
                `http://127.0.0.1:8000/api/restaurantes/${seleccionado.id}/eliminar/`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (res.ok) {
                setRestaurantes(prev =>
                    prev.filter(x => x.id !== seleccionado.id)
                );

                setModalDelete(false);
                setModalDeleteSuccess(true);
            }
        } catch (error) {
            console.log(error);
        }
    };

    if (cargando) return <p className="panel-empty">Cargando...</p>;
    if (error) return <p className="panel-error">{error}</p>;

    return (
        <div className="panel-grid">
            {restaurantes.map(r => (
                <div key={r.id} className="panel-card">

                    {r.plato?.imagen_url && (
                        <img src={r.plato.imagen_url} className="panel-card-img" />
                    )}

                    <h3>{r.nombre}</h3>
                    <p>{r.descripcion}</p>

                    <span className={`panel-badge ${r.habilitado ? 'on' : 'off'}`}>
                        {r.habilitado ? 'Habilitado' : 'Deshabilitado'}
                    </span>

                    <div className="panel-actions">
                        <button
                            className={`btn-toggle ${r.habilitado ? 'off' : 'on'}`}
                            onClick={() => handleToggle(r.id)}
                            disabled={toggling === r.id}
                        >
                            {toggling === r.id ? '...' : r.habilitado ? 'Deshabilitar' : 'Habilitar'}
                        </button>

                        <button
                            className="btn-delete"
                            onClick={() => {
                                setSeleccionado(r);
                                setModalDelete(true);
                            }}
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            ))}

            <ConfirmDeleteModal
                abierto={modalDelete}
                participante={seleccionado}
                onCancelar={() => setModalDelete(false)}
                onConfirmar={eliminarParticipante}
            />

            <SuccessDeleteModal
                abierto={modalDeleteSuccess}
                mensaje="El participante fue eliminado."
                onCerrar={() => setModalDeleteSuccess(false)}
            />
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
                <div className="panel-brand">
                    <img src="/logo.webp" alt="logo" />
                    <h1>Panel Admin</h1>
                </div>

                <div className="panel-user">
                    <span>{adminSession.usuario?.nombre}</span>
                    <button
                        onClick={async () => {
                            await logoutAdmin();
                            navigate('/');
                        }}
                        className="logout-btn"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </header>

            <main className="panel-main">

                <div className="panel-top">
                    <h2>Participantes</h2>

                    <div className="panel-acciones">
                        <Link to="/admin/crear-participante" className="btn-crear">
                            + Crear
                        </Link>
                        <Link to="/admin/papelera" className="btn-sec">
                            Papelera
                        </Link>
                    </div>
                </div>

                <TablaParticipantes token={adminSession.token} />
            </main>
        </div>
    );
}