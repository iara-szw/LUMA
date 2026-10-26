import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Loader from '../../components/Loader'
import { usarAuth } from '../../hooks/UsarAuth'
import { enviarMensaje, obtenerConversacionPorId } from '../../repositories/chatRepository'
import { obtenerMascotasDeRefugio, obtenerRefugio } from '../../repositories/perfilRefugioRepository'
import { crearEntrevista } from '../../repositories/entrevistaRepository'
import '../../styles/crearEntrevista.css'

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
        const [convRes, mascotasRes, refugioRes] = await Promise.all([
          obtenerConversacionPorId(id),
          obtenerMascotasDeRefugio(usuario.id),
          obtenerRefugio(usuario.id),
        ])

        if (!activo) return

        const conv = convRes?.data || null
        setConversacion(conv)
        const direccionRefugio = refugioRes?.data?.direccion || [refugioRes?.data?.ciudad, refugioRes?.data?.provincia].filter(Boolean).join(', ') || 'Refugio'
        setRefugioDireccion(direccionRefugio)

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
      const lugarFinal = (
        modalidad === 'En refugio'
          ? (lugar || refugioDireccion || 'En refugio')
          : (lugar || 'No especificado')
      )

      const payload = {
        solicitud_id: conversacion?.solicitud_id || null,
        adoptante_id: conversacion?.adoptante_id || null,
        refugio_id: conversacion?.refugio_id || usuario.id,
        fecha: new Date(fecha).toISOString(),
        modalidad,
        lugar: lugarFinal,
        duracion_minutos: 30,
        notas: notas || '',
        estado_confirmacion: 'Pendiente',
        resultado: null,
      }

      const { data: entrevista, error: errorEntrevista } = await crearEntrevista(payload)
      if (errorEntrevista) throw errorEntrevista

      const mascotaSeleccionada = mascotas.find(m => String(m.id) === String(mascotaId))

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

        <button type="submit" className="entrevista-enviar" disabled={guardando}>
          {guardando ? 'Enviando...' : 'Enviar propuesta de entrevista'}
        </button>
      </form>
    </div>
  )
}