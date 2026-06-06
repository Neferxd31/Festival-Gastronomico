import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal'
import SuccessDeleteModal from '../components/modals/SuccessDeleteModal'
import ConfirmToggleModal from '../components/modals/ConfirmToggleModal'
import ConfirmEstadoFestivalModal from '../components/modals/ConfirmEstadoFestivalModal'
import festivalLogo from '../assets/festival_logo.png'
import ufpsLogo from '../assets/ufps_logo.png'
import '../styles/AdminPanel.css'
import { API_URL } from '../config/api'

// ─────────────────────────────────────────────
// Componente: Estado del Festival (sincronizado)
// ─────────────────────────────────────────────
function EstadoFestivalSincronizado({ token, onEstadoCambiado }) {
  const [festival, setFestival]         = useState(null)
  const [cargando, setCargando]         = useState(true)
  const [guardando, setGuardando]       = useState(false)
  const [error, setError]               = useState(null)
  const [mensaje, setMensaje]           = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nuevoEstado, setNuevoEstado]   = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/festivales/activo/`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setFestival(data) })
      .catch(() => setError('Error al cargar el festival.'))
      .finally(() => setCargando(false))
  }, [])

  const solicitarCambio = (estado) => { setNuevoEstado(estado); setModalAbierto(true) }

  const confirmarCambio = async () => {
    if (!festival || !nuevoEstado) return
    setModalAbierto(false)
    setGuardando(true)
    setError(null)
    setMensaje(null)
    try {
      const res = await fetch(
        `${API_URL}/api/festivales/${festival.id}/estado/`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      )
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Error al guardar el estado.')
      }
      const data = await res.json()
      setFestival(prev => ({ ...prev, estado: data.estado }))
      onEstadoCambiado(data.estado === 'ABIERTO')
      setMensaje(data.mensaje)
      setTimeout(() => setMensaje(null), 4000)
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado.')
    } finally {
      setGuardando(false)
      setNuevoEstado(null)
    }
  }

  if (cargando) return <div className="festival-estado-card festival-estado-card--loading">Cargando estado del festival...</div>

  const estaAbierto = festival?.estado === 'ABIERTO'

  return (
    <div className={`festival-estado-card ${estaAbierto ? 'festival-estado-card--abierto' : 'festival-estado-card--cerrado'}`}>
      <div className="festival-estado-card__row">
        <div className="festival-estado-dot" />
        <div className="festival-estado-card__texto">
          <h3 className="festival-estado-card__titulo">Estado del Festival</h3>
          {festival && <p className="festival-estado-card__nombre">{festival.nombre}</p>}
        </div>

        {festival && (
          <div className="festival-estado-card__acciones">
            <button
              className="festival-btn festival-btn--abrir"
              onClick={() => solicitarCambio('ABIERTO')}
              disabled={guardando || estaAbierto}
            >
              {guardando && nuevoEstado === 'ABIERTO' ? 'Guardando...' : '▶ Abrir'}
            </button>
            <button
              className="festival-btn festival-btn--cerrar"
              onClick={() => solicitarCambio('CERRADO')}
              disabled={guardando || !estaAbierto}
            >
              {guardando && nuevoEstado === 'CERRADO' ? 'Guardando...' : '■ Cerrar'}
            </button>
          </div>
        )}

        <div className="festival-estado-card__spacer" />

        {festival && (
          <span className={`festival-badge ${estaAbierto ? 'festival-badge--abierto' : 'festival-badge--cerrado'}`}>
            {estaAbierto ? '🟢 Abierto' : '🔴 Cerrado'}
          </span>
        )}
      </div>

      {error    && <p className="festival-estado-card__error">⚠️ {error}</p>}
      {mensaje && <p className="festival-estado-card__exito">✅ {mensaje}</p>}

      <ConfirmEstadoFestivalModal
        abierto={modalAbierto}
        nuevoEstado={nuevoEstado}
        onCancelar={() => { setModalAbierto(false); setNuevoEstado(null) }}
        onConfirmar={confirmarCambio}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// Componente: Grid de participantes
// ─────────────────────────────────────────────
function GridParticipantes({ token, festivalAbierto }) {
  const { logoutAdmin } = useAuth()
  const navigate = useNavigate()

  const [restaurantes, setRestaurantes] = useState([])
  const [cargando, setCargando]         = useState(true)
  const [error, setError]               = useState(null)
  const [toggling, setToggling]         = useState(null)

  const [modalDelete, setModalDelete]               = useState(false)
  const [seleccionado, setSeleccionado]             = useState(null)
  const [modalDeleteSuccess, setModalDeleteSuccess] = useState(false)

  const [modalToggle, setModalToggle]             = useState(false)
  const [restauranteToggle, setRestauranteToggle] = useState(null)

  const cargar = useCallback(() => {
    setCargando(true)
    fetch(`${API_URL}/api/restaurantes/admin/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401) { logoutAdmin(); navigate('/') }
        return res.json()
      })
      .then(data => setRestaurantes(data))
      .catch(() => setError('No se pudieron cargar los participantes.'))
      .finally(() => setCargando(false))
  }, [token, logoutAdmin, navigate])

  useEffect(() => { cargar() }, [cargar])

  const abrirModalToggle = (r) => { setRestauranteToggle(r); setModalToggle(true) }

  const ejecutarToggle = async () => {
    if (!restauranteToggle) return
    const id = restauranteToggle.id
    setModalToggle(false)
    setToggling(id)
    try {
      const res = await fetch(`${API_URL}/api/restaurantes/${id}/toggle/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRestaurantes(prev =>
          prev.map(r => r.id === id ? { ...r, habilitado: data.habilitado } : r)
        )
      }
    } catch { /* silencioso */ }
    finally { setToggling(null); setRestauranteToggle(null) }
  }

  const eliminarParticipante = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/restaurantes/${seleccionado.id}/eliminar/`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        setRestaurantes(prev => prev.filter(x => x.id !== seleccionado.id))
        setModalDelete(false)
        setModalDeleteSuccess(true)
      }
    } catch (err) { console.error(err) }
  }

  if (cargando) return <p className="panel-empty">Cargando participantes...</p>
  if (error)    return <p className="login-error">{error}</p>
  if (restaurantes.length === 0) return (
    <div className="panel-empty-state">
      <span className="panel-empty-state__icon">🍽</span>
      <p>Aún no hay participantes registrados.</p>
    </div>
  )

  const accionesDeshabilitadas = !festivalAbierto

  return (
    <div className="panel-tabla-wrap">
      {accionesDeshabilitadas && (
        <div className="panel-aviso-cerrado">
          🔒 El festival está <strong>cerrado</strong>. Las acciones de edición, habilitación
          y eliminación están deshabilitadas para preservar la integridad de los resultados.
        </div>
      )}
      <div className="panel-grid">
        {restaurantes.map(r => (
          <div key={r.id} className={`panel-card ${accionesDeshabilitadas ? 'panel-card--bloqueado' : ''}`}>
            {r.plato?.imagen_url ? (
              <img src={r.plato.imagen_url} alt={r.plato.nombre} className="panel-card__img" />
            ) : (
              <div className="panel-card__img--empty">🍽</div>
            )}
            <div className="panel-card__body">
              <h3 className="panel-card__nombre">{r.nombre}</h3>
              <span className="panel-card__plato">{r.plato?.nombre || 'Sin plato'}</span>
              <span className={`panel-badge ${r.habilitado ? 'panel-badge--on' : 'panel-badge--off'}`}>
                {r.habilitado ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </div>
            <div className="panel-card__actions">
              <button
                className={`panel-card__btn ${r.habilitado ? 'panel-card__btn--deshabilitar' : 'panel-card__btn--habilitar'}`}
                onClick={() => abrirModalToggle(r)}
                disabled={toggling === r.id || accionesDeshabilitadas}
              >
                {toggling === r.id ? '...' : r.habilitado ? 'Deshabilitar' : 'Habilitar'}
              </button>
              <button
                className="panel-card__btn panel-card__btn--editar"
                onClick={() => navigate(`/admin/editar-participante/${r.id}`, { state: { restaurante: r } })}
                disabled={accionesDeshabilitadas}
              >
                Editar
              </button>
              <button
                className="panel-card__btn panel-card__btn--eliminar"
                onClick={() => { setSeleccionado(r); setModalDelete(true) }}
                disabled={accionesDeshabilitadas}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmToggleModal
        abierto={modalToggle}
        participante={restauranteToggle}
        onCancelar={() => { setModalToggle(false); setRestauranteToggle(null) }}
        onConfirmar={ejecutarToggle}
      />
      <ConfirmDeleteModal
        abierto={modalDelete}
        participante={seleccionado}
        onCancelar={() => setModalDelete(false)}
        onConfirmar={eliminarParticipante}
      />
      <SuccessDeleteModal
        abierto={modalDeleteSuccess}
        onCerrar={() => setModalDeleteSuccess(false)}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// Componente: Estadísticas en tiempo real
// ─────────────────────────────────────────────
function EstadisticasVotos({ token, festivalAbierto }) {
  const { logoutAdmin } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats]         = useState(null)
  const [cargando, setCargando]   = useState(true)
  const [ultimaAct, setUltimaAct] = useState(null)
  const [pausado, setPausado]     = useState(false)
  const intervalRef               = useRef(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurantes/estadisticas/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) { logoutAdmin(); navigate('/'); return }
      const data = await res.json()
      setStats(data)
      setUltimaAct(new Date())
    } catch { /* silencioso */ }
    finally { setCargando(false) }
  }, [token, logoutAdmin, navigate])

  useEffect(() => { fetchStats() }, [fetchStats])

  useEffect(() => {
    if (pausado) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(fetchStats, 10000)
    return () => clearInterval(intervalRef.current)
  }, [pausado, fetchStats])

  // Función estructurada para exportar los resultados finales a Excel destacando el podio
  const generarReporteExcel = async () => {
    if (!stats || stats.restaurantes.length === 0) {
      alert("No hay datos disponibles para exportar.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Resultados Oficiales');

    // Paleta vinotinto/roja gastronómica corporativa y colores específicos para las medallas
    const colors = {
      headerBg: 'FF991B1B',   // Red 800
      headerText: 'FFFFFFFF',
      zebraBg: 'FFF9FAFB',    // Gray 50
      borderGrey: 'FFE5E7EB', // Gray 200
      podiumOroBg: 'FFFFFBEB',    // Soft Yellow/Amber 50
      podiumOroText: 'FF92400E',  // Dark Amber 800
      podiumPlataBg: 'FFF8FAFC',  // Soft Slate 50
      podiumPlataText: 'FF334155',// Dark Slate 700
      podiumBronceBg: 'FFFFF1F2', // Soft Rose 50
      podiumBronceText: 'FF9F1239'// Dark Rose 800
    };

    // Título Principal del Reporte
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'REPORTE OFICIAL DE RESULTADOS - FESTIVAL GASTRONÓMICO';
    titleCell.font = { bold: true, size: 15, color: { argb: 'FF111827' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 35;

    sheet.mergeCells('A2:E2');
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `Total general de votación: ${stats.total_votos} votos válidos`;
    subtitleCell.font = { italic: true, size: 12, color: { argb: 'FF4B5563' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 22;

    sheet.addRow([]); // Fila vacía de separación

    // Definición de Encabezados de la Tabla
    const headers = ['Posición', 'Restaurante / Participante', 'Plato Presentado', 'Votos Recibidos', 'Porcentaje'];
    const headerRow = sheet.addRow(headers);
    headerRow.height = 28;
    
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: colors.headerText }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.headerBg } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FF7F1D1D' } } };
    });

    // Inserción de Datos Dinámicos con resaltado especial para el Podio (Top 3)
    stats.restaurantes.forEach((r, index) => {
      let posDisplay = index + 1;
      let isPodium = index < 3;
      let podiumStyle = {};

      // Inyección de medallas y asignación de estilos según jerarquía
      if (index === 0) {
        posDisplay = '🥇 1';
        podiumStyle = { bg: colors.podiumOroBg, text: colors.podiumOroText };
      } else if (index === 1) {
        posDisplay = '🥈 2';
        podiumStyle = { bg: colors.podiumPlataBg, text: colors.podiumPlataText };
      } else if (index === 2) {
        posDisplay = '🥉 3';
        podiumStyle = { bg: colors.podiumBronceBg, text: colors.podiumBronceText };
      }

      const row = sheet.addRow([
        posDisplay,
        r.nombre,
        r.plato_nombre || 'Sin plato registrado',
        r.votos,
        (r.porcentaje / 100) // Se almacena numéricamente para dar formato porcentual nativo
      ]);
      
      // Filas más estilizadas y amplias para destacar el top
      row.height = isPodium ? 28 : 22;

      row.eachCell((cell, colIndex) => {
        cell.verticalAlignment = 'middle';

        if (isPodium) {
          // Formato decorativo para los primeros tres lugares
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: podiumStyle.bg } };
          cell.font = { bold: true, color: { argb: podiumStyle.text }, size: index === 0 ? 12 : 11 };
          
          let bottomBorder = { style: 'thin', color: { argb: colors.borderGrey } };
          if (index === 2) {
            // Cierre visual del podio con una línea más marcada
            bottomBorder = { style: 'medium', color: { argb: colors.headerBg } };
          }
          cell.border = { bottom: bottomBorder };
        } else {
          // Estilo minimalista / cebra para los demás participantes
          cell.font = { size: 11, color: { argb: 'FF374151' } };
          cell.border = { bottom: { style: 'thin', color: { argb: colors.borderGrey } } };
          if (index % 2 !== 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.zebraBg } };
          }
        }

        // Formateo y alineación por tipo de celda
        if (colIndex === 1) cell.alignment = { horizontal: 'center' };
        if (colIndex === 4) {
          cell.alignment = { horizontal: 'right' };
          cell.numFmt = '#,##0';
        }
        if (colIndex === 5) {
          cell.alignment = { horizontal: 'right' };
          cell.numFmt = '0.0%';
        }
      });
    });

    // Ajuste de anchos fijos y proporcionales para legibilidad inmediata
    sheet.columns = [
      { width: 14 }, // Posición
      { width: 38 }, // Restaurante
      { width: 38 }, // Plato
      { width: 18 }, // Votos
      { width: 16 }  // Porcentaje
    ];

    // Exportación del libro de trabajo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fechaSuffix = new Date().toISOString().slice(0, 10);
    saveAs(blob, `Resultados_Finales_Festival_${fechaSuffix}.xlsx`);
  };

  if (cargando) return <p className="panel-empty">Cargando estadísticas...</p>
  if (!stats)   return <p className="panel-empty">No se pudieron cargar las estadísticas.</p>

  const maxVotos = stats.restaurantes.length > 0
    ? Math.max(...stats.restaurantes.map(r => r.votos))
    : 0

  const getMedalla = (i) => {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `#${i + 1}`
  }

  return (
    <div className="stats-section">
      <div className="stats-header">
        <div className="stats-header__left">
          <h3 className="stats-title">Estadísticas en tiempo real</h3>
          <span className="stats-total">{stats.total_votos} votos totales</span>
        </div>
        <div className="stats-header__right">
          
          {/* Botón contextual de descarga */}
          <button
            className="stats-toggle-btn"
            onClick={generarReporteExcel}
            style={{
              marginRight: '12px',
              backgroundColor: !festivalAbierto ? '#10b981' : '#6b7280',
              color: '#ffffff',
              borderColor: 'transparent'
            }}
            title={festivalAbierto ? 'Puedes exportar un parcial, pero se recomienda esperar al cierre' : 'Descargar reporte final homologado'}
          >
            {festivalAbierto ? '📥 Exportar Parcial' : '📥 Exportar Resultados Finales'}
          </button>

          <button
            className={`stats-toggle-btn ${pausado ? 'stats-toggle-btn--paused' : ''}`}
            onClick={() => setPausado(p => !p)}
          >
            {pausado ? '▶ Reanudar' : '⏸ Pausar'}
          </button>
          {ultimaAct && (
            <span className="stats-timestamp">
              {pausado ? '⏸' : '🟢'} {ultimaAct.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      {stats.restaurantes.length === 0 ? (
        <p className="panel-empty" style={{ color: '#666' }}>No hay restaurantes registrados.</p>
      ) : (
        <div className="stats-ranking">
          {stats.restaurantes.map((r, i) => (
            <div
              key={r.id}
              className={`stats-row ${i === 0 && r.votos > 0 ? 'stats-row--leader' : ''}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="stats-row__pos">{getMedalla(i)}</span>
              {r.plato_imagen ? (
                <img src={r.plato_imagen} alt={r.plato_nombre} className="stats-row__img" />
              ) : (
                <div className="stats-row__img stats-row__img--empty">🍽</div>
              )}
              <div className="stats-row__info">
                <div className="stats-row__top">
                  <span className="stats-row__nombre">{r.nombre}</span>
                  <span className="stats-row__votos">
                    {r.votos} {r.votos === 1 ? 'voto' : 'votos'}
                  </span>
                </div>
                {r.plato_nombre && <span className="stats-row__plato">{r.plato_nombre}</span>}
                <div className="stats-bar">
                  <div
                    className="stats-bar__fill"
                    style={{ width: maxVotos > 0 ? `${(r.votos / maxVotos) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <span className="stats-row__pct">{r.porcentaje}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Página principal: AdminPanel con tabs
// ─────────────────────────────────────────────
export default function AdminPanel() {
  const { adminSession, logoutAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mensajeExito, setMensajeExito]                 = useState(null)
  const [tabActiva, setTabActiva]                       = useState('participantes')
  const [festivalAbierto, setFestivalAbierto]           = useState(null)
  const [festivalId, setFestivalId]                     = useState(null)
  const [resultadosPublicados, setResultadosPublicados] = useState(false)
  const [publicando, setPublicando]                     = useState(false)
  const [mensajePublicar, setMensajePublicar]           = useState(null)

  useEffect(() => {
    if (!adminSession) navigate('/')
  }, [adminSession, navigate])

  useEffect(() => {
    fetch(`${API_URL}/api/festivales/activo/`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setFestivalAbierto(data.estado === 'ABIERTO')
          setResultadosPublicados(data.resultados_publicados)
          setFestivalId(data.id)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (location.state?.mensajeExito) {
      setMensajeExito(location.state.mensajeExito)
      window.history.replaceState({}, '')
      setTimeout(() => setMensajeExito(null), 4000)
    }
  }, [location.state])

  // Cuando el estado cambia, si se abre el festival se resetean los resultados
  const handleEstadoCambiado = (estaAbierto) => {
    setFestivalAbierto(estaAbierto)
    if (estaAbierto) {
      setResultadosPublicados(false)
    }
  }

  const handlePublicarResultados = async () => {
    if (festivalAbierto) {
      setMensajePublicar({ texto: '⚠️ Debes cerrar el festival antes de publicar los resultados.', tipo: 'error' })
      setTimeout(() => setMensajePublicar(null), 4000)
      return
    }

    setPublicando(true)
    try {
      const res = await fetch(
        `${API_URL}/api/festivales/${festivalId}/publicar-resultados/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminSession.token}`,
          },
        }
      )
      const data = await res.json()
      if (res.ok) {
        setResultadosPublicados(true)
        setMensajePublicar({ texto: data.mensaje, tipo: 'exito' })
      } else {
        setMensajePublicar({ texto: `⚠️ ${data.error}`, tipo: 'error' })
      }
    } catch {
      setMensajePublicar({ texto: '⚠️ Error de conexión.', tipo: 'error' })
    } finally {
      setPublicando(false)
      setTimeout(() => setMensajePublicar(null), 5000)
    }
  }

  if (!adminSession) return null

  return (
    <div className="panel-screen">

      {/* ── HEADER ── */}
      <header className="panel-header">
        <div className="panel-header__logos">
          <img src={festivalLogo} alt="Festival Gastronómico Los Patios" className="panel-logo--festival" />
        </div>

        <div className="panel-header__center">
          <span className="panel-header__badge">Panel Administrador</span>
        </div>

        <div className="panel-user">
          <span className="panel-user__nombre">{adminSession.usuario?.nombre}</span>
          <button
            onClick={async () => { await logoutAdmin(); navigate('/') }}
            className="logout-btn"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="panel-main">

        {/* ── ESTADO DEL FESTIVAL — siempre visible ── */}
        <div className="panel-estado-wrapper">
          <EstadoFestivalSincronizado
            token={adminSession.token}
            onEstadoCambiado={handleEstadoCambiado}
          />
        </div>

        {/* ── MENSAJE ÉXITO ── */}
        {mensajeExito && (
          <div className="panel-mensaje-exito">✅ {mensajeExito}</div>
        )}

        {/* ── MENSAJE PUBLICAR RESULTADOS ── */}
        {mensajePublicar && (
          <div className={`panel-mensaje-exito ${mensajePublicar.tipo === 'error' ? 'panel-mensaje-error' : ''}`}>
            {mensajePublicar.texto}
          </div>
        )}

        {/* ── TABS ── */}
        <div className="panel-tabs">

          <button
            className={`panel-tab ${tabActiva === 'participantes' ? 'panel-tab--active' : ''}`}
            onClick={() => setTabActiva('participantes')}
          >
            👥 Participantes
          </button>
          <button
            className={`panel-tab ${tabActiva === 'estadisticas' ? 'panel-tab--active' : ''}`}
            onClick={() => setTabActiva('estadisticas')}
          >
            📊 Estadísticas
          </button>

          {/* ── BOTÓN PUBLICAR RESULTADOS ── */}
          <button
            className="panel-accion-btn"
            style={{
              backgroundColor: festivalAbierto
                ? '#888'
                : resultadosPublicados
                  ? '#16a34a'
                  : '#2ecc71',
              color: '#fff',
              cursor: festivalAbierto ? 'not-allowed' : 'pointer',
            }}
            onClick={handlePublicarResultados}
            disabled={publicando || festivalAbierto}
            title={
              festivalAbierto ? 'Cierra el festival primero' :
              resultadosPublicados ? 'Resultados ya publicados — puedes republicar' :
              'Publicar resultados finales'
            }
          >
            {publicando
              ? 'Publicando...'
              : resultadosPublicados
                ? '✅ Resultados publicados'
                : '🏆 Publicar resultados'}
          </button>
        </div>

        {/* ── CONTENIDO TAB PARTICIPANTES ── */}
        {tabActiva === 'participantes' && (
          <div className="panel-tab-content">
            <div className="panel-acciones">
              {festivalAbierto
                ? <Link to="/admin/crear-participante" className="panel-accion-btn">+ Crear participante</Link>
                : <span className="panel-accion-btn panel-accion-btn--disabled" title="Festival cerrado">+ Crear participante</span>
              }
              <Link to="/admin/papelera" className="panel-accion-btn panel-accion-btn--secondary">🗑 Papelera</Link>
            </div>

            <h3 className="panel-section-title">Participantes registrados</h3>
            <GridParticipantes
              token={adminSession.token}
              festivalAbierto={festivalAbierto}
            />
          </div>
        )}

        {/* ── CONTENIDO TAB ESTADÍSTICAS ── */}
        {tabActiva === 'estadisticas' && (
          <div className="panel-tab-content">
            <EstadisticasVotos
              token={adminSession.token}
              festivalAbierto={festivalAbierto}
            />
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer className="panel-footer">
        <div className="panel-footer__inner">
          <div className="panel-footer__colaboradores">
            <div className="panel-footer__org">
              <img src={ufpsLogo} alt="UFPS" className="panel-footer__logo" />
            </div>
            <div className="panel-footer__org">
              <img src={festivalLogo} alt="Festival Gastronómico Los Patios" className="panel-footer__logo" />
            </div>
          </div>
          <p className="panel-footer__copy">© {new Date().getFullYear()} Festival Gastronómico Los Patios</p>
        </div>
      </footer>

    </div>
  )
}