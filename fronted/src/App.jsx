import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './views/Login';
import AdminPanel from './views/AdminPanel';
import './App.css';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/"             element={<Login />} />
                    <Route path="/admin/panel"  element={<AdminPanel />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}