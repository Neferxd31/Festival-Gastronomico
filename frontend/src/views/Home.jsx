import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { googleLogout } from '@react-oauth/google'
import '../styles/Home.css'
import { API_URL } from '../config/api'

function useInView(options = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15, ...options }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, visible]
}

export default function Home() {
  const [busqueda, setBusqueda]         = useState('')
  const [user, setUser]                 = useState(null)
  const [restaurantes, setRestaurantes] = useState([])
  const [top3, setTop3]                 = useState([])
  const [cargando, setCargando]         = useState(true)

  const [stepsRef, stepsVisible] = useInView()
  const [aboutRef, aboutVisible] = useInView()
  const [cardsRef, cardsVisible] = useInView()
  const [statsRef, statsVisible] = useInView()

  useEffect(() => {
    const saved = localStorage.getItem('user_session')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/api/restaurantes/`)
      .then(r => r.json())
      .then(setRestaurantes)
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/restaurantes/resultados/')
      .then(r => r.json())
      .then(data => setTop3(data.restaurantes?.slice(0, 3) || []))
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    googleLogout()
    localStorage.removeItem('user_session')
    setUser(null)
  }

  const filtrados = restaurantes.filter(r =>
    r.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="home-wrapper">

      {/* ── NAVBAR ── */}
      <nav className="home-nav">
        <Link to="/" className="home-nav__brand">
          <span className="home-nav__icon">🍽</span>
          Festival Gastronómico
        </Link>
        <div className="home-nav__links">
          <Link to="/">Inicio</Link>
          <Link to="/participantes">Participantes</Link>
          <Link to="/resultados">Resultados</Link>
          <a href="#como-funciona">Cómo funciona</a>
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

      {/* ── HERO ── */}
      <section className="home-hero">
        <div className="home-hero__particles" />
        <div className="home-hero__content">
          <span className="home-hero__badge">Edición 2026</span>
          <h1 className="home-hero__title">
            Sabor <span className="home-hero__accent">Local</span>
          </h1>
          <p className="home-hero__sub">
            El festival que reúne a los mejores restaurantes de la región.
            Descubre, prueba y vota por tu plato favorito.
          </p>
          <div className="home-hero__btns">
            <Link to="/participantes" className="home-hero__btn home-hero__btn--primary">
              Ver restaurantes
            </Link>
            <a href="#como-funciona" className="home-hero__btn home-hero__btn--ghost">
              Cómo funciona
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        className={`home-stats ${statsVisible ? 'home-stats--visible' : ''}`}
        ref={statsRef}
      >
        <div className="home-stat">
          <span className="home-stat__num">{restaurantes.length || '—'}</span>
          <span className="home-stat__label">Restaurantes</span>
        </div>
        <div className="home-stat">
          <span className="home-stat__num">{restaurantes.length || '—'}</span>
          <span className="home-stat__label">Platos estrella</span>
        </div>
        <div className="home-stat">
          <span className="home-stat__num">1</span>
          <span className="home-stat__label">Festival activo</span>
        </div>
        <div className="home-stat">
          <span className="home-stat__num">100%</span>
          <span className="home-stat__label">Talento local</span>
        </div>
      </section>

      {/* ── SOBRE EL FESTIVAL ── */}
      <section
        className={`home-about ${aboutVisible ? 'home-about--visible' : ''}`}
        ref={aboutRef}
      >
        <div className="home-about__text">
          <span className="home-about__tag">Sobre el festival</span>
          <h2>Celebramos la gastronomía local</h2>
          <p>
            El Festival Gastronómico es una iniciativa que busca impulsar
            el talento culinario de nuestra región. Cada restaurante
            presenta su mejor plato y los asistentes deciden quién
            se lleva el premio al mejor sabor.
          </p>
          <p>
            Participa escaneando el código QR en tu mesa, inicia sesión
            con tu cuenta de Google y vota. Así de fácil.
          </p>
          <Link to="/participantes" className="home-about__btn">
            Conoce los participantes →
          </Link>
        </div>
        <div className="home-about__visual">
          <div className="home-about__card home-about__card--1">🍕</div>
          <div className="home-about__card home-about__card--2">🍔</div>
          <div className="home-about__card home-about__card--3">🥗</div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section
        className={`home-steps ${stepsVisible ? 'home-steps--visible' : ''}`}
        id="como-funciona"
        ref={stepsRef}
      >
        <h2 className="home-steps__title">¿Cómo funciona?</h2>
        <p className="home-steps__sub">Tres pasos para participar en el festival</p>

        <div className="home-steps__grid">
          <div className="home-step">
            <div className="home-step__icon">📍</div>
            <div className="home-step__num">01</div>
            <h3>Visita</h3>
            <p>Recorre los restaurantes participantes del festival y conoce su oferta gastronómica.</p>
          </div>
          <div className="home-step">
            <div className="home-step__icon">🔐</div>
            <div className="home-step__num">02</div>
            <h3>Inicia sesión</h3>
            <p>Accede con tu cuenta de Google para poder participar en la votación del festival.</p>
          </div>
          <div className="home-step">
            <div className="home-step__icon">⭐</div>
            <div className="home-step__num">03</div>
            <h3>Vota</h3>
            <p>Elige tu plato favorito y vota. Tu opinión ayuda a premiar el mejor sabor de la región.</p>
          </div>
        </div>
      </section>

      {/* ── PARTICIPANTES PREVIEW ── */}
      <section
        className={`home-participantes ${cardsVisible ? 'home-participantes--visible' : ''}`}
        ref={cardsRef}
      >
        <h2>Participantes del festival</h2>
        <p className="home-participantes__sub">Descubre quién compite por el premio al mejor plato</p>

        <input
          type="text"
          placeholder="🔍 Buscar restaurante..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="home-search"
        />

        <div className="home-cards">
          {cargando ? (
            <div className="home-empty">
              <div className="home-empty__spinner" />
              <span>Cargando participantes...</span>
            </div>
          ) : filtrados.length === 0 ? (
            <p className="home-empty">
              {busqueda ? 'Sin resultados para tu búsqueda.' : 'Aún no hay participantes inscritos.'}
            </p>
          ) : (
            filtrados.slice(0, 6).map((r, i) => (
              <Link
                key={r.id}
                to={`/participantes/${r.id}`}
                className="home-card"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                {r.plato?.imagen_url ? (
                  <img src={r.plato.imagen_url} alt={r.plato.nombre} className="home-card__img" />
                ) : (
                  <div className="home-card__img home-card__img--empty">🍽</div>
                )}
                <div className="home-card__body">
                  <h4>{r.nombre}</h4>
                  {r.plato?.nombre && (
                    <span className="home-card__plato">{r.plato.nombre}</span>
                  )}
                  <p className="home-card__desc">
                    {r.descripcion?.length > 70
                      ? r.descripcion.slice(0, 70) + '…'
                      : r.descripcion}
                  </p>
                  <span className="home-card__cta">Ver información →</span>
                </div>
              </Link>
            ))
          )}
        </div>

        {!cargando && restaurantes.length > 6 && (
          <div className="home-ver-todos">
            <Link to="/participantes" className="home-ver-todos__btn">
              Ver los {restaurantes.length} participantes
            </Link>
          </div>
        )}

        {!cargando && restaurantes.length > 0 && restaurantes.length <= 6 && (
          <div className="home-ver-todos">
            <Link to="/participantes" className="home-ver-todos__btn">
              Ver todos los participantes
            </Link>
          </div>
        )}
      </section>

      {/* ── RESULTADOS PREVIEW ── */}
      <section className="home-resultados">
        <h2>🏆 Tabla de posiciones</h2>
        <p className="home-participantes__sub">Los restaurantes más votados del festival</p>

        {top3.length === 0 ? (
          <p className="home-empty">Aún no hay votos registrados.</p>
        ) : (
          <div className="home-podio-preview">
            {top3.map((r, i) => (
              <Link
                to={`/participantes/${r.id}`}
                key={r.id}
                className={`home-podio-card home-podio-card--${i + 1}`}
              >
                <span className="home-podio-card__medalla">{['🥇', '🥈', '🥉'][i]}</span>
                {r.plato_imagen ? (
                  <img src={r.plato_imagen} alt={r.nombre} className="home-podio-card__img" />
                ) : (
                  <div className="home-podio-card__img home-podio-card__img--vacia">🍽</div>
                )}
                <h4>{r.nombre}</h4>
                {r.plato_nombre && (
                  <span className="home-podio-card__plato">{r.plato_nombre}</span>
                )}
                <span className="home-podio-card__votos">{r.votos} votos</span>
              </Link>
            ))}
          </div>
        )}

        <div className="home-ver-todos">
          <Link to="/resultados" className="home-ver-todos__btn">
            Ver resultados completos →
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="home-cta">
        <h2>¿Listo para votar?</h2>
        <p>Inicia sesión y apoya al mejor talento gastronómico de la región</p>
        {user ? (
          <Link to="/participantes" className="home-cta__btn">Ir a votar</Link>
        ) : (
          <Link to="/login" className="home-cta__btn">Iniciar sesión</Link>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="home-footer">
        <div className="home-footer__inner">
          <div className="home-footer__brand">
            <span>🍽 Festival Gastronómico</span>
            <small>Apoyando el talento culinario local</small>
          </div>
          <div className="home-footer__links">
            <Link to="/">Inicio</Link>
            <Link to="/participantes">Participantes</Link>
            <Link to="/resultados">Resultados</Link>
            <Link to="/login">Iniciar sesión</Link>
          </div>
        </div>
        <div className="home-footer__bottom">
          <span>© 2026 Festival Gastronómico. Todos los derechos reservados.</span>
        </div>
      </footer>

    </div>
  )
}