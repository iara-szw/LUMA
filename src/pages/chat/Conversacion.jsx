import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import { usarChat } from '../../contexts/ContextoChat.jsx'
import {
  obtenerMensajes,
  enviarMensaje,
  marcarComoLeidos,
  suscribirseAMensajes,
  desuscribirse,
  obtenerConversacionPorId,
} from '../../repositories/chatRepository'
import '../../styles/chat.css'

export default function Conversacion() {
  const { id: conversacionId } = useParams()
  const navigate = useNavigate()
  const { usuario, esRefugio } = usarAuth()
  const { refrescarContador } = usarChat()

  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [mascota, setMascota] = useState(null)
  const [mostrarFichaMascota, setMostrarFichaMascota] = useState(true)
  const [nombreInterlocutor, setNombreInterlocutor] = useState('Conversación')
  const [interlocutorAvatar, setInterlocutorAvatar] = useState(null)
  const [conversacionData, setConversacionData] = useState(null)

  const finRef = useRef(null)
  const channelRef = useRef(null)

  // Carga inicial + suscripción realtime + marcar como leído al entrar
  useEffect(() => {
    let activo = true

    const cargar = async () => {
      setCargando(true)

      const [mensajesRes, conversacionRes] = await Promise.all([
        obtenerMensajes(conversacionId),
        obtenerConversacionPorId(conversacionId),
      ])

      if (!activo) return

      if (mensajesRes.error) {
        setError('No se pudieron cargar los mensajes.')
      } else {
        setMensajes(mensajesRes.data || [])
      }

      if (conversacionRes.data?.mascotas) {
        setMascota(conversacionRes.data.mascotas)
      } else {
        setMascota(null)
      }

      // determinar avatar del interlocutor: si yo soy refugio, muestro foto del adoptante, y viceversa
      const conv = conversacionRes.data
      if (conv) {
        const pick = (obj, keys) => {
          if (!obj) return null
          for (const k of keys) {
            if (obj[k]) return obj[k]
          }
          return null
        }

        let avatar = null
        if (esRefugio) {
          avatar = pick(conv.adoptantes, ['foto_url', 'foto', 'foto_perfil']) || pick(conv.adoptante, ['foto_url', 'foto', 'foto_perfil'])
        } else {
          avatar = pick(conv.refugios, ['logo_url', 'logo', 'foto_url', 'logoUrl', 'logoURL']) || pick(conv.refugio, ['logo_url', 'logo', 'foto_url'])
        }

        setInterlocutorAvatar(avatar)
        setConversacionData(conv)
      }

      const conversacion = conversacionRes.data
      if (conversacion) {
        const nombre = esRefugio
          ? `${conversacion.adoptantes?.nombre || ''} ${conversacion.adoptantes?.apellido || ''}`.trim() || 'Adoptante'
          : conversacion.refugios?.nombre || 'Refugio'
        setNombreInterlocutor(nombre)
      } else {
        setNombreInterlocutor('Conversación')
      }

      setCargando(false)

      // Marcar como leídos los mensajes de la otra parte al abrir el chat
      if (usuario?.id) {
        await marcarComoLeidos(conversacionId, usuario.id)
        refrescarContador()
      }
    }

    if (conversacionId) cargar()

    // Suscripción a mensajes nuevos de esta conversación
    if (conversacionId) {
      channelRef.current = suscribirseAMensajes(conversacionId, (nuevo) => {
        setMensajes(prev => {
          // evita duplicar el propio mensaje si ya se agregó de forma optimista
          if (prev.some(m => m.id === nuevo.id)) return prev
          return [...prev, nuevo]
        })

        // si el mensaje nuevo es de la otra parte y el chat está abierto, marcarlo leído
        if (usuario?.id && nuevo.emisor_id !== usuario.id) {
          marcarComoLeidos(conversacionId, usuario.id).then(() => refrescarContador())
        }
      })
    }

    return () => {
      activo = false
      desuscribirse(channelRef.current)
      channelRef.current = null
    }
  }, [conversacionId, usuario?.id])

  // Auto-scroll al último mensaje
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const handleEnviar = async (e) => {
    e.preventDefault()
    const contenido = texto.trim()
    if (!contenido || enviando || !usuario?.id) return

    setEnviando(true)
    setTexto('')

    const { data, error } = await enviarMensaje(conversacionId, usuario.id, contenido)

    if (error) {
      setError('No se pudo enviar el mensaje.')
      setTexto(contenido) // devuelve el texto al input si falló
    } else if (data) {
      // agregado optimista: la suscripción realtime lo va a ignorar por el chequeo de duplicado
      setMensajes(prev => (prev.some(m => m.id === data.id) ? prev : [...prev, data]))
    }

    setEnviando(false)
  }

  const formatearHora = (fechaStr) => {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="chat-pagina">
      <header className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="chat-btn-volver" onClick={() => navigate(-1)} aria-label="Volver">←</button>
          <h2 className="chat-titulo" style={{ margin: 0 }}>{nombreInterlocutor}</h2>
          <img
            src={interlocutorAvatar || '/assets/img/perfil_default.jpg'}
            alt={nombreInterlocutor}
            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginLeft: 8, cursor: 'pointer' }}
            onClick={() => {
              if (!conversacionData) return
              if (esRefugio) {
                // refugio debe ver el perfil del adoptante
                const solicitudId = conversacionData?.solicitud_id
                if (solicitudId) {
                  navigate(`/refugio/solicitud/${solicitudId}/perfil`)
                  return
                }

                const adoptanteId = conversacionData?.adoptante_id || conversacionData?.adoptantes?.id || conversacionData?.adoptante?.id
                if (adoptanteId) {
                  navigate(`/refugio/adoptante/${adoptanteId}`)
                }
              } else {
                // adoptante debe ver el perfil público del refugio
                const refugioId = conversacionData?.refugio_id || conversacionData?.refugios?.id || conversacionData?.refugio_id
                if (refugioId) navigate(`/refugio/${refugioId}`)
              }
            }}
          />
        </div>

        <div className="chat-header-iconos" style={{ display: 'flex', alignItems: 'center', gap: '10px' ,marginLeft: '30%'}}>
          <img
            className="avatar"
            src={usuario?.foto_url || usuario?.foto_perfil || usuario?.logo_url || '/assets/img/perfil_default.jpg'}
            alt="perfil"
            onClick={() => navigate(esRefugio ? '/refugio/perfil' : '/adoptante/perfil')}
            style={{ width: 36, height: 36, borderRadius: '50%', cursor: 'pointer' }}
          />
        </div>
      </header>

      {mascota && mostrarFichaMascota && (
        <div className="chat-ficha-mascota">
          <button
            type="button"
            className="chat-ficha-cerrar"
            aria-label="Cerrar ficha"
            onClick={() => setMostrarFichaMascota(false)}
          >
            ×
          </button>

          <img
            src={mascota.foto_url || '/assets/img/perfil_default.jpg'}
            alt={mascota.nombre}
            className="chat-ficha-foto"
          />

          <div className="chat-ficha-info">
            <strong>{mascota.nombre}</strong>
            <span>{mascota.edad || 'Edad no disponible'}</span>
          </div>
        </div>
      )}

      <div className="chat-mensajes">
        {cargando ? (
          <p className="chat-vacio">Cargando mensajes...</p>
        ) : error ? (
          <p className="chat-error">{error}</p>
        ) : mensajes.length === 0 ? (
          <p className="chat-vacio">Todavía no hay mensajes. ¡Escribí el primero!</p>
        ) : (
          mensajes.map(m => {
            const esPropio = m.emisor_id === usuario?.id
            return (
              <div
                key={m.id}
                className={esPropio ? 'chat-burbuja chat-burbuja--propia' : 'chat-burbuja chat-burbuja--ajena'}
              >
                <p>{m.contenido}</p>
                <span className="chat-burbuja-hora">{formatearHora(m.fecha)}</span>
              </div>
            )
          })
        )}
        <div ref={finRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleEnviar}>
        <input
          type="text"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder={esRefugio ? 'Responder al adoptante...' : 'Escribir un mensaje...'}
          disabled={enviando}
        />
        <button type="submit" disabled={enviando || !texto.trim()} aria-label="Enviar">
          ➤
        </button>
      </form>
    </div>
  )
}