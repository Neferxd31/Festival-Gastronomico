// src/components/modals/ConfirmEstadoFestivalModal.jsx
import '../../styles/ConfirmEstadoFestivalModal.css'

export default function ConfirmEstadoFestivalModal({ abierto, nuevoEstado, onCancelar, onConfirmar }) {
  if (!abierto) return null

  const esAbrir = nuevoEstado === 'ABIERTO'

  return (
    <div className="cefm-overlay">
      <div className={`cefm-box ${esAbrir ? 'cefm-box--abrir' : 'cefm-box--cerrar'}`}>
        <h2 className="cefm-titulo">
          <span className="cefm-icono">{esAbrir ? '🟢' : '🔴'}</span>
          {esAbrir ? 'Abrir festival' : 'Cerrar festival'}
        </h2>
        <p className="cefm-texto">
          {esAbrir
            ? 'Al abrir el festival, los votantes podrán emitir sus votos y se habilitarán las acciones de administración.'
            : 'Al cerrar el festival, se suspenderán las votaciones y se bloquearán las ediciones de participantes para preservar los resultados.'
          }
        </p>
        <p className="cefm-texto cefm-texto--pregunta">
          ¿Estás seguro de que deseas continuar?
        </p>
        <div className="cefm-acciones">
          <button className="cefm-btn cefm-btn--cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            className={`cefm-btn ${esAbrir ? 'cefm-btn--confirmar' : 'cefm-btn--peligro'}`}
            onClick={onConfirmar}
          >
            Sí, {esAbrir ? 'abrir' : 'cerrar'} festival
          </button>
        </div>
      </div>
    </div>
  )
}