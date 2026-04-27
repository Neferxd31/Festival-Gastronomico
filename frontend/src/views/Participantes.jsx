import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { googleLogout } from '@react-oauth/google'
import '../styles/Participantes.css'

export default function Participantes() {
  const [restaurantes, setRestaurantes] = useState([])
  const [cargando, setCargando]         = useState(true)
  const [busqueda, setBusqueda]         = useState('')
  const [user, setUser]                 = useState(null)
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
    <div className="part-wrapper">

      {/* NAVBAR */}
      <nav className="part-nav">
        <Link to="/" className="part-nav__brand">Festival Gastronómico</Link>
        <div className="part-nav__links">
          <Link to="/">Inicio</Link>
          <Link to="/participantes" className="part-nav__active">Participantes</Link>
          {user ? (
            <div className="part-nav__user">
              <img src={user.picture} alt="avatar" referrerPolicy="no-referrer" />
              <span>{user.name?.split(' ')[0]}</span>
              <button onClick={handleLogout} className="part-nav__logout">Salir</button>
            </div>
          ) : (
            <Link to="/login" className="part-nav__signin">Iniciar sesión</Link>
          )}
        </div>
      </nav>

      {/* ENCABEZADO */}
      <header className="part-header">
        <h1>Participantes</h1>
        <p>Conoce los restaurantes del festival y vota por tu favorito</p>
        <input
          type="text"
          className="part-search"
          placeholder="Buscar restaurante..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </header>

      {/* LISTADO */}
      <main className="part-main">
        {cargando ? (
          <div className="part-estado">Cargando participantes...</div>
        ) : filtrados.length === 0 ? (
          <div className="part-estado">
            {busqueda ? 'Sin resultados para tu búsqueda.' : 'Aún no hay participantes registrados.'}
          </div>
        ) : (
          <div className="part-grid">
            {filtrados.map(r => (
              <Link to={`/participantes/${r.id}`} key={r.id} className="part-card">

                {/* Imagen del plato */}
                {r.plato?.imagen_url ? (
                  <img
                    src={r.plato.imagen_url}
                    alt={r.plato.nombre}
                    className="part-card__img"
                  />
                ) : (
                  <div className="part-card__img part-card__img--vacia" />
                )}

                <div className="part-card__body">
                  <h2 className="part-card__nombre">{r.nombre}</h2>

                  {r.plato?.nombre && (
                    <span className="part-card__plato">🍽 {r.plato.nombre}</span>
                  )}

                  <p className="part-card__desc">
                    {r.descripcion.length > 100
                      ? r.descripcion.slice(0, 100) + '…'
                      : r.descripcion}
                  </p>

                  {r.direccion && (
                    <span className="part-card__dir">📍 {r.direccion}</span>
                  )}

                  <span className="part-card__cta">Ver información →</span>
                </div>

              </Link>
            ))}
          </div>
        )}
      </main>

    </div>
  )
}
