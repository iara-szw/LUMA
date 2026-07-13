import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import '../../styles/formularios.css'
import { obtenerSolicitudFormularioPorId,obtenerInfo } from '../../repositories/formularioRepository'

export default function SolicitudFormulario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = usarAuth()

  const [cargando, setCargando] = useState(true)
  const [solicitud, setSolicitud] = useState(null)

  useEffect(() => {
    async function cargar() {
      if (!usuario) {
        navigate('/login')
        return
      }

      setCargando(true)
      const { data, error } = await obtenerSolicitudFormularioPorId(id)
      console.log(data)

      if (error) {
        alert(error.message)
        setCargando(false)
        return
      }

      setSolicitud(data)
      setCargando(false)
    }

    cargar()
  }, [id, usuario, navigate])

  const respuestas = useMemo(() => Object.entries(solicitud?.respuestas || {}), [solicitud])

  if (cargando) return <Loader />

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

          <div className="solicitud-resumen">
            {respuestas.length === 0 ? (
              <div className="solicitud-resumen-item">
                <p>No hay respuestas guardadas todavía.</p>
              </div>
            ) : (
              respuestas.map(([bloque, valor]) => (
                <div key={bloque} className="solicitud-resumen-item">
                  <strong>{bloque}</strong>
                  <p>{String(valor || '—')}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
