import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { obtenerEventoPorId } from '../repositories/eventoRepository'
import Footer from '../components/Footer'
import '../styles/detalleEvento.css'

export default function DetalleEvento() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [evento, setEvento] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let activo = true

    const obtenerDatos = async () => {
      const { data, error } = await obtenerEventoPorId(id)
      if (!activo) return
      if (error) setError(error)
      else setEvento(data)
      setCargando(false)
    }

    if (id) obtenerDatos()
    return () => { activo = false }
  }, [id])

  if (cargando) {
    return <p className="det-evento-vacio">Cargando evento...</p>
  }

  if (error || !evento) {
    return (
      <div className="det-evento-pagina">
        <header className="det-evento-header">
          <button className="det-evento-volver" aria-label="Volver" onClick={() => navigate(-1)}>←</button>
        </header>
        <p className="det-evento-vacio">No pudimos encontrar este evento.</p>
      </div>
    )
  }

  const fecha = new Date(evento.fecha_evento)
  const fechaFormateada = fecha.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="det-evento-pagina">
      <header className="det-evento-header">
        <button className="det-evento-volver" aria-label="Volver" onClick={() => navigate(-1)}>←</button>
      </header>

      {evento.imagen_url ? (
        <img className="det-evento-imagen" src={evento.imagen_url} alt={evento.titulo} />
      ) : (
        <div className="det-evento-imagen det-evento-imagen--placeholder" />
      )}

      <div className="det-evento-contenido">
        <h1 className="det-evento-titulo">{evento.titulo}</h1>

        {evento.refugios?.nombre && (
          <p className="det-evento-refugio">{evento.refugios.nombre}</p>
        )}

        <div className="det-evento-dato">
          <span className="det-evento-dato-icono">📅</span>
          <span className="det-evento-dato-texto">
            {fechaFormateada} · {hora}
          </span>
        </div>

        {evento.lugar && (
          <div className="det-evento-dato">
            <span className="det-evento-dato-icono">📍</span>
            <span className="det-evento-dato-texto">
              {evento.lugar}
              {evento.direccion ? ` — ${evento.direccion}` : ''}
            </span>
          </div>
        )}

        {evento.descripcion && (
          <section className="det-evento-seccion">
            <h3>Sobre el evento</h3>
            <p>{evento.descripcion}</p>
          </section>
        )}
      </div>

      <Footer />
    </div>
  )
}