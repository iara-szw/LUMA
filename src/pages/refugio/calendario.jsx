import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import FooterRefugio from '../../components/FooterRefugio'
import { obtenerEventosRefugio } from '../../repositories/eventoRepository'
import '../../styles/calendario.css'

export default function CalendarioRefugio() {
  const navigate = useNavigate()
  const { usuario, esRefugio } = usarAuth()

  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!usuario?.id) return
    if (!esRefugio) {
      navigate('/login')
      return
    }

    let activo = true

    const obtenerDatos = async () => {
      const { data, error } = await obtenerEventosRefugio(usuario.id)
      if (!activo) return
      if (error) setError(error)
      else {
        // normalizar a la misma forma que el calendario del adoptante (campo `fecha`)
        const eventos = (data || []).map(e => ({
          tipo: 'evento',
          id: e.id,
          fecha: e.fecha_evento || e.fecha,
          titulo: e.titulo,
          lugar: e.lugar,
          imagen_url: e.imagen_url,
          modalidad: e.modalidad,
        }))
        setItems(eventos)
      }
      setCargando(false)
    }

    obtenerDatos()
    return () => { activo = false }
  }, [usuario, esRefugio, navigate])

  const formatearDia = (fechaStr) => {
    const fecha = new Date(fechaStr)
    return {
      dia: fecha.getDate(),
      diaSemana: fecha.toLocaleString('es-AR', { weekday: 'short' }).toUpperCase(),
      hora: fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  // Agrupa los items por mes/año para pintarlos en secciones, igual que el adoptante
  const grupos = items.reduce((acc, item) => {
    const fecha = new Date(item.fecha)
    const clave = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric' })
    if (!acc[clave]) acc[clave] = []
    acc[clave].push(item)
    return acc
  }, {})

  return (
    <div className="cal-pagina">
              <div className='header-div'>

      <header className="inicio-header">
        <Link to="/" className="logo"><img src="/assets/img/logo.png" alt="" /></Link>
        <div className="inicio-header-iconos">
          {usuario ? (
            <>
              <button className="icono-campana" aria-label="Notificaciones"><img src="/assets/img/notificaciones.png" alt=""/></button>
              <img
                className="avatar"
                src={usuario.foto_url || usuario.foto_perfil || '/assets/img/perfil_default.jpg'}
                alt="perfil"
                onClick={() => navigate('/refugio/perfil')}
              />
            </>
          ) : (
            <nav className="nav-auth">
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/registro" className="btn-registro">Registrarse</Link>
            </nav>
          )}
        </div>
      </header>

      <h2 className="cal-titulo">Mi calendario</h2>
</div>
<button
          type="button"
          className="dash-btn-agregar-evento"
          onClick={() => navigate('/refugio/eventos/crear')}
        >
          Agregar evento
        </button>
<div className="cal-contenedor">
      {cargando ? (
        <p className="cal-vacio">Cargando calendario...</p>
      ) : error ? (
        <p className="cal-vacio">No pudimos cargar tu calendario. Intentá de nuevo más tarde.</p>
      ) : items.length === 0 ? (
        <p className="cal-vacio">No tenés eventos programados.</p>
      ) : (
        Object.entries(grupos).map(([mes, itemsDelMes]) => (
          <section key={mes} className="cal-seccion">
            <h3 className="cal-mes-titulo">{mes}</h3>
            <div className="cal-lista">
              {itemsDelMes.map(item => {
                const { dia, diaSemana, hora } = formatearDia(item.fecha)
                return (
                  <article
                    key={`${item.tipo}-${item.id}`}
                    className={`cal-tarjeta ${item.tipo === 'entrevista' ? 'cal-tarjeta--entrevista' : 'cal-tarjeta--evento'}`}
                    onClick={() => { if (item.tipo !== 'entrevista' && item.id) navigate(`/eventos/${item.id}`) }}
                  >
                    <div className="cal-tarjeta-fecha">
                      <span className="cal-tarjeta-diasemana">{diaSemana}</span>
                      <span className="cal-tarjeta-dia">{dia}</span>
                    </div>
                    <div className="cal-tarjeta-info">
                      <span className={`cal-badge ${item.tipo === 'entrevista' ? 'cal-badge--entrevista' : 'cal-badge--evento'}`}>
                        {item.tipo === 'entrevista' ? 'Entrevista' : 'Evento'}
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
</div>
      <FooterRefugio />
    </div>
  )
}
