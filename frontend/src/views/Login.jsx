import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin, googleLogout } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Link } from "react-router-dom";
import '../styles/Login.css';
import { API_URL } from '../config/api'

/* =========================
   TAB VOTANTE
========================= */
function TabVotante() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const saved = localStorage.getItem('user_session');
        if (saved) {
            setUser(JSON.parse(saved));
            navigate('/');
        }
    }, []);

    const handleSuccess = async (tokenResponse) => {
        setError(null);
        try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });

            const userInfo = await res.json();

            const backendRes = await fetch(`${API_URL}/api/google-login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenResponse.access_token }),
            });

            const data = await backendRes.json();

            if (data.status === 'success') {
                localStorage.setItem('user_session', JSON.stringify(data.user));
                setUser(data.user);
                navigate('/');
            } else {
                setError('No se pudo iniciar sesión. Intenta de nuevo.');
            }
        } catch {
            setError('Error al conectar con el servidor.');
        }
    };

    const login = useGoogleLogin({
        onSuccess: handleSuccess,
        onError: () => setError('Error al iniciar sesión con Google.'),
    });

    if (user) {
        return (
            <div className="welcome-container">
                <div className="profile-badge">
                    <img src={user.picture} alt="Avatar" referrerPolicy="no-referrer" />
                </div>
                <h3>¡Qué bueno verte, {user.name.split(' ')[0]}!</h3>
                <p>Ya puedes votar por tus platos favoritos.</p>
                <button
                    onClick={() => {
                        googleLogout();
                        localStorage.removeItem('user_session');
                        setUser(null);
                    }}
                    className="logout-btn"
                >
                    Cerrar Sesión
                </button>
            </div>
        );
    }

    return (
        <div className="tab-content fade-in">
            <p className="description">Apoya al mejor talento local con tu voto.</p>
            {error && <div className="error-badge">{error}</div>}

            <button
                onClick={() => {
                    setError(null);
                    login();
                }}
                className="google-btn"
            >
                <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="G"
                />
                Continuar con Google
            </button>
        </div>
    );
}

/* =========================
   TAB ADMIN
========================= */
function TabAdmin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);
    const { loginAdmin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password.trim()) {
            setError('Todos los campos son obligatorios.');
            return;
        }

        setCargando(true);

        try {
            const res = await fetch(`${API_URL}/api/usuarios/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                loginAdmin(data.token, data.usuario);
                navigate('/admin/panel');
            } else {
                setError(data?.detail || 'Credenciales inválidas.');
            }
        } catch {
            setError('Error de conexión.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <form className="admin-form fade-in" onSubmit={handleSubmit} noValidate>
            {error && <div className="error-badge">{error}</div>}

            <div className="input-group">
                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div className="input-group">
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            <div className="form-footer">
                <Link to="/ForgotPassword" id="forgot-link">
                    ¿Olvidaste tu contraseña?
                </Link>
            </div>

            <button type="submit" className="submit-btn" disabled={cargando}>
                {cargando ? <span className="loader"></span> : 'Entrar al Panel'}
            </button>
        </form>
    );
}

/* =========================
   LOGIN PRINCIPAL
========================= */
export default function Login() {
    const [tab, setTab] = useState('votante');

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="login-wrapper">
                <div className="login-container">

                    <header className="login-header">
                        {/* 🔥 IMPORTANTE: imagen desde /public */}
                        <img src="/logo.webp" alt="Logo Festival" className="main-logo" />
                        <h1>Festival<span>Gastronómico</span></h1>
                    </header>

                    <div className="tabs-container">
                        <button
                            className={`tab-link ${tab === 'votante' ? 'active' : ''}`}
                            onClick={() => setTab('votante')}
                        >
                            Votante
                        </button>

                        <button
                            className={`tab-link ${tab === 'admin' ? 'active' : ''}`}
                            onClick={() => setTab('admin')}
                        >
                            Staff
                        </button>
                    </div>

                    <main className="login-body">
                        {tab === 'votante' ? <TabVotante /> : <TabAdmin />}
                    </main>

                </div>
            </div>
        </GoogleOAuthProvider>
    );
}