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

  const finRef = useRef(null)
  const channelRef = useRef(null)

  // Carga inicial + suscripción realtime + marcar como leído al entrar
  useEffect(() => {
    let activo = true

    const cargar = async () => {
      setCargando(true)
      const { data, error } = await obtenerMensajes(conversacionId)
      if (!activo) return

      if (error) {
        setError('No se pudieron cargar los mensajes.')
      } else {
        setMensajes(data || [])
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
        <button className="chat-btn-volver" onClick={() => navigate(-1)} aria-label="Volver">
          ←
        </button>
        <h2 className="chat-titulo">Conversación</h2>
      </header>

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