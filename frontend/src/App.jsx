import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './views/Login';
import AdminPanel from './views/AdminPanel';
import ForgotPassword from './views/ForgotPassword';
import Home from './views/Home';
import CrearParticipante from './views/CrearParticipante';
import './App.css';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/"                        element={<Home />} />
                    <Route path="/login"                   element={<Login />} />
                    <Route path="/admin/panel"             element={<AdminPanel />} />
                    <Route path="/admin/crear-participante" element={<CrearParticipante />} />
                    <Route path="/ForgotPassword"          element={<ForgotPassword />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}