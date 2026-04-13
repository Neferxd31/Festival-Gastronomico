import { useState, useEffect } from 'react'; // Importamos useEffect
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

export default function Login() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // --- EFECTO PARA PERSISTENCIA ---
    useEffect(() => {
        // Al cargar la página, revisamos si hay un usuario en el "disco" del navegador
        const savedUser = localStorage.getItem('user_session');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleSuccess = async (response) => {
        setError(null);
        const userObject = jwtDecode(response.credential);

        try {
            const res = await fetch('http://127.0.0.1:8000/api/google-login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential }),
            });
            const data = await res.json();

            if (data.status === "success") {
                // GUARDAR EN LOCALSTORAGE
                localStorage.setItem('user_session', JSON.stringify(userObject));
                setUser(userObject);
            } else {
                setError("No se pudo iniciar sesión. Intenta de nuevo.");
            }
        } catch (error) {
            console.error("Error al conectar con el servidor", error);
            setError("Error al conectar con el servidor. Intenta más tarde.");
        }
    };

    const handleError = () => {
        setError("Inicio de sesión cancelado o fallido. Intenta de nuevo.");
    };

    const handleLogout = () => {
        googleLogout();
        // LIMPIAR LOCALSTORAGE
        localStorage.removeItem('user_session');
        setUser(null);
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="login-screen">
                <div className="login-card">
                    <h1>🥘 Festival Gastronómico</h1>

                    {!user ? (
                        <div className="login-section">
                            <p>Inicia sesión para empezar a votar por tus platos favoritos</p>
                            {error && (
                                <p className="login-error">{error}</p>
                            )}
                            <GoogleLogin
                                onSuccess={handleSuccess}
                                onError={handleError}
                                theme="filled_blue"
                                shape="pill"
                            />
                        </div>
                    ) : (
                        <div className="welcome-msg">
                            <img src={user.picture} alt="Avatar" className="user-photo" />
                            <h3>¡Hola, {user.name}!</h3>
                            <p>{user.email}</p>

                            <button onClick={handleLogout} className="logout-btn">
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}