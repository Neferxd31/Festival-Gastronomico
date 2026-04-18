import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [adminSession, setAdminSession] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem('admin_session');
        if (saved) setAdminSession(JSON.parse(saved));
    }, []);

    const loginAdmin = (token, usuario) => {
        const session = { token, usuario };
        localStorage.setItem('admin_session', JSON.stringify(session));
        setAdminSession(session);
    };

   const logoutAdmin = async () => {
        const saved = localStorage.getItem('admin_session');
        const token = saved ? JSON.parse(saved).token : null;

        // Notificar al backend (best-effort: si falla, igual cerramos sesión)
        try {
            if (token) {
                await fetch('http://127.0.0.1:8000/api/usuarios/logout/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch {
            // Error de red — igual limpiamos la sesión local
        }

        localStorage.removeItem('admin_session');
        setAdminSession(null);
        // La redirección la hace el componente que llama a logoutAdmin()
    };

    return (
        <AuthContext.Provider value={{ adminSession, loginAdmin, logoutAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}