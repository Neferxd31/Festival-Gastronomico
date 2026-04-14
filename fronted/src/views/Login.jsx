import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';

export default function Login() {
    const [user, setUser] = useState(null);
    const [cedulaInput, setCedulaInput] = useState("");
    const [isLoading, setIsLoading] = useState(false); // Estado para manejar la espera
    const [isUpdatingCedula, setIsUpdatingCedula] = useState(false);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // --- PERSISTENCIA: Cargar sesión al montar el componente ---
    useEffect(() => {
        const savedUser = localStorage.getItem('user_session');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    // --- LOGIN: Manejar éxito de Google y registro en Django ---
    const handleSuccess = async (response) => {
        setIsLoading(true); // Iniciamos carga
        try {
            const res = await fetch('http://127.0.0.1:8000/api/google-login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential }),
            });
            const data = await res.json();

            if (data.status === "success") {
                // Guardamos la respuesta del backend (que incluye votante_id y has_cedula)
                localStorage.setItem('user_session', JSON.stringify(data.user));
                setUser(data.user);
            } else {
                alert("Error en el servidor: " + data.message);
            }
        } catch (error) {
            console.error("Error al conectar con el servidor", error);
            alert("No se pudo conectar con el servidor. Revisa si Django está corriendo.");
        } finally {
            setIsLoading(false); // Finalizamos carga
        }
    };

    // --- CÉDULA: Actualizar documento en la BD ---
    const handleCedulaSubmit = async (e) => {
        e.preventDefault();
        setIsUpdatingCedula(true);

        try {
            const res = await fetch('http://127.0.0.1:8000/api/update-cedula/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    votante_id: user.votante_id,
                    cedula: cedulaInput
                }),
            });
            const data = await res.json();

            if (data.status === "success") {
                // Actualizamos el estado local y el almacenamiento
                const updatedUser = { ...user, has_cedula: true };
                setUser(updatedUser);
                localStorage.setItem('user_session', JSON.stringify(updatedUser));
                alert("Cédula guardada exitosamente.");
            }
        } catch (error) {
            console.error("Error al guardar la cédula", error);
        } finally {
            setIsUpdatingCedula(false);
        }
    };

    // --- LOGOUT: Limpiar todo ---
    const handleLogout = () => {
        googleLogout();
        localStorage.removeItem('user_session');
        setUser(null);
        setCedulaInput("");
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="login-screen">
                <div className="login-card">
                    <h1>🥘 Festival Gastronómico</h1>

                    {/* INTERFAZ DE CARGA GENERAL */}
                    {isLoading ? (
                        <div className="loading-container">
                            <p style={{ color: '#2196F3', fontWeight: 'bold' }}>🔄 Autenticando...</p>
                            <p>Esto puede tardar unos segundos debido a la conexión con Railway.</p>
                        </div>
                    ) : !user ? (
                        /* SECCIÓN: INICIO DE SESIÓN */
                        <div className="login-section">
                            <p>Inicia sesión para empezar a votar por tus platos favoritos</p>
                            <GoogleLogin
                                onSuccess={handleSuccess}
                                onError={() => console.log('Error en el login')}
                                theme="filled_blue"
                                shape="pill"
                            />
                        </div>
                    ) : (
                        /* SECCIÓN: BIENVENIDA Y PERFIL */
                        <div className="welcome-msg">
                            <img
                                src={user.picture}
                                alt="Avatar"
                                className="user-photo"
                                style={{ width: '80px', borderRadius: '50%', marginBottom: '10px' }}
                            />
                            <h3>¡Hola, {user.name}!</h3>
                            <p style={{ fontSize: '0.9em', color: '#666' }}>{user.email}</p>

                            <hr style={{ margin: '20px 0', opacity: '0.2' }} />

                            {/* LÓGICA DE CÉDULA */}
                            {!user.has_cedula ? (
                                <form onSubmit={handleCedulaSubmit} className="cedula-form">
                                    <p style={{ color: '#ff9800', fontWeight: 'bold' }}>
                                        ⚠️ Registro necesario:
                                    </p>
                                    <p style={{ fontSize: '0.85em' }}>
                                        Ingresa tu cédula para habilitar tu voto.
                                    </p>
                                    <input
                                        type="number"
                                        placeholder="Número de cédula"
                                        value={cedulaInput}
                                        onChange={(e) => setCedulaInput(e.target.value)}
                                        required
                                        style={{
                                            padding: '12px',
                                            margin: '10px 0',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isUpdatingCedula}
                                        style={{
                                            padding: '10px',
                                            backgroundColor: isUpdatingCedula ? '#ccc' : '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            width: '100%',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {isUpdatingCedula ? "Guardando..." : "Guardar Cédula"}
                                    </button>
                                </form>
                            ) : (
                                <div style={{
                                    marginTop: '15px',
                                    padding: '10px',
                                    backgroundColor: '#e8f5e9',
                                    borderRadius: '8px',
                                    border: '1px solid #c8e6c9'
                                }}>
                                    <p style={{ color: '#2e7d32', margin: 0, fontWeight: 'bold' }}>
                                        ✅ Ya puedes votar por tus platos.
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleLogout}
                                className="logout-btn"
                                style={{
                                    marginTop: '30px',
                                    padding: '8px 15px',
                                    backgroundColor: 'transparent',
                                    color: '#f44336',
                                    border: '1px solid #f44336',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85em'
                                }}
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}