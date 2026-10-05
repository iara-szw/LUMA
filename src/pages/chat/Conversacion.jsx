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
import { Supabase } from '../../services/supabase'
import { responderEntrevista } from '../../repositories/entrevistaRepository'
import '../../styles/chat.css'

function parsearEntrevistaMensaje(contenido) {
  if (!contenido || typeof contenido !== 'string') return null

  let raw = contenido
  if (raw.startsWith('__ENTREVISTA_CONFIRMADA__')) {
    raw = raw.replace('__ENTREVISTA_CONFIRMADA__', '__ENTREVISTA__')
  } else if (raw.startsWith('__ENTREVISTA_RECHAZADA__')) {
    raw = raw.replace('__ENTREVISTA_RECHAZADA__', '__ENTREVISTA__')
  }

  if (!raw.startsWith('__ENTREVISTA__')) return null

  try {
    return JSON.parse(raw.replace('__ENTREVISTA__', ''))
  } catch (error) {
    console.error('Error parseando propuesta de entrevista:', error)
    return null
  }
}

async function guardarEstadoMensajeEntrevista(mensajeId, contenido) {
  if (!mensajeId) return { data: null, error: { message: 'mensaje_id faltante' } }

  return Supabase
    .from('mensajes')
    .update({ contenido })
    .eq('id', mensajeId)
    .select()
    .maybeSingle()
}

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
  const [procesoEntrevistaId, setProcesoEntrevistaId] = useState(null)
  const [respondiendoEntrevista, setRespondiendoEntrevista] = useState(false)

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
          avatar = pick(conv.adoptantes, ['foto_url']) || pick(conv.adoptante, ['foto_url'])
        } else {
          avatar = pick(conv.refugios, ['logo_url', 'foto_url', 'logoUrl', 'logoURL']) || pick(conv.refugio, ['logo_url', 'foto_url'])
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

  const handleResponderEntrevista = async (mensajeId, aceptado) => {
    if (enviando) return

    setEnviando(true)

    const { error } = await responderEntrevista(mensajeId, aceptado)

    if (error) {
      setError('No se pudo actualizar la propuesta de entrevista.')
    } else {
      setMensajes(prev => prev.map(m => {
        if (m.id === mensajeId) {
          return { ...m, estado: aceptado ? 'aceptado' : 'rechazado' }
        }
        return m
      }))
    }

    setEnviando(false)
  }

  const handleAceptarEntrevista = async (mensajeId, entrevistaId) => {
    if (!mensajeId || !entrevistaId) return
    setRespondiendoEntrevista(true)
    try {
      const { error: errorEntrevista } = await responderEntrevista(entrevistaId, true)
      if (errorEntrevista) throw errorEntrevista

      const nuevoContenido = `__ENTREVISTA_CONFIRMADA__${JSON.stringify({
        id: entrevistaId,
        mascota: parsearEntrevistaMensaje((mensajes.find(m => m.id === mensajeId)?.contenido || ''))?.mascota || 'mascota',
        fecha: parsearEntrevistaMensaje((mensajes.find(m => m.id === mensajeId)?.contenido || ''))?.fecha || new Date().toISOString(),
        modalidad: parsearEntrevistaMensaje((mensajes.find(m => m.id === mensajeId)?.contenido || ''))?.modalidad || 'Presencial',
        lugar: parsearEntrevistaMensaje((mensajes.find(m => m.id === mensajeId)?.contenido || ''))?.lugar || 'No especificado',
        notas: parsearEntrevistaMensaje((mensajes.find(m => m.id === mensajeId)?.contenido || ''))?.notas || '',
        estado: 'Confirmada',
      })}`

      const { error: errorMensaje } = await guardarEstadoMensajeEntrevista(mensajeId, nuevoContenido)
      if (errorMensaje) throw errorMensaje

      setMensajes(prev => prev.map(m => {
        if (m.id === mensajeId) {
          return { ...m, contenido: nuevoContenido }
        }
        return m
      }))
      setError(null)
    } catch (err) {
      console.error('Error confirmando entrevista:', err)
      setError('No se pudo confirmar la entrevista.')
    } finally {
      setRespondiendoEntrevista(false)
      setProcesoEntrevistaId(null)
    }
  }

  const handleRechazarEntrevista = async (mensajeId, entrevistaId) => {
    if (!mensajeId || !entrevistaId) return
    setRespondiendoEntrevista(true)
    try {
      const { error: errorEntrevista } = await responderEntrevista(entrevistaId, false)
      if (errorEntrevista) throw errorEntrevista

      const nuevoContenido = `__ENTREVISTA_RECHAZADA__${JSON.stringify({
        id: entrevistaId,
        mascota: parsearEntrevistaMensaje((mensajes.find(m => m.id === mensajeId)?.contenido || ''))?.mascota || 'mascota',
        fecha: parsearEntrevistaMensaje((mensajes.find(m => m.id === mensajeId)?.contenido || ''))?.fecha || new Date().toISOString(),
        modalidad: parsearEntrevistaMensaje((mensajes.find(m => m.id === mensajeId)?.contenido || ''))?.modalidad || 'Presencial',
        lugar: parsearEntrevistaMensaje((mensajes.find(m => m.id === mensajeId)?.contenido || ''))?.lugar || 'No especificado',
        notas: parsearEntrevistaMensaje((mensajes.find(m => m.id === mensajeId)?.contenido || ''))?.notas || '',
        estado: 'Rechazada',
      })}`

      const { error: errorMensaje } = await guardarEstadoMensajeEntrevista(mensajeId, nuevoContenido)
      if (errorMensaje) throw errorMensaje

      setMensajes(prev => prev.map(m => {
        if (m.id === mensajeId) {
          return { ...m, contenido: nuevoContenido }
        }
        return m
      }))
      setError(null)
    } catch (err) {
      console.error('Error rechazando entrevista:', err)
      setError('No se pudo rechazar la entrevista.')
    } finally {
      setRespondiendoEntrevista(false)
      setProcesoEntrevistaId(null)
    }
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
          {esRefugio && (
            <button
              type="button"
              className="btn-formulario"
              onClick={() => navigate(`/refugio/chats/${conversacionId}/entrevista`)}
              style={{ padding: '8px 12px', fontSize: 13 }}
            >
              Programar entrevista
            </button>
          )}
          <img
            className="avatar"
            src={usuario?.foto_url || usuario?.logo_url || '/assets/img/perfil_default.jpg'}
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
            const entrevista = parsearEntrevistaMensaje(m.contenido)
            const entrevistaConfirmada = typeof m.contenido === 'string' && m.contenido.startsWith('__ENTREVISTA_CONFIRMADA__')
            const entrevistaRechazada = typeof m.contenido === 'string' && m.contenido.startsWith('__ENTREVISTA_RECHAZADA__')

            if (entrevista || entrevistaConfirmada || entrevistaRechazada) {
              const data = entrevista || (entrevistaConfirmada ? parsearEntrevistaMensaje(m.contenido.replace('__ENTREVISTA_CONFIRMADA__', '__ENTREVISTA__')) : parsearEntrevistaMensaje(m.contenido.replace('__ENTREVISTA_RECHAZADA__', '__ENTREVISTA__')))

              return (
                <div
                  key={m.id}
                  className={esPropio ? 'chat-burbuja chat-burbuja--propia' : 'chat-burbuja chat-burbuja--ajena'}
                  style={{ maxWidth: 420 }}
                >
                  <div style={{ display: 'grid', gap: 8 }}>
                    <strong>{esPropio ? 'Propuesta enviada' : 'Entrevista propuesta'}</strong>
                    <span><strong>Mascota:</strong> {data?.mascota || '—'}</span>
                    <span><strong>Fecha:</strong> {new Date(data?.fecha || Date.now()).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span><strong>Modalidad:</strong> {data?.modalidad || '—'}</span>
                    <span><strong>Lugar:</strong> {data?.lugar || 'No especificado'}</span>
                    {data?.notas && <span><strong>Notas:</strong> {data.notas}</span>}

                    {!esPropio && !entrevistaConfirmada && !entrevistaRechazada && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-formulario"
                          style={{ padding: '8px 10px', fontSize: 12 }}
                          disabled={respondiendoEntrevista}
                          onClick={() => handleAceptarEntrevista(m.id, data?.id)}
                        >
                          Aceptar
                        </button>
                        <button
                          type="button"
                          className="btn-formulario ghost"
                          style={{ padding: '8px 10px', fontSize: 12 }}
                          disabled={respondiendoEntrevista}
                          onClick={() => handleRechazarEntrevista(m.id, data?.id)}
                        >
                          Rechazar
                        </button>
                      </div>
                    )}

                    {(entrevistaConfirmada || entrevistaRechazada) && (
                      <span style={{ fontWeight: 700, color: entrevistaConfirmada ? '#1f7a4d' : '#8a2e2e' }}>
                        {entrevistaConfirmada ? 'Entrevista confirmada' : 'Entrevista rechazada'}
                      </span>
                    )}
                  </div>
                  <span className="chat-burbuja-hora">{formatearHora(m.fecha)}</span>
                </div>
              )
            }

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