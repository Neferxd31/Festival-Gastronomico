import '../../styles/ModalDelete.css';
export default function ConfirmDeleteModal({
  abierto,
  participante,
  onConfirmar,
  onCancelar
}) {
  if (!abierto) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Eliminar participante</h3>

        <p>
          ¿Seguro que deseas eliminar a
          <strong> {participante?.nombre}?</strong>  Esta  acción es <strong>irreversible</strong>
        </p>

        <div className="modal-actions">
          <button onClick={onCancelar}>
            Cancelar
          </button>

          <button onClick={onConfirmar}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}