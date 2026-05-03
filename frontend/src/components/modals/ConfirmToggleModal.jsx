import React from 'react';
import '../../styles/ConfirmToggleModal.css'; // <-- Importante importar los estilos

export default function ConfirmToggleModal({ abierto, participante, onCancelar, onConfirmar }) {
    if (!abierto || !participante) return null;

    const esHabilitar = !participante.habilitado;

    const titulo = esHabilitar ? "Habilitar participante" : "Deshabilitar participante";
    const mensaje = esHabilitar
        ? "¿Está seguro? Esta información será visible para los votantes."
        : "¿Está seguro? Esta información dejará de ser visible para los votantes.";

    return (
        <div className="modal-toggle-overlay">
            <div className="modal-toggle-card">

                <div className="modal-toggle-body">
                    {/* Icono dinámico */}
                    <div className={`modal-toggle-icon ${esHabilitar ? 'icon-green' : 'icon-red'}`}>
                        {esHabilitar ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                    </div>

                    <h3 className="modal-toggle-title">{titulo}</h3>
                    <p className="modal-toggle-text">{mensaje}</p>
                </div>

                <div className="modal-toggle-footer">
                    <button onClick={onCancelar} className="btn-toggle btn-toggle-cancel">
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirmar}
                        className={`btn-toggle ${esHabilitar ? 'btn-toggle-enable' : 'btn-toggle-disable'}`}
                    >
                        {esHabilitar ? 'Sí, habilitar' : 'Sí, deshabilitar'}
                    </button>
                </div>

            </div>
        </div>
    );
}