import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Loader from '../../components/Loader'
import { usarAuth } from '../../hooks/UsarAuth'
import { obtenerPerfilAdoptantePorSolicitud } from '../../repositories/perfilRefugioRepository'
import '../../styles/perfil.css'

export default function PerfilUsuario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = usarAuth()
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!usuario) {
      navigate('/login')
      return
    }

    let activo = true

    const cargarPerfil = async () => {
      try {
        const { data, error } = await obtenerPerfilAdoptantePorSolicitud(id)
        if (!activo) return

        if (error) {
          console.error(error)
          setPerfil(null)
          return
        }

        setPerfil(data)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarPerfil()
    return () => { activo = false }
  }, [id, usuario, navigate])

  if (cargando) return <Loader />

  const adoptante = perfil?.usuario || {}
  const nombreCompleto = [adoptante.nombre, adoptante.apellido]
    .filter(Boolean)
    .join(' ') || 'Usuario'

  return (
    <div className="pagina-perfil">
      <header className="perfil-header">
        <button type="button" onClick={() => navigate(-1)}>← Volver</button>
      </header>

      <section className="perfil-info" style={{ paddingTop: '0.6rem' }}>
        <div className="perfil-avatar-wrapper">
          <img
            className="perfil-avatar"
            src={adoptante.foto_url || '/assets/img/perfil_default.jpg'}
            alt={nombreCompleto}
          />
        </div>

        <h2>{nombreCompleto}</h2>
        <p style={{ margin: 0, color: '#6d625d', fontWeight: 600 }}>
          {perfil?.mascota?.nombre ? `Solicitante de ${perfil.mascota.nombre}` : 'Perfil del adoptante'}
        </p>

        <h3>Sobre mí</h3>
        <p>{adoptante.biografia || 'Todavía no agregó una descripción.'}</p>
      </section>

      <section className="seccion">
        <h3 className="seccion-titulo">Datos del perfil</h3>

        <div className="tarjeta-postulacion">
          <div className="postulacion-mascota">
            <div>
              <h4>Contacto</h4>
              <p>{adoptante.email || 'Sin email cargado'}</p>
              <p>{adoptante.telefono || 'Sin teléfono cargado'}</p>
            </div>
          </div>
        </div>

        <div className="tarjeta-postulacion">
          <div className="postulacion-mascota">
            <div>
              <h4>Ubicación</h4>
              <p>
                {adoptante.ciudad || 'Ciudad no cargada'}
                {adoptante.provincia ? `, ${adoptante.provincia}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="tarjeta-postulacion">
          <div className="postulacion-mascota">
            <div>
              <h4>Estado de la solicitud</h4>
              <p>
                {perfil?.estado === 'Aprobada'
                  ? 'Aprobada'
                  : perfil?.estado === 'Rechazada'
                    ? 'Rechazada'
                    : 'En revisión'}
              </p>
              {perfil?.fecha_solicitud && (
                <p>
                  Fecha: {new Date(perfil.fecha_solicitud).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
