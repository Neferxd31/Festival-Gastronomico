import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/CrearParticipante.css'
import { API_URL } from '../config/api'

const CAMPO_VACIO = {
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

function restauranteAForm(r) {
  const redes = r.redes_sociales || {}
  return {
    nombre:            r.nombre            || '',
    descripcion:       r.descripcion       || '',
    direccion:         r.direccion         || '',
    contacto:          r.contacto          || '',
    video_url:         r.video_url         || '',
    instagram:         redes.instagram     || '',
    facebook:          redes.facebook      || '',
    tiktok:            redes.tiktok        || '',
    plato_nombre:      r.plato?.nombre     || '',
    plato_descripcion: r.plato?.descripcion || '',
    plato_imagen_url:  r.plato?.imagen_url  || '',
  }
}

const autoResize = (e) => {
  e.target.style.height = 'auto'
  e.target.style.height = e.target.scrollHeight + 'px'
}

export default function EditarParticipante() {
  const { adminSession, logoutAdmin } = useAuth()
  const navigate  = useNavigate()
  const { id }    = useParams()
  const location  = useLocation()

  const [form, setForm]       = useState(CAMPO_VACIO)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [iniciado, setIniciado] = useState(false)

  // Ajusta altura de textareas cuando los datos ya cargaron
  useEffect(() => {
    if (!iniciado) return
    document.querySelectorAll('.cp-field textarea').forEach(el => {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    })
  }, [iniciado])

  // Protección de ruta
  useEffect(() => {
    if (!adminSession) navigate('/')
  }, [adminSession, navigate])

  // Precargar datos del restaurante
  useEffect(() => {
    if (location.state?.restaurante) {
      setForm(restauranteAForm(location.state.restaurante))
      setIniciado(true)
      return
    }

    // Fallback: si entró por URL directa, busca en la lista admin
    fetch(`${API_URL}/api/restaurantes/admin/`, {
      headers: { Authorization: `Bearer ${adminSession?.token}` },
    })
      .then(r => r.json())
      .then(lista => {
        const encontrado = lista.find(r => String(r.id) === String(id))
        if (encontrado) setForm(restauranteAForm(encontrado))
        else setMensaje({ tipo: 'error', texto: 'Participante no encontrado.' })
      })
      .catch(() => setMensaje({ tipo: 'error', texto: 'Error al cargar los datos.' }))
      .finally(() => setIniciado(true))
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje(null)
    setErrores({})
    setCargando(true)

    try {
      const res = await fetch(`${API_URL}/api/restaurantes/${id}/editar/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (res.status === 401) {
        await logoutAdmin()
        navigate('/')
        return
      }

      if (res.ok) {
        navigate('/admin/panel', {
          state: { mensajeExito: `Restaurante "${data.nombre}" actualizado correctamente.` },
        })
        return
      }

      setErrores(data)
      setMensaje({ tipo: 'error', texto: 'Revisa los campos marcados.' })
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' })
    } finally {
      setCargando(false)
    }
  }

  if (!adminSession) return null
  if (!iniciado) return <div className="cp-wrapper"><p style={{ padding: 40, color: '#aaa' }}>Cargando...</p></div>

  return (
    <div className="cp-wrapper">
      <header className="cp-header">
        <button className="cp-back" onClick={() => navigate('/admin/panel')}>← Volver</button>
        <h1>Editar Participante</h1>
      </header>

      <form className="cp-form" onSubmit={handleSubmit} noValidate>

        {/* DATOS DEL RESTAURANTE */}
        <section className="cp-section">
          <h2>Datos del restaurante</h2>

          <div className="cp-field">
            <label>Nombre *</label>
            <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: La 35 Burger" required />
            {errores.nombre && <span className="cp-error">{errores.nombre}</span>}
          </div>

          <div className="cp-field">
            <label>Descripción *</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} onInput={autoResize} rows={3} placeholder="Breve descripción del restaurante" required />
            {errores.descripcion && <span className="cp-error">{errores.descripcion}</span>}
          </div>

          <div className="cp-field">
            <label>Dirección *</label>
            <input type="text" name="direccion" value={form.direccion} onChange={handleChange} placeholder="Ej: Calle 35 # 10-20, Bogotá" required />
            {errores.direccion && <span className="cp-error">{errores.direccion}</span>}
          </div>

          <div className="cp-row">
            <div className="cp-field">
              <label>Contacto</label>
              <input type="text" name="contacto" value={form.contacto} onChange={handleChange} placeholder="Teléfono o email" />
            </div>
            <div className="cp-field">
              <label>Video (URL)</label>
              <input type="url" name="video_url" value={form.video_url} onChange={handleChange} placeholder="https://youtube.com/..." />
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
              <input type="text" name="instagram" value={form.instagram} onChange={handleChange} placeholder="@usuario" />
            </div>
            <div className="cp-field">
              <label>Facebook</label>
              <input type="text" name="facebook" value={form.facebook} onChange={handleChange} placeholder="facebook.com/pagina" />
            </div>
            <div className="cp-field">
              <label>TikTok</label>
              <input type="text" name="tiktok" value={form.tiktok} onChange={handleChange} placeholder="@usuario" />
            </div>
          </div>
        </section>

        {/* PLATO ESTRELLA */}
        <section className="cp-section">
          <h2>Plato estrella</h2>

          <div className="cp-field">
            <label>Nombre del plato *</label>
            <input type="text" name="plato_nombre" value={form.plato_nombre} onChange={handleChange} placeholder="Ej: Hamburguesa clásica" required />
            {errores.plato_nombre && <span className="cp-error">{errores.plato_nombre}</span>}
          </div>

          <div className="cp-field">
            <label>Descripción del plato</label>
            <textarea name="plato_descripcion" value={form.plato_descripcion} onChange={handleChange} onInput={autoResize} rows={2} placeholder="Ingredientes o descripción breve" />
          </div>

          <div className="cp-field">
            <label>Imagen del plato (URL)</label>
            <input type="url" name="plato_imagen_url" value={form.plato_imagen_url} onChange={handleChange} placeholder="https://imagen.com/plato.jpg" />
            {errores.plato_imagen_url && <span className="cp-error">{errores.plato_imagen_url}</span>}
          </div>

          {form.plato_imagen_url && (
            <div className="cp-preview">
              <img src={form.plato_imagen_url} alt="Vista previa del plato" />
            </div>
          )}
        </section>

        {mensaje && (
          <div className={`cp-mensaje cp-mensaje--${mensaje.tipo}`}>{mensaje.texto}</div>
        )}

        <div className="cp-actions">
          <button type="button" className="cp-btn cp-btn--secundario" onClick={() => navigate('/admin/panel')}>
            Cancelar
          </button>
          <button type="submit" className="cp-btn cp-btn--primario" disabled={cargando}>
            {cargando ? <span className="cp-loader" /> : 'Guardar cambios'}
          </button>
        </div>

      </form>
    </div>
  )
}
