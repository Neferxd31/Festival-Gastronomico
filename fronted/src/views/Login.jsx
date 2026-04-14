import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin, googleLogout } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

// ─── Tab Votante (Google) ────────────────────────────────────────────────────
function TabVotante() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem('user_session');
        if (saved) setUser(JSON.parse(saved));
    }, []);

    const handleSuccess = async (tokenResponse) => {
        setError(null);
        try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const userInfo = await res.json();

            const backendRes = await fetch('http://127.0.0.1:8000/api/google-login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenResponse.access_token }),
            });
            const data = await backendRes.json();

            if (data.status === 'success') {
                localStorage.setItem('user_session', JSON.stringify(userInfo));
                setUser(userInfo);
            } else {
                setError('No se pudo iniciar sesión. Intenta de nuevo.');
            }
        } catch {
            setError('Error al conectar con el servidor. Intenta más tarde.');
        }
    };

    const login = useGoogleLogin({
        onSuccess: handleSuccess,
        onError: () => setError('Error al iniciar sesión con Google.'),
        onNonOAuthError: () => setError('Inicio de sesión cancelado.'),
    });

    const handleLogout = () => {
        googleLogout();
        localStorage.removeItem('user_session');
        setUser(null);
    };

    if (user) {
        return (
            <div className="welcome-msg">
                <img src={user.picture} alt="Avatar" className="user-photo" referrerPolicy="no-referrer" />
                <h3>¡Hola, {user.name}!</h3>
                <p>{user.email}</p>
                <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
            </div>
        );
    }

    return (
        <div className="login-section">
            <p>Inicia sesión para votar por tus platos favoritos</p>
            {error && <p className="login-error">{error}</p>}
            <button onClick={() => { setError(null); login(); }} className="google-btn">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                Iniciar sesión con Google
            </button>
        </div>
    );
}

// ─── Tab Administrador ───────────────────────────────────────────────────────
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

        // Escenario 3: campos vacíos
        if (!email.trim() || !password.trim()) {
            setError('El email y la contraseña son obligatorios.');
            return;
        }

        setCargando(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/usuarios/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                // Escenario 1: login exitoso → guardar sesión y redirigir
                loginAdmin(data.token, data.usuario);
                navigate('/admin/panel');
            } else {
                // Escenario 2: credenciales inválidas
                const msg = data?.detail || data?.email?.[0] || data?.password?.[0]
                    || 'Credenciales inválidas.';
                setError(msg);
            }
        } catch {
            setError('Error al conectar con el servidor. Intenta más tarde.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <form className="admin-form" onSubmit={handleSubmit} noValidate>
            {error && <p className="login-error">{error}</p>}

            <div className="field-group">
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    placeholder="admin@festival.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                />
            </div>

            <div className="field-group">
                <label htmlFor="password">Contraseña</label>
                <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                />
            </div>

            <button type="submit" className="admin-btn" disabled={cargando}>
                {cargando ? 'Iniciando sesión...' : 'Ingresar al panel'}
            </button>
        </form>
    );
}

// ─── Componente principal Login ──────────────────────────────────────────────
function LoginContent() {
    const [tab, setTab] = useState('votante'); // 'votante' | 'admin'

    return (
        <div className="login-screen">
            <div className="login-card">
                <h1>🥘 Festival Gastronómico</h1>

                <div className="login-tabs">
                    <button
                        className={`tab-btn ${tab === 'votante' ? 'active' : ''}`}
                        onClick={() => setTab('votante')}
                    >
                        Votante
                    </button>
                    <button
                        className={`tab-btn ${tab === 'admin' ? 'active' : ''}`}
                        onClick={() => setTab('admin')}
                    >
                        Administrador
                    </button>
                </div>

                {tab === 'votante' ? <TabVotante /> : <TabAdmin />}
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