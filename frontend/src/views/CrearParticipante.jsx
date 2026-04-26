import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './CrearParticipante.css'

const CAMPO_INICIAL = {
  festival_id:       '',
  nombre:            '',
  descripcion:       '',
  direccion:         '',
  contacto:          '',
  video_url:         '',
  instagram:         '',
  facebook:          '',
  tiktok:            '',
  plato_nombre:      '',
  plato_descripcion: '',
  plato_imagen_url:  '',
}

export default function CrearParticipante() {
  const { adminSession, logoutAdmin } = useAuth()
  const navigate = useNavigate()

  const [festivales, setFestivales]   = useState([])
  const [form, setForm]               = useState(CAMPO_INICIAL)
  const [errores, setErrores]         = useState({})
  const [mensaje, setMensaje]         = useState(null)
  const [cargando, setCargando]       = useState(false)

  // Protección de ruta
  useEffect(() => {
    if (!adminSession) navigate('/')
  }, [adminSession, navigate])

  // Cargar festivales para el selector
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/festivales/')
      .then(r => r.json())
      .then(setFestivales)
      .catch(() => {})
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Limpia el error del campo cuando el usuario escribe
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje(null)
    setErrores({})

    setCargando(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/restaurantes/crear/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify({
          ...form,
          festival_id: Number(form.festival_id),
        }),
      })

      const data = await res.json()

      if (res.status === 401) {
        await logoutAdmin()
        navigate('/')
        return
      }

      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: `Restaurante "${data.nombre}" creado exitosamente.` })
        setForm(CAMPO_INICIAL)
      } else {
        // Mapea errores de campo del serializer
        setErrores(data)
        setMensaje({ tipo: 'error', texto: 'Revisa los campos marcados.' })
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' })
    } finally {
      setCargando(false)
    }
  }

  if (!adminSession) return null

  return (
    <div className="cp-wrapper">
      <header className="cp-header">
        <button className="cp-back" onClick={() => navigate('/admin/panel')}>← Volver</button>
        <h1>Crear Participante</h1>
      </header>

      <form className="cp-form" onSubmit={handleSubmit} noValidate>

        {/* DATOS DEL RESTAURANTE */}
        <section className="cp-section">
          <h2>Datos del restaurante</h2>

          <div className="cp-field">
            <label>Festival *</label>
            <select name="festival_id" value={form.festival_id} onChange={handleChange} required>
              <option value="">Selecciona un festival</option>
              {festivales.map(f => (
                <option key={f.id} value={f.id}>
                  {f.nombre} ({f.estado})
                </option>
              ))}
            </select>
            {errores.festival_id && <span className="cp-error">{errores.festival_id}</span>}
          </div>

          <div className="cp-field">
            <label>Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: La 35 Burger"
              required
            />
            {errores.nombre && <span className="cp-error">{errores.nombre}</span>}
          </div>

          <div className="cp-field">
            <label>Descripción *</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
              placeholder="Breve descripción del restaurante"
              required
            />
            {errores.descripcion && <span className="cp-error">{errores.descripcion}</span>}
          </div>

          <div className="cp-field">
            <label>Dirección *</label>
            <input
              type="text"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              placeholder="Ej: Calle 35 # 10-20, Bogotá"
              required
            />
            {errores.direccion && <span className="cp-error">{errores.direccion}</span>}
          </div>

          <div className="cp-row">
            <div className="cp-field">
              <label>Contacto</label>
              <input
                type="text"
                name="contacto"
                value={form.contacto}
                onChange={handleChange}
                placeholder="Teléfono o email"
              />
            </div>

            <div className="cp-field">
              <label>Video (URL)</label>
              <input
                type="url"
                name="video_url"
                value={form.video_url}
                onChange={handleChange}
                placeholder="https://youtube.com/..."
              />
              {errores.video_url && <span className="cp-error">{errores.video_url}</span>}
            </div>
          </div>
        </section>

        {/* REDES SOCIALES */}
        <section className="cp-section">
          <h2>Redes sociales</h2>
          <div className="cp-row">
            <div className="cp-field">
              <label>Instagram</label>
              <input
                type="text"
                name="instagram"
                value={form.instagram}
                onChange={handleChange}
                placeholder="@usuario"
              />
            </div>
            <div className="cp-field">
              <label>Facebook</label>
              <input
                type="text"
                name="facebook"
                value={form.facebook}
                onChange={handleChange}
                placeholder="facebook.com/pagina"
              />
            </div>
            <div className="cp-field">
              <label>TikTok</label>
              <input
                type="text"
                name="tiktok"
                value={form.tiktok}
                onChange={handleChange}
                placeholder="@usuario"
              />
            </div>
          </div>
        </section>

        {/* PLATO ESTRELLA */}
        <section className="cp-section">
          <h2>Plato estrella</h2>

          <div className="cp-field">
            <label>Nombre del plato *</label>
            <input
              type="text"
              name="plato_nombre"
              value={form.plato_nombre}
              onChange={handleChange}
              placeholder="Ej: Hamburguesa clásica"
              required
            />
            {errores.plato_nombre && <span className="cp-error">{errores.plato_nombre}</span>}
          </div>

          <div className="cp-field">
            <label>Descripción del plato</label>
            <textarea
              name="plato_descripcion"
              value={form.plato_descripcion}
              onChange={handleChange}
              rows={2}
              placeholder="Ingredientes o descripción breve"
            />
          </div>

          <div className="cp-field">
            <label>Imagen del plato (URL)</label>
            <input
              type="url"
              name="plato_imagen_url"
              value={form.plato_imagen_url}
              onChange={handleChange}
              placeholder="https://imagen.com/plato.jpg"
            />
            {errores.plato_imagen_url && <span className="cp-error">{errores.plato_imagen_url}</span>}
          </div>

          {/* Vista previa de la imagen */}
          {form.plato_imagen_url && (
            <div className="cp-preview">
              <img src={form.plato_imagen_url} alt="Vista previa del plato" />
            </div>
          )}
        </section>

        {mensaje && (
          <div className={`cp-mensaje cp-mensaje--${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="cp-actions">
          <button type="button" className="cp-btn cp-btn--secundario" onClick={() => navigate('/admin/panel')}>
            Cancelar
          </button>
          <button type="submit" className="cp-btn cp-btn--primario" disabled={cargando}>
            {cargando ? <span className="cp-loader" /> : 'Registrar participante'}
          </button>
        </div>

      </form>
    </div>
  )
}
