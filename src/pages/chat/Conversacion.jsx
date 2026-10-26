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
import { responderEntrevista, actualizarEntrevista, obtenerEntrevistasPorSolicitud } from '../../repositories/entrevistaRepository'
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
  const [modalResultadoAbierto, setModalResultadoAbierto] = useState(false)
  const [resultadoEntrevistaSeleccionado, setResultadoEntrevistaSeleccionado] = useState('')
  const [guardandoResultadoEntrevista, setGuardandoResultadoEntrevista] = useState(false)
  const [entrevistaActiva, setEntrevistaActiva] = useState(null)
  const [tieneEntrevistaEnCurso, setTieneEntrevistaEnCurso] = useState(false)

  const finRef = useRef(null)
  const channelRef = useRef(null)

  const buscarEntrevistaActiva = async (conv) => {
    if (!conv) return null

    if (conv.solicitud_id) {
      const { data, error } = await obtenerEntrevistasPorSolicitud(conv.solicitud_id)
      if (!error && Array.isArray(data) && data.length > 0) {
        return data
          .filter(e => !!e?.fecha)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0] || null
      }
    }

    if (conv.adoptante_id && conv.refugio_id) {
      const { data, error } = await Supabase
        .from('entrevistas')
        .select('id, fecha, resultado, estado_confirmacion, solicitud_id, adoptante_id, refugio_id')
        .eq('adoptante_id', conv.adoptante_id)
        .eq('refugio_id', conv.refugio_id)
        .order('fecha', { ascending: false })
        .limit(10)

      if (!error && Array.isArray(data) && data.length > 0) {
        return data
          .filter(e => !!e?.fecha)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0] || null
      }
    }

    return null
  }

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

        const entrevistaRelacionada = await buscarEntrevistaActiva(conv)
        if (entrevistaRelacionada) {
          setEntrevistaActiva(entrevistaRelacionada)
          setTieneEntrevistaEnCurso(true)
        } else {
          setEntrevistaActiva(null)
          setTieneEntrevistaEnCurso(false)
        }
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
  }, [conversacionId, usuario?.id, esRefugio, refrescarContador])

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

  const irAlPerfilInterlocutor = () => {
    if (!conversacionData) return
    if (esRefugio) {
      // refugio debe ver el perfil del adoptante
      const solicitudId = conversacionData?.solicitud_id
      if (solicitudId) {
        navigate(`/refugio/solicitud/${solicitudId}/perfil`)
        return
      }

      const adoptanteId = conversacionData?.adoptante_id || conversacionData?.adoptantes?.id || conversacionData?.adoptante?.id
      if (adoptanteId) navigate(`/refugio/adoptante/${adoptanteId}`)
    } else {
      // adoptante debe ver el perfil público del refugio
      const refugioId = conversacionData?.refugio_id || conversacionData?.refugios?.id
      if (refugioId) navigate(`/refugio/${refugioId}`)
    }
  }

  const abrirModalResultado = () => {
    setResultadoEntrevistaSeleccionado('')
    setModalResultadoAbierto(true)
  }

  const cerrarModalResultado = () => {
    setModalResultadoAbierto(false)
    setResultadoEntrevistaSeleccionado('')
  }

  const guardarResultadoEntrevista = async () => {
    const entrevistaId = entrevistaActiva?.id || conversacionData?.solicitud_id
    if (!entrevistaId || !resultadoEntrevistaSeleccionado) return

    setGuardandoResultadoEntrevista(true)
    try {
      const hoy = new Date().toISOString()

      if (resultadoEntrevistaSeleccionado === 'otra_entrevista') {
        const { error } = await actualizarEntrevista(entrevistaId, {
          resultado: 'Otra entrevista programada',
          notas: 'Se programó otra entrevista desde el chat del refugio.',
          fecha_respuesta: hoy,
        })

        if (error) throw error

        setError(null)
        setModalResultadoAbierto(false)
        setResultadoEntrevistaSeleccionado('')
        navigate(`/refugio/chats/${conversacionId}/entrevista`)
        return
      }

      const mapaResultados = {
        no_presento: { texto: 'No se presentó', estado: 'Rechazada' },
        no_resulto: { texto: 'No resultó', estado: 'Rechazada' },
        resulto: { texto: 'Resultó - Adoptado', estado: 'Confirmada' },
      }

      const seleccion = mapaResultados[resultadoEntrevistaSeleccionado]
      const { error } = await actualizarEntrevista(entrevistaId, {
        resultado: seleccion.texto,
        estado_confirmacion: seleccion.estado,
        fecha_respuesta: hoy,
      })

      if (error) throw error

      setEntrevistaActiva(prev => prev ? { ...prev, resultado: seleccion.texto } : prev)
      setError(null)
      setModalResultadoAbierto(false)
      setResultadoEntrevistaSeleccionado('')
    } catch (err) {
      console.error('Error guardando resultado de entrevista:', err)
      setError('No se pudo guardar el resultado de la entrevista.')
    } finally {
      setGuardandoResultadoEntrevista(false)
    }
  }

  // Abrir el modal automáticamente si la entrevista ya pasó
  useEffect(() => {
    if (!esRefugio || !conversacionData?.solicitud_id || !entrevistaActiva) return
    if (new Date(entrevistaActiva.fecha) <= new Date()) {
      setModalResultadoAbierto(false)
    }
  }, [esRefugio, conversacionData?.solicitud_id, entrevistaActiva])

  return (
    <div className="chat-pagina">
      <header className="chat-header">
        <button className="chat-btn-volver" onClick={() => navigate(-1)} aria-label="Volver">←</button>

        <img
          className="chat-header-avatar"
          src={interlocutorAvatar || '/assets/img/perfil_default.jpg'}
          alt={nombreInterlocutor}
          onClick={irAlPerfilInterlocutor}
        />

        <div className="chat-header-info">
          <h2 className="chat-titulo">{nombreInterlocutor}</h2>
          {mascota?.nombre && <span className="chat-subtitulo">Por {mascota.nombre}</span>}
        </div>

        {esRefugio && (
          <button
            type="button"
            className="chat-btn-entrevista"
            onClick={() => navigate(`/refugio/chats/${conversacionId}/entrevista`)}
          >
            Programar entrevista
          </button>
        )}

        {esRefugio && tieneEntrevistaEnCurso && (
          <button
            type="button"
            className="chat-btn-entrevista chat-btn-entrevista--resultado"
            onClick={abrirModalResultado}
          >
            Resultado
          </button>
        )}
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

              const estadoEntrevista = entrevistaConfirmada ? 'confirmada' : entrevistaRechazada ? 'rechazada' : 'pendiente'
              const textoEstado = { confirmada: 'Confirmada', rechazada: 'Rechazada', pendiente: 'Pendiente' }[estadoEntrevista]

              return (
                <div
                  key={m.id}
                  className={`chat-entrevista ${esPropio ? 'chat-entrevista--propia' : 'chat-entrevista--ajena'}`}
                >
                  <div className="chat-entrevista-cabecera">
                    <strong className="chat-entrevista-titulo">
                      {esPropio ? 'Propuesta de entrevista' : 'Entrevista propuesta'}
                    </strong>
                    <span className={`chat-entrevista-estado chat-entrevista-estado--${estadoEntrevista}`}>
                      {textoEstado}
                    </span>
                  </div>

                  <dl className="chat-entrevista-datos">
                    <div className="chat-entrevista-fila">
                      <dt>Mascota</dt>
                      <dd>{data?.mascota || '—'}</dd>
                    </div>
                    <div className="chat-entrevista-fila">
                      <dt>Fecha</dt>
                      <dd>
                        {new Date(data?.fecha || Date.now()).toLocaleString('es-AR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </dd>
                    </div>
                    <div className="chat-entrevista-fila">
                      <dt>Modalidad</dt>
                      <dd>{data?.modalidad || '—'}</dd>
                    </div>
                    <div className="chat-entrevista-fila">
                      <dt>Lugar</dt>
                      <dd>{data?.lugar || 'No especificado'}</dd>
                    </div>
                    {data?.notas && (
                      <div className="chat-entrevista-fila">
                        <dt>Notas</dt>
                        <dd>{data.notas}</dd>
                      </div>
                    )}
                    {data?.resultado && (
                      <div className="chat-entrevista-fila">
                        <dt>Resultado</dt>
                        <dd>{data.resultado}</dd>
                      </div>
                    )}
                  </dl>

                  {!esPropio && estadoEntrevista === 'pendiente' && (
                    <div className="chat-entrevista-acciones">
                      <button
                        type="button"
                        className="chat-entrevista-btn chat-entrevista-btn--aceptar"
                        disabled={respondiendoEntrevista}
                        onClick={() => handleAceptarEntrevista(m.id, data?.id)}
                      >
                        Aceptar
                      </button>
                      <button
                        type="button"
                        className="chat-entrevista-btn chat-entrevista-btn--rechazar"
                        disabled={respondiendoEntrevista}
                        onClick={() => handleRechazarEntrevista(m.id, data?.id)}
                      >
                        Rechazar
                      </button>
                    </div>
                  )}

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

      {modalResultadoAbierto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20,
          }}
          onClick={cerrarModalResultado}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
              padding: 24,
              border: '1px solid #e5e7eb',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 22, color: '#1f2937' }}>¿Cómo fue la entrevista?</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {/*
                { value: 'no_presento', label: 'No se presentó' },
                { value: 'no_resulto', label: 'No resultó' },
                { value: 'resulto', label: 'Resultó (Adoptado el animal)' },
                { value: 'otra_entrevista', label: 'Otra entrevista (programar otra entrevista)' },
              */}
              {['no_presento', 'no_resulto', 'resulto', 'otra_entrevista'].map(value => {
                let label = ''
                if (value === 'no_presento') label = 'No se presentó'
                if (value === 'no_resulto') label = 'No resultó'
                if (value === 'resulto') label = 'Resultó (Adoptado el animal)'
                if (value === 'otra_entrevista') label = 'Otra entrevista (programar otra entrevista)'

                return (
                  <label
                    key={value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      background: resultadoEntrevistaSeleccionado === value ? '#f5efe8' : '#fff',
                    }}
                  >
                    <input
                      type="radio"
                      name="resultadoEntrevista"
                      value={value}
                      checked={resultadoEntrevistaSeleccionado === value}
                      onChange={(e) => setResultadoEntrevistaSeleccionado(e.target.value)}
                    />
                    <span style={{ color: '#374151', fontWeight: 600 }}>{label}</span>
                  </label>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={cerrarModalResultado}
                style={{
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  color: '#374151',
                  borderRadius: 10,
                  padding: '10px 16px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarResultadoEntrevista}
                disabled={!resultadoEntrevistaSeleccionado || guardandoResultadoEntrevista}
                style={{
                  border: 'none',
                  background: resultadoEntrevistaSeleccionado ? '#9CA986' : '#d1d5db',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '10px 16px',
                  cursor: resultadoEntrevistaSeleccionado ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                }}
              >
                {guardandoResultadoEntrevista ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}