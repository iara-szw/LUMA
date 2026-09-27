import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerEventosProximos } from '../repositories/eventoRepository'
import '../styles/proximosEventos.css'

export default function ProximosEventos() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    const obtenerDatos = async () => {
      const { data, error } = await obtenerEventosProximos(2)
      if (!activo) return
      if (!error) setEventos(data || [])
      setCargando(false)
    }

    obtenerDatos()
    return () => { activo = false }
  }, [])

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr)
    return {
      mes: fecha.toLocaleString('es-AR', { month: 'short' }).toUpperCase(),
      dia: fecha.getDate(),
      hora: fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  return (
    <section className="prox-eventos-seccion">
      <h3 className="prox-eventos-titulo">Mis eventos</h3>

      {cargando ? (
        <p className="prox-eventos-vacio">Cargando eventos...</p>
      ) : eventos.length === 0 ? (
        <p className="prox-eventos-vacio">No hay eventos próximos.</p>
      ) : (
        <div className="prox-eventos-lista">
          {eventos.map(e => {
            const { mes, dia, hora } = formatearFecha(e.fecha_evento)
            return (
              <article
                key={e.id}
                className="prox-evento-tarjeta"
                onClick={() => navigate(`/eventos/${e.id}`)}
              >
                <div className="prox-evento-fecha">
                  <span className="prox-evento-mes">{mes}</span>
                  <span className="prox-evento-dia">{dia}</span>
                </div>
                <div className="prox-evento-info">
                  <h4>{e.titulo}</h4>
                  <p>{e.lugar}{hora ? ` · ${hora}` : ''}</p>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <button
        type="button"
        className="prox-eventos-vertodos"
        onClick={() => navigate('/adoptante/calendario')}
      >
        Ver todos
      </button>
    </section>
  )
}