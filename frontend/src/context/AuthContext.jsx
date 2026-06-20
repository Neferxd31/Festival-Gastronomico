import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '../config/api'

const AuthContext = createContext(null);

// Tiempo de inactividad permitido antes de cerrar sesión automáticamente
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutos

export function AuthProvider({ children }) {
    const [adminSession, setAdminSession] = useState(null);
    const inactivityTimer = useRef(null);

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
                await fetch(`${API_URL}/api/usuarios/logout/`, {
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

    // --- Cierre de sesión automático por inactividad ---
    const handleInactivityLogout = useCallback(async () => {
        await logoutAdmin();
        window.location.href = '/login';
    }, []);

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
        }
        inactivityTimer.current = setTimeout(handleInactivityLogout, INACTIVITY_LIMIT_MS);
    }, [handleInactivityLogout]);

    useEffect(() => {
        // Solo medimos inactividad si hay una sesión de admin activa
        if (!adminSession) {
            if (inactivityTimer.current) {
                clearTimeout(inactivityTimer.current);
                inactivityTimer.current = null;
            }
            return;
        }

        const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        resetInactivityTimer();

        eventos.forEach((evento) =>
            window.addEventListener(evento, resetInactivityTimer)
        );

        return () => {
            eventos.forEach((evento) =>
                window.removeEventListener(evento, resetInactivityTimer)
            );
            if (inactivityTimer.current) {
                clearTimeout(inactivityTimer.current);
                inactivityTimer.current = null;
            }
        };
    }, [adminSession, resetInactivityTimer]);

    return (
        <AuthContext.Provider value={{ adminSession, loginAdmin, logoutAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}