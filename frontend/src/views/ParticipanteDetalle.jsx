import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { googleLogout } from '@react-oauth/google'
import '../styles/ParticipanteDetalle.css'

export default function ParticipanteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [restaurante, setRestaurante] = useState(null)
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState(false)
  const [user, setUser]               = useState(null)
  const [votado, setVotado]           = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('user_session')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/restaurantes/${id}/`)
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setRestaurante)
      .catch(() => setError(true))
      .finally(() => setCargando(false))
  }, [id])

  const handleLogout = () => {
    googleLogout()
    localStorage.removeItem('user_session')
    setUser(null)
  }

  const handleVotar = () => {
    if (!user) {
      localStorage.setItem('redirect_after_login', `/participantes/${id}`)
      navigate('/login')
      return
    }
    // Lógica de voto — pendiente de implementar
    setVotado(true)
  }

  if (cargando) {
    return (
      <div className="det-loading">
        <span>Cargando...</span>
      </div>
    )
  }

  if (error || !restaurante) {
    return (
      <div className="det-loading">
        <p>No se encontró el participante.</p>
        <Link to="/participantes" className="det-back-link">← Volver a participantes</Link>
      </div>
    )
  }

  const redes = restaurante.redes_sociales || {}

  return (
    <div className="det-wrapper">

      {/* NAVBAR */}
      <nav className="det-nav">
        <Link to="/" className="det-nav__brand">Festival Gastronómico</Link>
        <div className="det-nav__links">
          <Link to="/">Inicio</Link>
          <Link to="/participantes">Participantes</Link>
          {user ? (
            <div className="det-nav__user">
              <img src={user.picture} alt="avatar" referrerPolicy="no-referrer" />
              <span>{user.name?.split(' ')[0]}</span>
              <button onClick={handleLogout} className="det-nav__logout">Salir</button>
            </div>
          ) : (
            <Link to="/login" className="det-nav__signin">Iniciar sesión</Link>
          )}
        </div>
      </nav>

      {/* HERO con imagen del plato */}
      <div className="det-hero">
        {restaurante.plato?.imagen_url ? (
          <img src={restaurante.plato.imagen_url} alt={restaurante.plato.nombre} className="det-hero__img" />
        ) : (
          <div className="det-hero__img det-hero__img--vacia" />
        )}
        <div className="det-hero__overlay">
          <Link to="/participantes" className="det-hero__back">← Todos los participantes</Link>
          <h1 className="det-hero__nombre">{restaurante.nombre}</h1>
          {restaurante.plato?.nombre && (
            <p className="det-hero__plato">🍽 {restaurante.plato.nombre}</p>
          )}
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="det-content">

        {/* COLUMNA PRINCIPAL */}
        <div className="det-main">

          {/* Descripción del restaurante */}
          <section className="det-section">
            <h2>Sobre el restaurante</h2>
            <p>{restaurante.descripcion}</p>
          </section>

          {/* Plato estrella */}
          {restaurante.plato && (
            <section className="det-section det-section--plato">
              <h2>🍽 Plato estrella</h2>
              <div className="det-plato">
                {restaurante.plato.imagen_url && (
                  <img src={restaurante.plato.imagen_url} alt={restaurante.plato.nombre} className="det-plato__img" />
                )}
                <div className="det-plato__info">
                  <h3>{restaurante.plato.nombre}</h3>
                  {restaurante.plato.descripcion && (
                    <p>{restaurante.plato.descripcion}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Video */}
          {restaurante.video_url && (
            <section className="det-section">
              <h2>Video</h2>
              <a href={restaurante.video_url} target="_blank" rel="noreferrer" className="det-video-link">
                <span className="det-video-link__icon">▶</span>
                Ver video del restaurante
              </a>
            </section>
          )}

        </div>

        {/* SIDEBAR */}
        <aside className="det-aside">

          {/* Botón de voto */}
          <div className="det-vote-box">
            {votado ? (
              <div className="det-vote-box__confirmado">
                <span>✅</span>
                <p>¡Voto registrado!</p>
                <small>Gracias por participar</small>
              </div>
            ) : (
              <>
                <p className="det-vote-box__label">
                  {user
                    ? '¿Es tu favorito? ¡Dale tu voto!'
                    : 'Inicia sesión para votar por este restaurante'}
                </p>
                <button className="det-vote-btn" onClick={handleVotar}>
                  {user ? `Votar por ${restaurante.nombre}` : 'Iniciar sesión para votar'}
                </button>
              </>
            )}
          </div>

          {/* Info de contacto */}
          <div className="det-info-box">
            <h3>Información</h3>
            {restaurante.direccion && (
              <div className="det-info-item">
                <span>📍</span>
                <span>{restaurante.direccion}</span>
              </div>
            )}
            {restaurante.contacto && (
              <div className="det-info-item">
                <span>📞</span>
                <span>{restaurante.contacto}</span>
              </div>
            )}
          </div>

          {/* Redes sociales */}
          {(redes.instagram || redes.facebook || redes.tiktok) && (
            <div className="det-info-box">
              <h3>Redes sociales</h3>
              <div className="det-redes">
                {redes.instagram && (
                  <a
                    href={`https://instagram.com/${redes.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="det-red det-red--ig"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </a>
                )}
                {redes.facebook && (
                  <a
                    href={redes.facebook.startsWith('http') ? redes.facebook : `https://facebook.com/${redes.facebook}`}
                    target="_blank"
                    rel="noreferrer"
                    className="det-red det-red--fb"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                )}
                {redes.tiktok && (
                  <a
                    href={`https://tiktok.com/@${redes.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="det-red det-red--tt"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.82a8.17 8.17 0 004.79 1.54V6.9a4.85 4.85 0 01-1.02-.21z"/>
                    </svg>
                    TikTok
                  </a>
                )}
              </div>
            </div>
          )}

        </aside>
      </div>

    </div>
  )
}
