import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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

  return (
    <div className="lista-chats-pagina">
      <h2 className="lista-chats-titulo">Mensajes</h2>

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
          const avatar = esRutaRefugio ? contraparte?.foto_url : contraparte?.logo_url
          const tag = tagPorEstado(c.solicitudes?.estado)

          return (
            <article
              key={c.id}
              className="lista-chats-item"
              onClick={() => navigate(`/${esRutaRefugio ? 'refugio' : 'adoptante'}/chats/${c.id}`)}
            >
              <img
                className="lista-chats-avatar"
                src={avatar || '/cliente/public/assets/img/perfil_default.jpg'}
                alt={nombre}
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