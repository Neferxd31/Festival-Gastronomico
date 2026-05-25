import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal'
import SuccessDeleteModal from '../components/modals/SuccessDeleteModal'
import ConfirmToggleModal from '../components/modals/ConfirmToggleModal'
import ConfirmEstadoFestivalModal from '../components/modals/ConfirmEstadoFestivalModal' // nuevo
import '../styles/AdminPanel.css'

// ─────────────────────────────────────────────
// Componente: Estado del Festival
// ─────────────────────────────────────────────
function EstadoFestival({ token }) {
  const [festival, setFestival]       = useState(null)
  const [cargando, setCargando]       = useState(true)
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState(null)
  const [mensaje, setMensaje]         = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState(null)

  const cargarFestival = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/festivales/activo/')
      if (!res.ok) throw new Error('No se pudo cargar el festival.')
      const data = await res.json()
      setFestival(data)
    } catch {
      setError('Error al cargar el estado del festival.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarFestival() }, [cargarFestival])

  // Abre el modal de confirmación antes de cambiar
  const solicitarCambio = (estado) => {
    setNuevoEstado(estado)
    setModalAbierto(true)
  }

  const confirmarCambio = async () => {
    if (!festival || !nuevoEstado) return
    setModalAbierto(false)
    setGuardando(true)
    setError(null)
    setMensaje(null)

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/festivales/${festival.id}/estado/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      )

      if (!res.ok) {
        // Escenario 5: error del servidor, no se aplica cambio
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Error al guardar el estado.')
      }

      const data = await res.json()
      setFestival(prev => ({ ...prev, estado: data.estado }))
      setMensaje(data.mensaje)
      setTimeout(() => setMensaje(null), 4000)
    } catch (err) {
      // Escenario 5: mostramos error, el estado local NO cambia
      setError(err.message || 'Ocurrió un error inesperado.')
    } finally {
      setGuardando(false)
      setNuevoEstado(null)
    }
  }

  if (cargando) return <div className="festival-estado-card">Cargando estado del festival...</div>

  const estaAbierto = festival?.estado === 'ABIERTO'

  return (
    <div className="festival-estado-card">
      <div className="festival-estado-card__header">
        <h3 className="festival-estado-card__titulo">Estado del Festival</h3>
        {festival && (
          <span className={`festival-badge ${estaAbierto ? 'festival-badge--abierto' : 'festival-badge--cerrado'}`}>
            {estaAbierto ? '🟢 Abierto' : '🔴 Cerrado'}
          </span>
        )}
      </div>

      {festival && (
        <p className="festival-estado-card__nombre">
          <strong>{festival.nombre}</strong>
        </p>
      )}

      {/* Escenario 5: error visible sin cambio aplicado */}
      {error && <p className="festival-estado-card__error">⚠️ {error}</p>}

      {/* Escenarios 1 y 2: mensaje de éxito */}
      {mensaje && <p className="festival-estado-card__exito">✅ {mensaje}</p>}

      {festival && (
        <div className="festival-estado-card__acciones">
          <button
            className="festival-btn festival-btn--abrir"
            onClick={() => solicitarCambio('ABIERTO')}
            disabled={guardando || estaAbierto}
            title={estaAbierto ? 'El festival ya está abierto' : 'Abrir festival'}
          >
            {guardando && nuevoEstado === 'ABIERTO' ? 'Guardando...' : 'Abrir festival'}
          </button>

          <button
            className="festival-btn festival-btn--cerrar"
            onClick={() => solicitarCambio('CERRADO')}
            disabled={guardando || !estaAbierto}
            title={!estaAbierto ? 'El festival ya está cerrado' : 'Cerrar festival'}
          >
            {guardando && nuevoEstado === 'CERRADO' ? 'Guardando...' : 'Cerrar festival'}
          </button>
        </div>
      )}

      {/* Modal de confirmación (Escenarios 1 y 2) */}
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
// festivalAbierto: bool — controla si las acciones están disponibles
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
    fetch('http://127.0.0.1:8000/api/restaurantes/admin/', {
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

  const abrirModalToggle = (r) => {
    setRestauranteToggle(r)
    setModalToggle(true)
  }

  const ejecutarToggle = async () => {
    if (!restauranteToggle) return
    const id = restauranteToggle.id
    setModalToggle(false)
    setToggling(id)
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/restaurantes/${id}/toggle/`, {
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
    finally {
      setToggling(null)
      setRestauranteToggle(null)
    }
  }

  const eliminarParticipante = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/restaurantes/${seleccionado.id}/eliminar/`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        setRestaurantes(prev => prev.filter(x => x.id !== seleccionado.id))
        setModalDelete(false)
        setModalDeleteSuccess(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (cargando) return <p className="panel-empty">Cargando participantes...</p>
  if (error)    return <p className="login-error">{error}</p>
  if (restaurantes.length === 0) return <p className="panel-empty">Aún no hay participantes registrados.</p>

  // Cuando el festival está cerrado, las acciones de edición se bloquean
  const accionesDeshabilitadas = !festivalAbierto

  return (
    <div className="panel-tabla-wrap">

      {/* Aviso visible cuando el festival está cerrado */}
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
                title={accionesDeshabilitadas ? 'No disponible con el festival cerrado' : ''}
              >
                {toggling === r.id ? '...' : r.habilitado ? 'Deshabilitar' : 'Habilitar'}
              </button>

              <button
                className="panel-card__btn panel-card__btn--editar"
                onClick={() => navigate(`/admin/editar-participante/${r.id}`, { state: { restaurante: r } })}
                disabled={accionesDeshabilitadas}
                title={accionesDeshabilitadas ? 'No disponible con el festival cerrado' : ''}
              >
                Editar
              </button>

              <button
                className="panel-card__btn panel-card__btn--eliminar"
                onClick={() => { setSeleccionado(r); setModalDelete(true) }}
                disabled={accionesDeshabilitadas}
                title={accionesDeshabilitadas ? 'No disponible con el festival cerrado' : ''}
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

// (EstadisticasVotos permanece igual que antes, sin cambios)

function EstadisticasVotos({ token }) {
  const { logoutAdmin } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [ultimaAct, setUltimaAct] = useState(null)
  const [pausado, setPausado] = useState(false)
  const intervalRef = useRef(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/restaurantes/estadisticas/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) { logoutAdmin(); navigate('/'); return }
      const data = await res.json()
      setStats(data)
      setUltimaAct(new Date())
    } catch { /* silencioso */ }
    finally { setCargando(false) }
  }, [token, logoutAdmin, navigate])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (pausado) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(fetchStats, 10000)
    return () => clearInterval(intervalRef.current)
  }, [pausado, fetchStats])

  if (cargando) return <p className="panel-empty">Cargando estadísticas...</p>
  if (!stats) return <p className="panel-empty">No se pudieron cargar las estadísticas.</p>

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
        <p className="panel-empty">No hay restaurantes registrados.</p>
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
                {r.plato_nombre && (
                  <span className="stats-row__plato">{r.plato_nombre}</span>
                )}
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
// Página principal: AdminPanel
// ─────────────────────────────────────────────
export default function AdminPanel() {
  const { adminSession, logoutAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mensajeExito, setMensajeExito] = useState(null)
  const [mostrarStats, setMostrarStats] = useState(true)

  // Estado del festival para pasarlo a GridParticipantes
  const [festivalAbierto, setFestivalAbierto] = useState(null)

  useEffect(() => {
    if (!adminSession) navigate('/')
  }, [adminSession, navigate])

  // Carga el estado del festival al montar (Escenario 4: persistencia)
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/festivales/activo/')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setFestivalAbierto(data.estado === 'ABIERTO')
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

  if (!adminSession) return null

  return (
    <div className="panel-screen">
      <header className="panel-header">
        <h1>Panel Administrador</h1>
        <div className="panel-user">
          <span>{adminSession.usuario?.nombre}</span>
          <button onClick={async () => { await logoutAdmin(); navigate('/') }} className="logout-btn">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="panel-main">
        <div className="panel-acciones">
          {/* El botón de crear participante también se deshabilita si el festival está cerrado */}
          {festivalAbierto
            ? <Link to="/admin/crear-participante" className="panel-accion-btn">+ Crear participante</Link>
            : <span className="panel-accion-btn panel-accion-btn--disabled" title="Festival cerrado">+ Crear participante</span>
          }
          <Link to="/admin/papelera" className="panel-accion-btn">Papelera</Link>
          <button
            className={`panel-accion-btn ${mostrarStats ? 'panel-accion-btn--active' : ''}`}
            onClick={() => setMostrarStats(p => !p)}
          >
            📊 Estadísticas
          </button>
        </div>

        {mensajeExito && (
          <div className="panel-mensaje-exito">✅ {mensajeExito}</div>
        )}

        {/* Sección de estado del festival — pasa setFestivalAbierto para sincronizar */}
        <EstadoFestivalSincronizado
          token={adminSession.token}
          onEstadoCambiado={setFestivalAbierto}
        />

        {mostrarStats && <EstadisticasVotos token={adminSession.token} />}

        <h3 className="panel-section-title">Participantes registrados</h3>
        <GridParticipantes
          token={adminSession.token}
          festivalAbierto={festivalAbierto}
        />
      </main>
    </div>
  )
}

// Wrapper que sincroniza el estado con el AdminPanel padre
function EstadoFestivalSincronizado({ token, onEstadoCambiado }) {
  // Re-exporta EstadoFestival notificando al padre cuando cambia
  const [festival, setFestival]         = useState(null)
  const [cargando, setCargando]         = useState(true)
  const [guardando, setGuardando]       = useState(false)
  const [error, setError]               = useState(null)
  const [mensaje, setMensaje]           = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nuevoEstado, setNuevoEstado]   = useState(null)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/festivales/activo/')
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
        `http://127.0.0.1:8000/api/festivales/${festival.id}/estado/`,
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
      onEstadoCambiado(data.estado === 'ABIERTO')  // sincroniza con el padre
      setMensaje(data.mensaje)
      setTimeout(() => setMensaje(null), 4000)
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado.')
    } finally {
      setGuardando(false)
      setNuevoEstado(null)
    }
  }

  if (cargando) return <div className="festival-estado-card">Cargando estado del festival...</div>

  const estaAbierto = festival?.estado === 'ABIERTO'

  return (
    <div className="festival-estado-card">
      <div className="festival-estado-card__header">
        <h3 className="festival-estado-card__titulo">Estado del Festival</h3>
        {festival && (
          <span className={`festival-badge ${estaAbierto ? 'festival-badge--abierto' : 'festival-badge--cerrado'}`}>
            {estaAbierto ? '🟢 Abierto' : '🔴 Cerrado'}
          </span>
        )}
      </div>
      {festival && <p className="festival-estado-card__nombre"><strong>{festival.nombre}</strong></p>}
      {error   && <p className="festival-estado-card__error">⚠️ {error}</p>}
      {mensaje && <p className="festival-estado-card__exito">✅ {mensaje}</p>}
      {festival && (
        <div className="festival-estado-card__acciones">
          <button
            className="festival-btn festival-btn--abrir"
            onClick={() => solicitarCambio('ABIERTO')}
            disabled={guardando || estaAbierto}
          >
            {guardando && nuevoEstado === 'ABIERTO' ? 'Guardando...' : 'Abrir festival'}
          </button>
          <button
            className="festival-btn festival-btn--cerrar"
            onClick={() => solicitarCambio('CERRADO')}
            disabled={guardando || !estaAbierto}
          >
            {guardando && nuevoEstado === 'CERRADO' ? 'Guardando...' : 'Cerrar festival'}
          </button>
        </div>
      )}
      <ConfirmEstadoFestivalModal
        abierto={modalAbierto}
        nuevoEstado={nuevoEstado}
        onCancelar={() => { setModalAbierto(false); setNuevoEstado(null) }}
        onConfirmar={confirmarCambio}
      />
    </div>
  )
}