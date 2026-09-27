import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import { crearEvento } from '../../repositories/eventoRepository'
import '../../styles/cargarMascota.css'

const ESTADO_INICIAL = {
  titulo: '',
  fechaEvento: '',
  lugar: '',
  direccion: '',
  descripcion: '',
  imagenUrl: '',
}

export default function CargarEvento() {
  const navigate = useNavigate()
  const { usuario } = usarAuth()

  const [form, setForm] = useState(ESTADO_INICIAL)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState(null)
  const [exito, setExito] = useState(false)

  const actualizarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
    if (errores[campo]) {
      setErrores(prev => ({ ...prev, [campo]: null }))
    }
  }

  const validar = () => {
    const nuevosErrores = {}
    if (!form.titulo.trim()) nuevosErrores.titulo = 'El título es obligatorio.'
    if (!form.fechaEvento) nuevosErrores.fechaEvento = 'Elegí fecha y hora.'

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setErrorEnvio(null)

    if (!validar()) return
    if (!usuario?.id) {
      setErrorEnvio('No se pudo identificar el refugio. Inicia sesión nuevamente.')
      return
    }

    setGuardando(true)

    try {
      const res = await crearEvento({
        refugio_id: usuario.id,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        lugar: form.lugar.trim() || null,
        direccion: form.direccion.trim() || null,
        imagen_url: form.imagenUrl.trim() || null,
        fecha_evento: new Date(form.fechaEvento).toISOString(),
      })

      if (res?.error) {
        console.error('Error creando evento:', res.error)
        const msg = res.error?.message || 'No se pudo guardar el evento. Intenta de nuevo.'
        setErrorEnvio(msg)
        setGuardando(false)
        return
      }

      setExito(true)
      setTimeout(() => navigate('/refugio/dashboard'), 1200)
    } catch {
      setErrorEnvio('Ocurrío un error inesperado. Intenta de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <div className="cargar-pagina">
      <header className="cargar-header">
        <button
          className="cargar-volver"
          aria-label="Volver"
          onClick={() => navigate('/refugio/dashboard')}
        >
          <span className="cargar-volver-icono">←</span>
        </button>
        <h1 className="cargar-titulo">Cargar evento</h1>
      </header>

      <form className="cargar-form" onSubmit={manejarEnvio}>
        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="titulo">Título</label>
          <input
            id="titulo"
            type="text"
            className="cargar-input"
            placeholder="Ej: Gran Feria de Adopción"
            value={form.titulo}
            onChange={e => actualizarCampo('titulo', e.target.value)}
          />
          {errores.titulo && <span className="cargar-error">{errores.titulo}</span>}
        </section>

        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="fechaEvento">Fecha y hora</label>
          <input
            id="fechaEvento"
            type="datetime-local"
            className="cargar-input"
            value={form.fechaEvento}
            onChange={e => actualizarCampo('fechaEvento', e.target.value)}
          />
          {errores.fechaEvento && <span className="cargar-error">{errores.fechaEvento}</span>}
        </section>

        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="lugar">Lugar</label>
          <input
            id="lugar"
            type="text"
            className="cargar-input"
            placeholder="Ej: Parque Las Heras"
            value={form.lugar}
            onChange={e => actualizarCampo('lugar', e.target.value)}
          />
        </section>

        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="direccion">Dirección</label>
          <input
            id="direccion"
            type="text"
            className="cargar-input"
            placeholder="Ej: Av. Las Heras 3000"
            value={form.direccion}
            onChange={e => actualizarCampo('direccion', e.target.value)}
          />
        </section>

        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            className="cargar-input cargar-textarea"
            placeholder="Contale a la gente de qué se trata el evento..."
            value={form.descripcion}
            onChange={e => actualizarCampo('descripcion', e.target.value)}
          />
        </section>

        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="imagenUrl">Imagen (URL)</label>
          <input
            id="imagenUrl"
            type="url"
            className="cargar-input"
            placeholder="https://..."
            value={form.imagenUrl}
            onChange={e => actualizarCampo('imagenUrl', e.target.value)}
          />
        </section>

        {errorEnvio && <p className="cargar-error cargar-error--general">{errorEnvio}</p>}
        {exito && <p className="cargar-exito">Evento publicado</p>}

        <button type="submit" className="cargar-btn-guardar" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Publicar evento'}
        </button>
      </form>
    </div>
  )
}