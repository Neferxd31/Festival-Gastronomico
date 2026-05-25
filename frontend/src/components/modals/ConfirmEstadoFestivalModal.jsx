// src/components/modals/ConfirmEstadoFestivalModal.jsx
export default function ConfirmEstadoFestivalModal({ abierto, nuevoEstado, onCancelar, onConfirmar }) {
  if (!abierto) return null

  const esAbrir = nuevoEstado === 'ABIERTO'

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="modal-titulo">
          {esAbrir ? '🟢 Abrir festival' : '🔴 Cerrar festival'}
        </h2>
        <p className="modal-texto">
          {esAbrir
            ? 'Al abrir el festival, los votantes podrán emitir sus votos y se habilitarán las acciones de administración.'
            : 'Al cerrar el festival, se suspenderán las votaciones y se bloquearán las ediciones de participantes para preservar los resultados.'
          }
        </p>
        <p className="modal-texto modal-texto--pregunta">
          ¿Estás seguro de que deseas continuar?
        </p>
        <div className="modal-acciones">
          <button className="modal-btn modal-btn--cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            className={`modal-btn ${esAbrir ? 'modal-btn--confirmar' : 'modal-btn--peligro'}`}
            onClick={onConfirmar}
          >
            Sí, {esAbrir ? 'abrir' : 'cerrar'} festival
          </button>
        </div>
      </div>
    </div>
  )
}