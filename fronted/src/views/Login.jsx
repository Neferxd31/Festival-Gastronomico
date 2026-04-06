import { useState } from 'react'; // Para guardar al usuario
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

export default function Login() {
    const [user, setUser] = useState(null);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const handleSuccess = async (response) => {
        const res = await fetch('http://127.0.0.1:8000/api/google-login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential }),
        });

        const data = await res.json();
        if (data.status === "success") {
            console.log("Sesión iniciada en el servidor para:", data.user.name);
            // Aquí podrías redirigir al usuario al menú del festival
        }
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="login-screen">
                <div className="login-card">
                    <h1>🥘 Festival Gastronómico</h1>

                    {!user ? (
                        <>
                            <p>Inicia sesión para descubrir los mejores sabores</p>
                            <div className="google-btn-wrapper">
                                <GoogleLogin
                                    onSuccess={handleSuccess}
                                    onError={() => console.log('Error en el login')}
                                    theme="filled_blue"
                                    shape="pill"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="welcome-msg">
                            <img src={user.picture} alt="Avatar" className="user-photo" />
                            <h3>¡Hola, {user.given_name}!</h3>
                            <button onClick={() => setUser(null)} className="logout-btn">
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}