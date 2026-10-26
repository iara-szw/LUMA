import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usarAuth } from '../hooks/UsarAuth'
import { obtenerEntrevistaPorId } from '../repositories/entrevistaRepository'
import { registrarRecordatorio, quitarRecordatorio, estaRecordado } from '../services/recordatorios'
import Footer from '../components/Footer'
import '../styles/detalleEvento.css'

export default function DetalleEntrevista() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = usarAuth()

  const [entrevista, setEntrevista] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [recordarme, setRecordarme] = useState(false)

  useEffect(() => {
    let activo = true

    const obtenerDatos = async () => {
      const { data, error } = await obtenerEntrevistaPorId(id)
      if (!activo) return
      if (error) setError(error)
      else setEntrevista(data)
      setCargando(false)
    }

    if (id) obtenerDatos()
    return () => { activo = false }
  }, [id])

  useEffect(() => {
    if (!usuario?.id || !entrevista?.id) return
    setRecordarme(estaRecordado({ usuarioId: usuario.id, tipo: 'entrevista', itemId: entrevista.id }))
  }, [usuario, entrevista])

  const handleRecordarme = () => {
    if (!usuario?.id || !entrevista?.id || !entrevista?.fecha) return

    if (recordarme) {
      quitarRecordatorio({ usuarioId: usuario.id, tipo: 'entrevista', itemId: entrevista.id })
      setRecordarme(false)
      return
    }

    registrarRecordatorio({
      usuarioId: usuario.id,
      tipo: 'entrevista',
      itemId: entrevista.id,
      titulo: `Entrevista · ${entrevista.solicitudes?.mascotas?.nombre || 'Mascota'}`,
      fecha: new Date(new Date(entrevista.fecha).getTime() - 24 * 60 * 60 * 1000).toISOString(),
      link: `/entrevistas/${entrevista.id}`,
    })
    setRecordarme(true)
  }

  if (cargando) {
    return <p className="det-evento-vacio">Cargando entrevista...</p>
  }

  if (error || !entrevista) {
    return (
      <div className="det-evento-pagina">
        <header className="det-evento-header">
          <button className="det-evento-volver" aria-label="Volver" onClick={() => navigate(-1)}>←</button>
        </header>
        <p className="det-evento-vacio">No pudimos encontrar esta entrevista.</p>
      </div>
    )
  }

  const fecha = new Date(entrevista.fecha)
  const fechaFormateada = fecha.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  const mascota = entrevista.solicitudes?.mascotas || null
  const refugio = mascota?.refugios || entrevista.refugios || null

  return (
    <div className="det-evento-pagina">
      <header className="det-evento-header">
        <button className="det-evento-volver" aria-label="Volver" onClick={() => navigate(-1)}>←</button>
      </header>

      {mascota?.foto_url ? (
        <img className="det-evento-imagen" src={mascota.foto_url} alt={mascota.nombre} />
      ) : (
        <div className="det-evento-imagen det-evento-imagen--placeholder" />
      )}

      <div className="det-evento-contenido">
        <h1 className="det-evento-titulo">Entrevista · {mascota?.nombre || 'Mascota'}</h1>

        {refugio?.nombre && (
          <p className="det-evento-refugio">{refugio.nombre}</p>
        )}

        <div className="det-evento-dato">
          <span className="det-evento-dato-icono">📅</span>
          <span className="det-evento-dato-texto">
            {fechaFormateada} · {hora}
          </span>
        </div>

        {entrevista.modalidad && (
          <div className="det-evento-dato">
            <span className="det-evento-dato-icono">🧭</span>
            <span className="det-evento-dato-texto">{entrevista.modalidad}</span>
          </div>
        )}

        {entrevista.lugar && (
          <div className="det-evento-dato">
            <span className="det-evento-dato-icono">📍</span>
            <span className="det-evento-dato-texto">{entrevista.lugar}</span>
          </div>
        )}

        {entrevista.estado_confirmacion && (
          <div className="det-evento-dato">
            <span className="det-evento-dato-icono">✅</span>
            <span className="det-evento-dato-texto">Estado: {entrevista.estado_confirmacion}</span>
          </div>
        )}

        {(entrevista.notas || entrevista.resultado) && (
          <section className="det-evento-seccion">
            <h3>Detalles</h3>
            {entrevista.notas && <p>{entrevista.notas}</p>}
            {entrevista.resultado && <p><strong>Resultado:</strong> {entrevista.resultado}</p>}
          </section>
        )}

        <button type="button" className="btn-formulario" onClick={handleRecordarme}>
          {recordarme ? 'Recordarme activado' : 'Recordarme'}
        </button>
      </div>

      <Footer />
    </div>
  )
}
