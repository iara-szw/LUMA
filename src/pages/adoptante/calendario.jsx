import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Footer from '../../components/Footer'
import { obtenerCalendarioAdoptante } from '../../repositories/calendarioRepository'
import '../../styles/calendario.css'

export default function Calendario() {
  const navigate = useNavigate()
  const { usuario } = usarAuth()

  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let activo = true

    const obtenerDatos = async () => {
      const { data, error } = await obtenerCalendarioAdoptante(usuario.id)
      if (!activo) return
      if (error) setError(error)
      else setItems(data || [])
      setCargando(false)
    }

    if (usuario?.id) obtenerDatos()
    return () => { activo = false }
  }, [usuario])

  // Agrupa los items por mes/año para pintarlos en secciones, tipo "Octubre 2026"
  const grupos = items.reduce((acc, item) => {
    const fecha = new Date(item.fecha)
    const clave = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric' })
    if (!acc[clave]) acc[clave] = []
    acc[clave].push(item)
    return acc
  }, {})

  const formatearDia = (fechaStr) => {
    const fecha = new Date(fechaStr)
    return {
      dia: fecha.getDate(),
      diaSemana: fecha.toLocaleString('es-AR', { weekday: 'short' }).toUpperCase(),
      hora: fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  return (
    <div className="cal-pagina">
      <header className="cal-header">
        <Link to="/" className="cal-logo">
          <img src="/cliente/public/assets/img/logo.png" alt="LUMA" />
        </Link>
        <h2 className="cal-titulo">Mi calendario</h2>
      </header>

      {cargando ? (
        <p className="cal-vacio">Cargando calendario...</p>
      ) : error ? (
        <p className="cal-vacio">No pudimos cargar tu calendario. Intentá de nuevo más tarde.</p>
      ) : items.length === 0 ? (
        <p className="cal-vacio">No tenés eventos ni entrevistas próximas.</p>
      ) : (
        Object.entries(grupos).map(([mes, itemsDelMes]) => (
          <section key={mes} className="cal-seccion">
            <h3 className="cal-mes-titulo">{mes}</h3>
            <div className="cal-lista">
              {itemsDelMes.map(item => {
                const { dia, diaSemana, hora } = formatearDia(item.fecha)
                const esEntrevista = item.tipo === 'entrevista'
                return (
                  <article
                    key={`${item.tipo}-${item.id}`}
                    className={`cal-tarjeta ${esEntrevista ? 'cal-tarjeta--entrevista' : 'cal-tarjeta--evento'}`}
                    onClick={() => {
                      if (!esEntrevista) navigate(`/eventos/${item.id}`)
                    }}
                  >
                    <div className="cal-tarjeta-fecha">
                      <span className="cal-tarjeta-diasemana">{diaSemana}</span>
                      <span className="cal-tarjeta-dia">{dia}</span>
                    </div>
                    <div className="cal-tarjeta-info">
                      <span className={`cal-badge ${esEntrevista ? 'cal-badge--entrevista' : 'cal-badge--evento'}`}>
                        {esEntrevista ? 'Entrevista' : 'Evento'}
                      </span>
                      <h4>{item.titulo}</h4>
                      <p>
                        {hora}
                        {item.lugar ? ` · ${item.lugar}` : ''}
                        {item.modalidad ? ` · ${item.modalidad}` : ''}
                        {item.refugio ? ` · ${item.refugio}` : ''}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))
      )}

      <Footer />
    </div>
  )
}