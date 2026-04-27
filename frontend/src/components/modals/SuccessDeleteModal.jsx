export default function SuccessDeleteModal({
  abierto,
  mensaje,
  onCerrar
}) {
  if (!abierto) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Proceso completado</h3>
        <p>{mensaje}</p>

        <button onClick={onCerrar}>
          Aceptar
        </button>
      </div>
    </div>
  );
}