import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal';
import SuccessDeleteModal from '../components/modals/SuccessDeleteModal';
import ConfirmToggleModal from '../components/modals/ConfirmToggleModal'; // <-- Importamos el nuevo modal

function TablaParticipantes({ token }) {
    const { logoutAdmin } = useAuth();
    const navigate = useNavigate();
    const [restaurantes, setRestaurantes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [toggling, setToggling] = useState(null); // id del que está cambiando

    // Estados para modales de eliminación
    const [modalDelete, setModalDelete] = useState(false);
    const [seleccionado, setSeleccionado] = useState(null);
    const [modalDeleteSuccess, setModalDeleteSuccess] = useState(false);

    // Estados para el nuevo modal de toggle (habilitar/deshabilitar)
    const [modalToggle, setModalToggle] = useState(false);
    const [restauranteToggle, setRestauranteToggle] = useState(null);

    const cargar = useCallback(() => {
        setCargando(true);
        fetch('http://127.0.0.1:8000/api/restaurantes/admin/', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                if (res.status === 401) { logoutAdmin(); navigate('/'); }
                return res.json();
            })
            .then(data => setRestaurantes(data))
            .catch(() => setError('No se pudieron cargar los participantes.'))
            .finally(() => setCargando(false));
    }, [token, logoutAdmin, navigate]);

    useEffect(() => { cargar(); }, [cargar]);

    // Función para abrir el modal
    const abrirModalToggle = (restaurante) => {
        setRestauranteToggle(restaurante);
        setModalToggle(true);
    };

    // Función que se ejecuta cuando el administrador confirma en el modal
    const ejecutarToggle = async () => {
        if (!restauranteToggle) return;

        const id = restauranteToggle.id;

        // Cerramos el modal inmediatamente y mostramos estado de carga en el botón
        setModalToggle(false);
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
        } catch { /* silencioso */ }
        finally {
            setToggling(null);
            setRestauranteToggle(null); // Limpiamos el estado
        }
    };

    const eliminarParticipante = async () => {
        try {
            const res = await fetch(
                `http://127.0.0.1:8000/api/restaurantes/${seleccionado.id}/eliminar/`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
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

    if (cargando) return <p className="panel-empty">Cargando participantes...</p>;
    if (error) return <p className="login-error">{error}</p>;
    if (restaurantes.length === 0)
        return <p className="panel-empty">Aún no hay participantes registrados.</p>;

    return (
        <div className="panel-tabla-wrap">
            <table className="panel-tabla">
                <thead>
                    <tr>
                        <th>Restaurante</th>
                        <th>Plato estrella</th>
                        <th>Dirección</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {restaurantes.map(r => (
                        <tr key={r.id}>
                            <td>
                                <strong>{r.nombre}</strong>
                                {r.descripcion && (
                                    <small>{r.descripcion.slice(0, 60)}{r.descripcion.length > 60 ? '…' : ''}</small>
                                )}
                            </td>
                            <td>
                                {r.plato ? (
                                    <span className="panel-plato">
                                        {r.plato.imagen_url && (
                                            <img src={r.plato.imagen_url} alt={r.plato.nombre} />
                                        )}
                                        {r.plato.nombre}
                                    </span>
                                ) : '—'}
                            </td>
                            <td>{r.direccion}</td>
                            <td>
                                <span className={`panel-badge ${r.habilitado ? 'panel-badge--on' : 'panel-badge--off'}`}>
                                    {r.habilitado ? 'Habilitado' : 'Deshabilitado'}
                                </span>
                            </td>
                            <td>
                                <button
                                    className={`panel-toggle ${r.habilitado ? 'panel-toggle--off' : 'panel-toggle--on'}`}
                                    onClick={() => abrirModalToggle(r)} // <-- Ahora abre el modal y pasa el objeto completo
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
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal de confirmación para habilitar/deshabilitar */}
            <ConfirmToggleModal
                abierto={modalToggle}
                participante={restauranteToggle}
                onCancelar={() => {
                    setModalToggle(false);
                    setRestauranteToggle(null);
                }}
                onConfirmar={ejecutarToggle}
            />

            <ConfirmDeleteModal
                abierto={modalDelete}
                participante={seleccionado}
                onCancelar={() => setModalDelete(false)}
                onConfirmar={eliminarParticipante}
            />

            <SuccessDeleteModal
                abierto={modalDeleteSuccess}
                mensaje="El participante fue enviado a la papelera."
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
                <h1>🥘 Panel de Administrador</h1>
                <div className="panel-user">
                    <span>{adminSession.usuario?.nombre}</span>
                    <button onClick={async () => { await logoutAdmin(); navigate('/'); }} className="logout-btn">
                        Cerrar sesión
                    </button>
                </div>
            </header>
            <main className="panel-main">
                <h2>Bienvenido, {adminSession.usuario?.nombre}</h2>
                <p>{adminSession.usuario?.email}</p>

                <div className="panel-acciones">
                    <Link to="/admin/crear-participante" className="panel-accion-btn">
                        + Crear participante
                    </Link>
                    <Link to="/admin/papelera" className="panel-accion-btn">
                        Ver papelera
                    </Link>
                </div>

                <h3 className="panel-section-title">Participantes registrados</h3>
                <TablaParticipantes token={adminSession.token} />
            </main>
        </div>
    );
}