import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import '../../styles/formularios.css'
import { obtenerSolicitudFormularioPorId, obtenerFormularioMascota } from '../../repositories/formularioRepository'

export default function SolicitudFormulario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = usarAuth()

  const [cargando, setCargando] = useState(true)
  const [solicitud, setSolicitud] = useState(null)
  const [secciones, setSecciones] = useState([])

  useEffect(() => {
    async function cargar() {
      if (!usuario) {
        navigate('/login')
        return
      }

      setCargando(true)
      const { data, error } = await obtenerSolicitudFormularioPorId(id)

      if (error) {
        alert(error.message)
        setCargando(false)
        return
      }

      setSolicitud(data)

      // Traemos la estructura del formulario de esa mascota para saber
      // en qué sección va cada pregunta y cuál es su título legible.
      if (data?.mascotas?.id) {
        const formularioRes = await obtenerFormularioMascota(data.mascotas.id)
        setSecciones(formularioRes?.data?.bloques || [])
      }

      setCargando(false)
    }

    cargar()
  }, [id, usuario, navigate])

  // Cruzamos cada sección con las respuestas guardadas en info,
  // buscando el valor por el id de cada pregunta.
  const seccionesConRespuestas = useMemo(() => {
    if (!solicitud) return []

    return secciones
      .map(seccion => ({
        ...seccion,
        preguntas: (seccion.preguntas || []).filter(
          pregunta => solicitud.info?.[pregunta.id] !== undefined
        ),
      }))
      .filter(seccion => seccion.preguntas.length > 0)
  }, [secciones, solicitud])

  // Por si alguna respuesta quedó guardada con un id que ya no existe
  // en el formulario actual (por ejemplo, el refugio borró esa pregunta después).
  const idsConSeccion = useMemo(
    () => new Set(seccionesConRespuestas.flatMap(s => s.preguntas.map(p => p.id))),
    [seccionesConRespuestas]
  )

  const respuestasSinSeccion = useMemo(() => {
    if (!solicitud) return []
    return Object.entries(solicitud.info || {}).filter(([key]) => !idsConSeccion.has(key))
  }, [solicitud, idsConSeccion])

  if (cargando) return <Loader />

  const hayRespuestas = seccionesConRespuestas.length > 0 || respuestasSinSeccion.length > 0

  return (
    <div className="pagina-formulario-adopcion">
      <div className="formulario-shell">
        <header className="formulario-topbar">
          <button className="btn-formulario ghost" onClick={() => navigate(-1)}>← Volver</button>
          <strong>Formulario recibido</strong>
        </header>

        <section className="formulario-card">
          <h2>{solicitud?.mascotas?.nombre || 'Solicitud'}</h2>
          <p>El adoptante completó este formulario y la solicitud llegó al refugio.</p>

          {!hayRespuestas ? (
            <div className="solicitud-resumen">
              <div className="solicitud-resumen-item">
                <p>No hay respuestas guardadas todavía.</p>
              </div>
            </div>
          ) : (
            <>
              {seccionesConRespuestas.map((seccion) => (
                <div key={seccion.id} className="formulario-seccion-resumen">
                  <h3>{seccion.titulo}</h3>
                  <div className="solicitud-resumen">
                    {seccion.preguntas.map((pregunta) => (
                      <div key={pregunta.id} className="solicitud-resumen-item">
                        <strong>{pregunta.titulo}</strong>
                        {pregunta.tipo === 'photo' && solicitud.info[pregunta.id] ? (
                          <img
                            src={solicitud.info[pregunta.id]}
                            alt={pregunta.titulo}
                            style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 12, marginTop: 8 }}
                          />
                        ) : (
                          <p>{String(solicitud.info[pregunta.id] || '—')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {respuestasSinSeccion.length > 0 && (
                <div className="formulario-seccion-resumen">
                  <h3>Otras respuestas</h3>
                  <div className="solicitud-resumen">
                    {respuestasSinSeccion.map(([clave, valor]) => (
                      <div key={clave} className="solicitud-resumen-item">
                        <strong>{clave}</strong>
                        <p>{String(valor || '—')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}