import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal'
import SuccessDeleteModal from '../components/modals/SuccessDeleteModal'
import ConfirmToggleModal from '../components/modals/ConfirmToggleModal'
import '../styles/AdminPanel.css'

function GridParticipantes({ token }) {
  const { logoutAdmin } = useAuth()
  const navigate = useNavigate()

  const [restaurantes, setRestaurantes] = useState([])
  const [cargando, setCargando]         = useState(true)
  const [error, setError]               = useState(null)
  const [toggling, setToggling]         = useState(null)

  // Modales de eliminación
  const [modalDelete, setModalDelete]               = useState(false)
  const [seleccionado, setSeleccionado]             = useState(null)
  const [modalDeleteSuccess, setModalDeleteSuccess] = useState(false)

  // Modal de toggle
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

  // Toggle
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

  // Eliminar
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

  return (
    <div className="panel-tabla-wrap">
      <div className="panel-grid">
        {restaurantes.map(r => (
          <div key={r.id} className="panel-card">

            {/* Imagen */}
            {r.plato?.imagen_url ? (
              <img src={r.plato.imagen_url} alt={r.plato.nombre} className="panel-card__img" />
            ) : (
              <div className="panel-card__img--empty">🍽</div>
            )}

            {/* Info */}
            <div className="panel-card__body">
              <h3 className="panel-card__nombre">{r.nombre}</h3>
              <span className="panel-card__plato">{r.plato?.nombre || 'Sin plato'}</span>
              <span className={`panel-badge ${r.habilitado ? 'panel-badge--on' : 'panel-badge--off'}`}>
                {r.habilitado ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </div>

            {/* Botones */}
            <div className="panel-card__actions">
              <button
                className={`panel-card__btn ${r.habilitado ? 'panel-card__btn--deshabilitar' : 'panel-card__btn--habilitar'}`}
                onClick={() => abrirModalToggle(r)}
                disabled={toggling === r.id}
              >
                {toggling === r.id ? '...' : r.habilitado ? 'Deshabilitar' : 'Habilitar'}
              </button>

              <button
                className="panel-card__btn panel-card__btn--editar"
                onClick={() => navigate(`/admin/editar-participante/${r.id}`, { state: { restaurante: r } })}
              >
                Editar
              </button>

              <button
                className="panel-card__btn panel-card__btn--eliminar"
                onClick={() => { setSeleccionado(r); setModalDelete(true) }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modales */}
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

export default function AdminPanel() {
  const { adminSession, logoutAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mensajeExito, setMensajeExito] = useState(null)
  const [mostrarStats, setMostrarStats] = useState(true)

  useEffect(() => {
    if (!adminSession) navigate('/')
  }, [adminSession, navigate])

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
          <Link to="/admin/crear-participante" className="panel-accion-btn">
            + Crear participante
          </Link>
          <Link to="/admin/papelera" className="panel-accion-btn">
            Papelera
          </Link>
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

        {mostrarStats && (
          <EstadisticasVotos token={adminSession.token} />
        )}

        <h3 className="panel-section-title">Participantes registrados</h3>
        <GridParticipantes token={adminSession.token} />
      </main>
    </div>
  )
}
