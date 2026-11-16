import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarAuth } from '../hooks/UsarAuth'
import { obtenerEventosProximos } from '../repositories/eventoRepository'
import { obtenerEntrevistasConfirmadas } from '../repositories/entrevistaRepository'
import { eventoAItem, entrevistaAItem, combinarItems } from '../utils/itemsCalendario'
import '../styles/proximosEventos.css'

export default function ProximosEventos() {
  const navigate = useNavigate()
  const { usuario } = usarAuth()
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!usuario?.id) return
    let activo = true

    const obtenerDatos = async () => {
      const [evRes, entRes] = await Promise.all([
        obtenerEventosProximos(2),
        obtenerEntrevistasConfirmadas(usuario.id, 2),
      ])
      if (!activo) return

      const combinados = combinarItems(
        (evRes.data || []).map(e => eventoAItem(e)),
        (entRes.data || []).map(entrevistaAItem),
      ).slice(0, 2)

      setItems(combinados)
      setCargando(false)
    }

    obtenerDatos()
    return () => { activo = false }
  }, [usuario])

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr)
    return {
      mes: fecha.toLocaleString('es-AR', { month: 'short' }).toUpperCase(),
      dia: fecha.getDate(),
      hora: fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  const irAlDetalle = (item) =>
    navigate(item.tipo === 'entrevista' ? '/adoptante/calendario' : `/eventos/${item.id}`)

  return (
    <section className="prox-eventos-seccion">
      <h3 className="prox-eventos-titulo">Mis eventos</h3>

      {cargando ? (
        <p className="prox-eventos-vacio">Cargando eventos...</p>
      ) : items.length === 0 ? (
        <p className="prox-eventos-vacio">No hay eventos próximos.</p>
      ) : (
        <div className="prox-eventos-lista">
          {items.map(item => {
            const { mes, dia, hora } = formatearFecha(item.fecha)
            return (
              <article
                key={`${item.tipo}-${item.id}`}
                className={`prox-evento-tarjeta prox-evento-tarjeta--${item.tipo}`}
                onClick={() => irAlDetalle(item)}
              >
                <div className="prox-evento-fecha">
                  <span className="prox-evento-mes">{mes}</span>
                  <span className="prox-evento-dia">{dia}</span>
                </div>
                <div className="prox-evento-info">
                  {item.tipo === 'entrevista' && (
                    <span className="prox-evento-etiqueta">Entrevista</span>
                  )}
                  <h4>{item.titulo}</h4>
                  <p>{item.lugar}{hora ? ` · ${hora}` : ''}</p>
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