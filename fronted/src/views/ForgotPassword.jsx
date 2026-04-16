import React, { useState } from "react";
import "../styles/ForgotPassword.css";
import axios from "axios";

function ForgotPassword() {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const solicitarCodigo = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/usuarios/ForgotPassword/",
        { email }
      );

      setMensaje(res.data.mensaje);
      setStep(2);

    } catch (err) {
      setError("No fue posible enviar el código.");
    }
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/usuarios/reset-password/confirm/",
        {
          email,
          token,
          new_password: newPassword,
          confirm_password: confirmPassword
        }
      );

      setMensaje(res.data.mensaje);

    } catch (err) {
      setError("No se pudo cambiar la contraseña.");
    }
  };

  return (
  <div className="forgot-container">

    <div className="forgot-logo">
      <img src="https://res.cloudinary.com/ds1jzhu4b/image/upload/q_auto/f_auto/v1776222815/logo_w0ycq8.webp" alt="Logo Festival" />
    </div>

    <div className="forgot-card">

      <p className="forgot-subtitle">
        Recupera el acceso al panel administrativo
      </p>

      {mensaje && <p className="forgot-success">{mensaje}</p>}
      {error && <p className="forgot-error">{error}</p>}

      {step === 1 && (
        <form onSubmit={solicitarCodigo}>
          <input
            className="forgot-input"
            type="email"
            placeholder="Correo administrador"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="forgot-btn" type="submit">
            Enviar código
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={cambiarPassword}>
          <input
            className="forgot-input"
            type="text"
            placeholder="Código"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />

          <input
            className="forgot-input"
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <input
            className="forgot-input"
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button className="forgot-btn" type="submit">
            Cambiar contraseña
          </button>
        </form>
      )}

      <div className="forgot-footer">
        <a href="/">Volver al login</a>
      </div>

    </div>
  </div>
);
}

export default ForgotPassword;