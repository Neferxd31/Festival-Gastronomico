import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { googleLogout } from '@react-oauth/google'
import '../styles/Resultados.css'
import { API_URL } from '../config/api'
import festivalLogo from '../assets/festival_logo.png'
import ufpsLogo from '../assets/ufps_logo.png'

const MEDALLAS = ['🥇', '🥈', '🥉']

export default function Resultados() {
  const [datos, setDatos] = useState(null)
  const [festival, setFestival] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('user_session')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/api/festivales/activo/`)
      .then(r => r.ok ? r.json() : null)
      .then(f => {
        setFestival(f)
        const publicados = f && f.estado === 'CERRADO' && f.resultados_publicados
        if (publicados) {
          return fetch(`${API_URL}/api/restaurantes/resultados/`)
            .then(r => r.json())
            .then(setDatos)
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const publicados = festival && festival.estado === 'CERRADO' && festival.resultados_publicados

  const handleLogout = () => {
    googleLogout()
    localStorage.removeItem('user_session')
    setUser(null)
  }

  return (
    <div className="res-wrapper">

      {/* NAVBAR */}
      <nav className="res-nav">
        <Link to="/" className="res-nav__brand">
          <img src={festivalLogo} alt="Festival Gastronómico" className="res-nav__logo" />
        </Link>
        <div className="res-nav__links">
          <Link to="/">Inicio</Link>
          <Link to="/participantes">Participantes</Link>
          <Link to="/resultados" className="res-nav__active">Resultados</Link>
          {user ? (
            <div className="res-nav__user">
              <img src={user.picture} alt="avatar" referrerPolicy="no-referrer" />
              <span>{user.name?.split(' ')[0]}</span>
              <button onClick={handleLogout} className="res-nav__logout">Salir</button>
            </div>
          ) : (
            <Link to="/login" className="res-nav__signin">Iniciar sesión</Link>
          )}
        </div>
      </nav>

      {/* HEADER */}
      <header className="res-header">
        <h1>🏆 Resultados</h1>
        <p>Ranking en tiempo real de los restaurantes más votados</p>
        {datos && (
          <span className="res-header__total">
            {datos.total_votos} votos registrados
          </span>
        )}
      </header>

      {cargando ? (
        <div className="res-estado">Cargando resultados...</div>
      ) : !publicados ? (
        <div className="res-estado">
          🔒 Los resultados aún no han sido publicados.<br />
          Estarán disponibles cuando el festival haya cerrado y se publiquen oficialmente.
        </div>
      ) : !datos || datos.restaurantes.length === 0 ? (
        <div className="res-estado">Aún no hay votos registrados.</div>
      ) : (
        <main className="res-main">

          {/* PODIO TOP 3 */}
          <section className="res-podio">
            {datos.restaurantes.slice(0, 3).map((r, i) => (
              <Link
                to={`/participantes/${r.id}`}
                key={r.id}
                className={`res-podio__item res-podio__item--${i + 1}`}
              >
                <div className="res-podio__medalla">{MEDALLAS[i]}</div>
                {r.plato_imagen ? (
                  <img src={r.plato_imagen} alt={r.nombre} className="res-podio__img" />
                ) : (
                  <div className="res-podio__img res-podio__img--vacia">🍽</div>
                )}
                <h3 className="res-podio__nombre">{r.nombre}</h3>
                {r.plato_nombre && (
                  <p className="res-podio__plato">{r.plato_nombre}</p>
                )}
                <div className="res-podio__votos">
                  <span className="res-podio__num">{r.votos}</span>
                  <span className="res-podio__label">votos</span>
                </div>
                <div className="res-podio__barra">
                  <div
                    className="res-podio__barra-fill"
                    style={{ width: `${r.porcentaje}%` }}
                  />
                </div>
                <span className="res-podio__pct">{r.porcentaje}%</span>
              </Link>
            ))}
          </section>

          {/* RANKING COMPLETO */}
          {datos.restaurantes.length > 3 && (
            <section className="res-ranking">
              <h2>Ranking completo</h2>
              <div className="res-tabla">
                {datos.restaurantes.map((r, i) => (
                  <Link
                    to={`/participantes/${r.id}`}
                    key={r.id}
                    className="res-fila"
                  >
                    <span className="res-fila__pos">
                      {i < 3 ? MEDALLAS[i] : `#${i + 1}`}
                    </span>
                    {r.plato_imagen ? (
                      <img src={r.plato_imagen} alt={r.nombre} className="res-fila__img" />
                    ) : (
                      <div className="res-fila__img res-fila__img--vacia">🍽</div>
                    )}
                    <div className="res-fila__info">
                      <span className="res-fila__nombre">{r.nombre}</span>
                      {r.plato_nombre && (
                        <span className="res-fila__plato">{r.plato_nombre}</span>
                      )}
                    </div>
                    <div className="res-fila__barra-wrap">
                      <div className="res-fila__barra">
                        <div
                          className="res-fila__barra-fill"
                          style={{ width: `${r.porcentaje}%` }}
                        />
                      </div>
                    </div>
                    <div className="res-fila__stats">
                      <span className="res-fila__votos">{r.votos} votos</span>
                      <span className="res-fila__pct">{r.porcentaje}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </main>
      )}

      {/* FOOTER */}
      <footer className="res-footer">
        <div className="res-footer__logos">
          <img src={ufpsLogo} alt="UFPS" className="res-footer__logo" />
          <img src={festivalLogo} alt="Festival Gastronómico" className="res-footer__logo" />
        </div>
        <span>© {new Date().getFullYear()} Festival Gastronómico Los Patios</span>
      </footer>

    </div>
  )
}