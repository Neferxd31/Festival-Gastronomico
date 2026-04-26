import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { googleLogout } from '@react-oauth/google'
import './Home.css'

// ── Modal de detalle ──────────────────────────────────────────────────────────
function ModalDetalle({ restaurante, user, onVotar, onClose }) {
  const redes = restaurante.redes_sociales || {}

  // Cierra con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Bloquea scroll del fondo mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Imagen del plato como encabezado visual */}
        {restaurante.plato?.imagen_url ? (
          <img
            src={restaurante.plato.imagen_url}
            alt={restaurante.plato.nombre}
            className="modal-hero-img"
          />
        ) : (
          <div className="modal-hero-img modal-hero-img--vacio" />
        )}

        <div className="modal-body">

          {/* INFO DEL RESTAURANTE */}
          <h2 className="modal-nombre">{restaurante.nombre}</h2>
          <p className="modal-desc">{restaurante.descripcion}</p>

          <div className="modal-datos">
            {restaurante.direccion && (
              <div className="modal-dato">
                <span className="modal-dato__icono">📍</span>
                <span>{restaurante.direccion}</span>
              </div>
            )}
            {restaurante.contacto && (
              <div className="modal-dato">
                <span className="modal-dato__icono">📞</span>
                <span>{restaurante.contacto}</span>
              </div>
            )}
          </div>

          {/* REDES SOCIALES */}
          {(redes.instagram || redes.facebook || redes.tiktok) && (
            <div className="modal-redes">
              {redes.instagram && (
                <a href={`https://instagram.com/${redes.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="modal-red modal-red--ig">
                  Instagram
                </a>
              )}
              {redes.facebook && (
                <a href={redes.facebook.startsWith('http') ? redes.facebook : `https://facebook.com/${redes.facebook}`} target="_blank" rel="noreferrer" className="modal-red modal-red--fb">
                  Facebook
                </a>
              )}
              {redes.tiktok && (
                <a href={`https://tiktok.com/${redes.tiktok.replace('@', '@')}`} target="_blank" rel="noreferrer" className="modal-red modal-red--tt">
                  TikTok
                </a>
              )}
            </div>
          )}

          {/* VIDEO */}
          {restaurante.video_url && (
            <a href={restaurante.video_url} target="_blank" rel="noreferrer" className="modal-video-link">
              ▶ Ver video del restaurante
            </a>
          )}

          {/* PLATO ESTRELLA */}
          {restaurante.plato && (
            <div className="modal-plato">
              <h3>🍽 Plato estrella</h3>
              <p className="modal-plato__nombre">{restaurante.plato.nombre}</p>
              {restaurante.plato.descripcion && (
                <p className="modal-plato__desc">{restaurante.plato.descripcion}</p>
              )}
            </div>
          )}

          {/* BOTÓN DE VOTO */}
          <button
            className="modal-vote-btn"
            onClick={() => { onVotar(restaurante); onClose() }}
          >
            {user ? `Votar por ${restaurante.nombre}` : 'Inicia sesión para votar'}
          </button>

        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Home() {
  const [busqueda, setBusqueda]         = useState('')
  const [user, setUser]                 = useState(null)
  const [restaurantes, setRestaurantes] = useState([])
  const [cargando, setCargando]         = useState(true)
  const [seleccionado, setSeleccionado] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('user_session')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/restaurantes/')
      .then(r => r.json())
      .then(data => setRestaurantes(data))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const handleLogout = () => {
    googleLogout()
    localStorage.removeItem('user_session')
    setUser(null)
  }

  const handleVotar = useCallback((restaurante) => {
    if (!user) {
      localStorage.setItem('redirect_after_login', '/')
      navigate('/login')
    } else {
      // Lógica de voto — pendiente de implementar
      alert(`Voto registrado para ${restaurante.nombre}`)
    }
  }, [user, navigate])

  const cerrarModal = useCallback(() => setSeleccionado(null), [])

  const filtrados = restaurantes.filter(r =>
    r.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="home-wrapper">

      {/* NAVBAR */}
      <nav className="home-nav">
        <span className="home-nav__brand">Festival Gastronómico</span>
        <div className="home-nav__links">
          <a href="#">Inicio</a>
          <a href="#participantes">Participantes</a>
          {user ? (
            <div className="home-nav__user">
              <img src={user.picture} alt="avatar" referrerPolicy="no-referrer" />
              <span>{user.name?.split(' ')[0]}</span>
              <button onClick={handleLogout} className="home-nav__logout">Salir</button>
            </div>
          ) : (
            <Link to="/login" className="home-nav__signin">Iniciar sesión</Link>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="home-hero">
        <h1>Sabor Local</h1>
        <p>El festival que reúne a los mejores restaurantes.</p>
        <a href="#participantes" className="home-hero__btn">Ver Restaurantes</a>
      </section>

      {/* PASOS */}
      <section className="home-steps">
        <div className="home-step">
          <h3>Visita</h3>
          <p>Recorre los restaurantes del festival.</p>
        </div>
        <div className="home-step">
          <h3>Escanea</h3>
          <p>Escanea el código QR en tu mesa.</p>
        </div>
        <div className="home-step">
          <h3>Vota</h3>
          <p>Elige tu plato favorito.</p>
        </div>
      </section>

      {/* PARTICIPANTES */}
      <section className="home-participantes" id="participantes">
        <h2>Participantes</h2>

        {!cargando && restaurantes.length > 0 && (
          <div className="home-participantes__tags">
            {restaurantes.map(r => (
              <span
                key={r.id}
                className="home-tag"
                onClick={() => setSeleccionado(r)}
              >
                {r.nombre}
              </span>
            ))}
          </div>
        )}

        <input
          type="text"
          placeholder="Buscar restaurante..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="home-search"
        />

        {/* TARJETAS */}
        <div className="home-cards">
          {cargando ? (
            <p className="home-empty">Cargando participantes...</p>
          ) : filtrados.length === 0 ? (
            <p className="home-empty">No hay participantes inscritos aún.</p>
          ) : (
            filtrados.map(r => (
              <div
                key={r.id}
                className="home-card"
                onClick={() => setSeleccionado(r)}
              >
                {r.plato?.imagen_url ? (
                  <img
                    src={r.plato.imagen_url}
                    alt={r.plato.nombre}
                    className="home-card__img home-card__img--foto"
                  />
                ) : (
                  <div className="home-card__img" />
                )}
                <h4>{r.nombre}</h4>
                {r.plato?.nombre && (
                  <span className="home-card__plato">🍽 {r.plato.nombre}</span>
                )}
                <p className="home-card__desc">
                  {r.descripcion.length > 80
                    ? r.descripcion.slice(0, 80) + '…'
                    : r.descripcion}
                </p>
                <button
                  className="home-card__info"
                  onClick={e => { e.stopPropagation(); setSeleccionado(r) }}
                >
                  Ver más
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* MODAL */}
      {seleccionado && (
        <ModalDetalle
          restaurante={seleccionado}
          user={user}
          onVotar={handleVotar}
          onClose={cerrarModal}
        />
      )}

    </div>
  )
}
