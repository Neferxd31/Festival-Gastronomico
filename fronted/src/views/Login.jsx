import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

function LoginContent() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user_session');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleSuccess = async (tokenResponse) => {
        setError(null);
        try {
            const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const userInfo = await res.json();

            const backendRes = await fetch('http://127.0.0.1:8000/api/google-login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenResponse.access_token }),
            });
            const data = await backendRes.json();

            if (data.status === "success") {
                localStorage.setItem('user_session', JSON.stringify(userInfo));
                setUser(userInfo);
            } else {
                setError("No se pudo iniciar sesión. Intenta de nuevo.");
            }
        } catch (err) {
            console.error("Error al conectar con el servidor", err);
            setError("Error al conectar con el servidor. Intenta más tarde.");
        }
    };

    const login = useGoogleLogin({
        onSuccess: handleSuccess,
        onError: () => setError("Error al iniciar sesión con Google. Intenta de nuevo."),
        onNonOAuthError: () => setError("Inicio de sesión cancelado."),
    });

    const handleLogout = () => {
        googleLogout();
        localStorage.removeItem('user_session');
        setUser(null);
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <h1>🥘 Festival Gastronómico</h1>

                {!user ? (
                    <div className="login-section">
                        <p>Inicia sesión para empezar a votar por tus platos favoritos</p>
                        {error && (
                            <p className="login-error">{error}</p>
                        )}
                        <button onClick={() => { setError(null); login(); }} className="google-btn">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                            Iniciar sesión con Google
                        </button>
                    </div>
                ) : (
                    <div className="welcome-msg">
                        <img src={user.picture} alt="Avatar" className="user-photo" referrerPolicy="no-referrer" />
                        <h3>¡Hola, {user.name}!</h3>
                        <p>{user.email}</p>
                        <button onClick={handleLogout} className="logout-btn">
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Login() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <LoginContent />
        </GoogleOAuthProvider>
    );
}
