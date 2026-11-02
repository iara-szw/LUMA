import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Loader from '../../components/Loader'
import { usarAuth } from '../../hooks/UsarAuth'
import { enviarMensaje, obtenerConversacionPorId } from '../../repositories/chatRepository'
import { crearEntrevista } from '../../repositories/entrevistaRepository'
import { Supabase } from '../../services/supabase'
import '../../styles/crearEntrevista.css'

const toSupabaseDateTime = (value) => {
  if (!value) return null

  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return null

  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)

  return new Date(year, month - 1, day, hour, minute).toISOString()
}

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
  const [refugioDireccion, setRefugioDireccion] = useState('')

  useEffect(() => {
    if (!usuario?.id || !esRefugio || !id) {
      navigate('/login')
      return
    }

    let activo = true

    const cargar = async () => {
      try {
        const convRes = await obtenerConversacionPorId(id)
        if (!activo) return

        const conv = convRes?.data || null
        setConversacion(conv)

        if (!conv?.adoptante_id) {
          setError('No se pudo identificar al adoptante de esta conversación.')
          setMascotas([])
          setMascotaId('')
          setCargando(false)
          return
        }

        const { data: solicitudes } = await Supabase
          .from('solicitudes')
          .select('id, mascota_id, mascotas!inner(id, nombre, foto_url, refugio_id)')
          .eq('adoptante_id', conv.adoptante_id)
          .eq('eliminada', false)
          .eq('mascotas.refugio_id', usuario.id)
          .order('fecha_solicitud', { ascending: false })

        const mascotasPermitidas = (solicitudes || [])
          .map(s => s.mascotas)
          .filter(Boolean)
          .filter((m, index, arr) => arr.findIndex(item => String(item.id) === String(m.id)) === index)

        if (!mascotasPermitidas.length) {
          setMascotas([])
          setMascotaId('')
          setError('Este adoptante aún no envió una solicitud para ninguna mascota del refugio.')
          return
        }

        setMascotas(mascotasPermitidas)

        const mascotaPreseleccionada = conv?.mascotas?.id
          ? mascotasPermitidas.find(m => String(m.id) === String(conv.mascotas.id))
          : null

        setMascotaId(mascotaPreseleccionada ? String(mascotaPreseleccionada.id) : String(mascotasPermitidas[0].id))
        setError('')
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
      setError('Seleccioná una mascota con solicitud válida para la entrevista.')
      return
    }

    const mascotaSeleccionada = mascotas.find(m => String(m.id) === String(mascotaId))
    if (!mascotaSeleccionada) {
      setError('La mascota seleccionada no corresponde a una solicitud válida del adoptante.')
      return
    }

    setGuardando(true)
    setError('')

    try {
      const lugarFinal = (
        modalidad === 'En refugio'
          ? (lugar || 'En refugio')
          : (lugar || 'No especificado')
      )

      const payload = {
        solicitud_id: conversacion?.solicitud_id || null,
        adoptante_id: conversacion?.adoptante_id || null,
        refugio_id: conversacion?.refugio_id || usuario.id,
        fecha: toSupabaseDateTime(fecha),
        modalidad,
        lugar: lugarFinal,
        duracion_minutos: 30,
        notas: notas || '',
        estado_confirmacion: 'Pendiente',
        resultado: null,
      }

      const { data: entrevista, error: errorEntrevista } = await crearEntrevista(payload)
      if (errorEntrevista) throw errorEntrevista

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
    <div className="pagina-crear-entrevista">
      <header className="entrevista-header">
        <button className="entrevista-volver" type="button" onClick={() => navigate(-1)} aria-label="Volver">
          ←
        </button>
        <div>
          <h2>Programar entrevista</h2>
          <p>Proponé una entrevista para esta conversación con el adoptante.</p>
        </div>
      </header>

      <form className="entrevista-form" onSubmit={handleSubmit}>
        {error && <div className="entrevista-error">{error}</div>}

        <div className="entrevista-campo">
          <label htmlFor="ent-mascota">Mascota</label>
          <select id="ent-mascota" value={mascotaId} onChange={(e) => setMascotaId(e.target.value)}>
            <option value="">Seleccioná una mascota</option>
            {mascotas.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        <div className="entrevista-campo">
          <label htmlFor="ent-fecha">Fecha y hora</label>
          <input
            id="ent-fecha"
            type="datetime-local"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div className="entrevista-campo">
          <label htmlFor="ent-modalidad">Modalidad</label>
          <select id="ent-modalidad" value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
            <option value="Presencial">Presencial</option>
            <option value="Virtual">Virtual</option>
            <option value="En refugio">En refugio</option>
          </select>
        </div>

        <div className="entrevista-campo">
          <label htmlFor="ent-lugar">Lugar</label>
          <input
            id="ent-lugar"
            type="text"
            value={lugar}
            onChange={(e) => setLugar(e.target.value)}
            placeholder="Dirección o enlace"
          />
        </div>

        <div className="entrevista-campo">
          <label htmlFor="ent-notas">Notas / información adicional</label>
          <textarea
            id="ent-notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={4}
            placeholder="Ej: traer documentación, horario, etc."
          />
        </div>

        <button type="submit" className="entrevista-enviar" disabled={guardando || !mascotaId || mascotas.length === 0}>
          {guardando ? 'Enviando...' : 'Enviar propuesta de entrevista'}
        </button>
      </form>
    </div>
  )
}