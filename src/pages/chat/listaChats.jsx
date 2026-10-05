import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import { obtenerConversaciones } from '../../repositories/chatRepository'
import Footer from '../../components/Footer'
import FooterRefugio from '../../components/FooterRefugio'
import '../../styles/chat.css'

const tagPorEstado = (solicitudEstado) => {
  if (!solicitudEstado) return { texto: 'Consulta', clase: 'lista-chats-tag--consulta' }
  if (solicitudEstado === 'Aceptada') return { texto: 'Coordinar entrevista', clase: 'lista-chats-tag--aceptada' }
  return { texto: 'Postulación en curso', clase: 'lista-chats-tag--pendiente' }
}

const obtenerTipoConversacion = (solicitudEstado) => {
  if (!solicitudEstado) return 'consulta'
  if (solicitudEstado === 'Aceptada') return 'aceptada'
  return 'postulacion'
}

export default function ListaChats() {
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario, esRefugio } = usarAuth()
  const esRutaRefugio = location.pathname.startsWith('/refugio') || (typeof window !== 'undefined' && window.location.pathname.startsWith('/refugio'))

  const [conversaciones, setConversaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroSeleccionado, setFiltroSeleccionado] = useState('todos')

  useEffect(() => {
    let activo = true

    const cargar = async () => {
      if (!usuario?.id) return
      setCargando(true)
      const { data } = await obtenerConversaciones(usuario.id, esRefugio)
      if (activo) {
        setConversaciones(data || [])
        setCargando(false)
      }
    }

    cargar()
    return () => { activo = false }
  }, [usuario?.id, esRefugio])

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr)
    const hoy = new Date()
    const esHoy = fecha.toDateString() === hoy.toDateString()
    return esHoy
      ? fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      : fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  }

  const conversacionesFiltradas = conversaciones.filter(c => {
    if (filtroSeleccionado === 'todos') return true
    const tipo = obtenerTipoConversacion(c.solicitudes?.estado)
    return tipo === filtroSeleccionado
  })

  const pick = (obj, keys) => {
    if (!obj) return null
    for (const k of keys) if (obj[k]) return obj[k]
    return null
  }

  return (
    <div className="lista-chats-pagina">
      <div className="lista-chats-header">
      <header className="inicio-header">
        <Link to="/" className="logo"><img src="/assets/img/logo.png" alt="" /></Link>
        <div className="inicio-header-iconos">
          {usuario ? (
            <>
              <button className="icono-campana" aria-label="Notificaciones"><img src="/assets/img/notificaciones.png" alt=""/></button>
              <img
                className="avatar"
                src={usuario.foto_url || usuario.logo_url || '/assets/img/perfil_default.jpg'}
                alt="perfil"
                onClick={() => navigate(esRefugio ? '/refugio/perfil' : '/adoptante/perfil')}
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

      <h2 className="lista-chats-titulo">Mensajes</h2>
</div>
      <div className="lista-chats-filtros">
        <button
          className={`lista-chats-filtro ${filtroSeleccionado === 'todos' ? 'activo' : ''}`}
          onClick={() => setFiltroSeleccionado('todos')}
        >
          Todos
        </button>
        <button
          className={`lista-chats-filtro ${filtroSeleccionado === 'consulta' ? 'activo' : ''}`}
          onClick={() => setFiltroSeleccionado('consulta')}
        >
          Consulta
        </button>
        <button
          className={`lista-chats-filtro ${filtroSeleccionado === 'postulacion' ? 'activo' : ''}`}
          onClick={() => setFiltroSeleccionado('postulacion')}
        >
          Postulación en curso
        </button>
      </div>

      {cargando ? (
        <p className="chat-vacio">Cargando conversaciones...</p>
      ) : conversacionesFiltradas.length === 0 ? (
        <p className="chat-vacio">
          {esRutaRefugio ? 'Todavía no recibiste consultas.' : 'Todavía no iniciaste ninguna conversación.'}
        </p>
      ) : (
      conversacionesFiltradas.map(c => {
        const contraparte = esRutaRefugio ? c.adoptantes : c.refugios
        const nombre = esRutaRefugio
          ? `${contraparte?.nombre || ''} ${contraparte?.apellido || ''}`.trim()
          : contraparte?.nombre || 'Refugio'
        const avatar = esRutaRefugio
          ? pick(contraparte, ['foto_url'])
          : pick(contraparte, ['logo_url', 'foto_url', 'logoUrl', 'logoURL'])
          const tag = tagPorEstado(c.solicitudes?.estado)

          return (
            <article
              key={c.id}
              className="lista-chats-item"
              onClick={() => navigate(`/${esRutaRefugio ? 'refugio' : 'adoptante'}/chats/${c.id}`)}
            >
              <img
                className="lista-chats-avatar"
                src={avatar || '/assets/img/perfil_default.jpg'}
                alt={nombre}
                onClick={(e) => {
                  e.stopPropagation()
                  if (esRutaRefugio) {
                    // refugio viendo la lista -> abrir perfil del adoptante
                    const adoptanteId = c.adoptante_id || c.adoptantes?.id
                    if (adoptanteId) navigate(`/refugio/adoptante/${adoptanteId}`)
                  } else {
                    // adoptante viendo la lista -> abrir perfil público del refugio
                    const refugioId = c.refugio_id || c.refugios?.id
                    if (refugioId) navigate(`/refugio/${refugioId}`)
                  }
                }}
              />
              <div className="lista-chats-info">
                <div className="lista-chats-nombre-fila">
                  <span className="lista-chats-nombre">
                    {nombre}{c.mascotas?.nombre ? ` · ${c.mascotas.nombre}` : ''}
                  </span>
                  <span className="lista-chats-fecha">{formatearFecha(c.ultimo_mensaje_fecha)}</span>
                </div>
                <span className={`lista-chats-tag ${tag.clase}`}>{tag.texto}</span>
              </div>
            </article>
          )
        })
      )}

      {esRutaRefugio ? <FooterRefugio /> : <Footer />}
    </div>
  )
}