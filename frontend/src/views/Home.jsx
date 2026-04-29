import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { googleLogout } from '@react-oauth/google'
import '../styles/Home.css'

export default function Home() {
  const [busqueda, setBusqueda]         = useState('')
  const [user, setUser]                 = useState(null)
  const [restaurantes, setRestaurantes] = useState([])
  const [cargando, setCargando]         = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('user_session')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/restaurantes/')
      .then(r => r.json())
      .then(setRestaurantes)
      .catch(() => {})
      .finally(() => setCargando(false))
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

      {/* NAVBAR */}
      <nav className="home-nav">
        <span className="home-nav__brand">Festival Gastronómico</span>
        <div className="home-nav__links">
          <a href="#">Inicio</a>
          <Link to="/participantes">Participantes</Link>
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
        <Link to="/participantes" className="home-hero__btn">Ver Restaurantes</Link>
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

      {/* PARTICIPANTES — vista previa */}
      <section className="home-participantes" id="participantes">
        <h2>Participantes</h2>

        {!cargando && restaurantes.length > 0 && (
          <div className="home-participantes__tags">
            {restaurantes.map(r => (
              <Link key={r.id} to={`/participantes/${r.id}`} className="home-tag">
                {r.nombre}
              </Link>
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
              <Link key={r.id} to={`/participantes/${r.id}`} className="home-card">
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
                <span className="home-card__info">Ver información →</span>
              </Link>
            ))
          )}
        </div>

        <div className="home-ver-todos">
          <Link to="/participantes" className="home-ver-todos__btn">
            Ver todos los participantes
          </Link>
        </div>
      </section>

    </div>
  )
}
