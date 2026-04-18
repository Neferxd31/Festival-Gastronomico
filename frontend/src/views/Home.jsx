import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { googleLogout } from '@react-oauth/google'
import './Home.css'

const RESTAURANTES = [
  'Metropizza', 'Mostaza', 'La 35 Burguer',
  'Dulce Arcoiris', "Duke's Pizza", 'Circus Food',
]

export default function Home() {
  const [busqueda, setBusqueda] = useState('')
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('user_session')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  const handleLogout = () => {
    googleLogout()
    localStorage.removeItem('user_session')
    setUser(null)
  }

  const handleVotar = (restaurante) => {
    if (!user) {
      // Guarda a dónde volver después del login
      localStorage.setItem('redirect_after_login', '/')
      navigate('/login')
    } else {
      // Aquí irá la lógica de voto cuando esté lista
      alert(`Voto registrado para ${restaurante}`)
    }
  }

  const restaurantesFiltrados = RESTAURANTES.filter(r =>
    r.toLowerCase().includes(busqueda.toLowerCase())
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

        <div className="home-participantes__tags">
          {RESTAURANTES.map(r => (
            <span key={r} className="home-tag">{r}</span>
          ))}
        </div>

        <input
          type="text"
          placeholder="Buscar restaurante..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="home-search"
        />

        {/* TARJETAS DE RESTAURANTES */}
        <div className="home-cards">
          {restaurantesFiltrados.map(r => (
            <div key={r} className="home-card">
              <div className="home-card__img" />
              <h4>{r}</h4>
              <p className="home-card__desc">Restaurante participante del festival.</p>
              <button
                className="home-card__vote"
                onClick={() => handleVotar(r)}
              >
                {user ? 'Votar' : 'Inicia sesión para votar'}
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
