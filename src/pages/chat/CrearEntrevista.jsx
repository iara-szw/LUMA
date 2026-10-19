import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Loader from '../../components/Loader'
import { usarAuth } from '../../hooks/UsarAuth'
import { enviarMensaje, obtenerConversacionPorId } from '../../repositories/chatRepository'
import { obtenerMascotasDeRefugio } from '../../repositories/perfilRefugioRepository'
import { crearEntrevista } from '../../repositories/entrevistaRepository'

export default function CrearEntrevista() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario, esRefugio } = usarAuth()

  const [conversacion, setConversacion] = useState(null)
  const [mascotas, setMascotas] = useState([])
  const [mascotaId, setMascotaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [modalidad, setModalidad] = useState('Presencial')
  const [lugar, setLugar] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!usuario?.id || !esRefugio || !id) {
      navigate('/login')
      return
    }

    let activo = true

    const cargar = async () => {
      try {
        const [convRes, mascotasRes] = await Promise.all([
          obtenerConversacionPorId(id),
          obtenerMascotasDeRefugio(usuario.id),
        ])

        if (!activo) return

        const conv = convRes?.data || null
        setConversacion(conv)

        if (conv?.mascotas?.id) {
          setMascotaId(String(conv.mascotas.id))
        }

        if (mascotasRes?.data?.length) {
          setMascotas(mascotasRes.data)
          if (!conv?.mascotas?.id) {
            setMascotaId(String(mascotasRes.data[0].id))
          }
        }
      } catch (e) {
        console.error(e)
        setError('No se pudo cargar la conversación.')
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => { activo = false }
  }, [id, usuario?.id, esRefugio, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!fecha || !mascotaId) {
      setError('Seleccioná una mascota y una fecha para la entrevista.')
      return
    }

    setGuardando(true)
    setError('')

    try {
      const payload = {
        solicitud_id: conversacion?.solicitud_id || null,
        adoptante_id: conversacion?.adoptante_id || null,
        refugio_id: conversacion?.refugio_id || usuario.id,
        fecha: new Date(fecha).toISOString(),
        modalidad,
        lugar: lugar || 'No especificado',
        duracion_minutos: 30,
        notas: notas || '',
        estado_confirmacion: 'Pendiente',
        resultado: null,
      }

      const { data: entrevista, error: errorEntrevista } = await crearEntrevista(payload)
      if (errorEntrevista) throw errorEntrevista

      const mascotaSeleccionada = mascotas.find(m => String(m.id) === String(mascotaId))
      const fechaFormateada = new Date(fecha).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

      const msj = '__ENTREVISTA__' + JSON.stringify({
        id: entrevista?.id,
        mascota: mascotaSeleccionada?.nombre || 'mascota',
        fecha: payload.fecha,
        modalidad,
        lugar: payload.lugar,
        notas: payload.notas || '',
      })

      const { error: errorMensaje } = await enviarMensaje(id, usuario.id, msj)
      if (errorMensaje) throw errorMensaje

      navigate(`/refugio/chats/${id}`)
    } catch (e) {
      console.error(e)
      setError('No se pudo crear la entrevista. Revisá los datos e intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <Loader />

  return (
    <div className="pagina-formulario-adopcion" style={{ paddingBottom: 32 }}>
      <div className="formulario-shell">
        <header className="formulario-topbar">
          <button className="btn-formulario-volver" type="button" onClick={() => navigate(-1)}>← Volver</button>
        </header>

        <section className="formulario-card" style={{ maxWidth: 720, margin: '20px auto' }}>
          <h2>Programar entrevista</h2>
          <p style={{ color: '#5d5d58', marginTop: 4 }}>
            Proponé una entrevista para esta conversación con el adoptante.
          </p>

          {error && (
            <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: '#fdf2f2', color: '#8a2e2e' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 18 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Mascota</label>
              <select value={mascotaId} onChange={(e) => setMascotaId(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d5d2cc' }}>
                <option value="">Seleccioná una mascota</option>
                {mascotas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Fecha y hora</label>
              <input
                type="datetime-local"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d5d2cc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Modalidad</label>
              <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d5d2cc' }}>
                <option value="Presencial">Presencial</option>
                <option value="Virtual">Virtual</option>
                <option value="En refugio">En refugio</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Lugar</label>
              <input
                type="text"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                placeholder="Dirección o enlace"
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d5d2cc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Notas / información adicional</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={4}
                placeholder="Ej: traer documentación, horario, etc."
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d5d2cc', resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="btn-formulario" disabled={guardando}>
              {guardando ? 'Enviando...' : 'Enviar propuesta de entrevista'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
