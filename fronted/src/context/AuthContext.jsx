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

    const logoutAdmin = () => {
        localStorage.removeItem('admin_session');
        setAdminSession(null);
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