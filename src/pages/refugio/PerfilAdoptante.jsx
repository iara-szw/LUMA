import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Loader from '../../components/Loader'
import { obtenerPerfilAdoptantePorId } from '../../repositories/perfilRefugioRepository'
import '../../styles/perfilRefugio.css'

export default function PerfilAdoptante() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      const { data, error } = await obtenerPerfilAdoptantePorId(id)
      if (!activo) return
      if (error) {
        console.error(error)
        setPerfil(null)
      } else {
        setPerfil(data?.usuario || null)
      }
      setCargando(false)
    }
    if (id) cargar()
    return () => { activo = false }
  }, [id])

  if (cargando) return <Loader />
  if (!perfil) return (
    <div className="pagina-perfil-refugio">
      <header className="perfil-refugio-header">
        <button onClick={() => navigate(-1)}>←</button>
      </header>
      <div style={{ padding: '1rem' }}>
        <h3>Usuario no encontrado</h3>
      </div>
    </div>
  )

  const nombreCompleto = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Usuario'

  return (
    <div className="pagina-perfil-refugio">
      <header className="perfil-refugio-header">
        <button onClick={() => navigate(-1)}>←</button>
      </header>

      <section className="perfil-info" style={{ paddingTop: '0.6rem' }}>
        <div className="perfil-avatar-wrapper">
          <img
            className="perfil-avatar"
            src={perfil.foto_url || '/assets/img/perfil_default.jpg'}
            alt={nombreCompleto}
          />
        </div>

        <h2>{nombreCompleto}</h2>
        <h3>Sobre mí</h3>
        <p>{perfil.biografia || 'Todavía no agregó una descripción.'}</p>
      </section>

      <section className="seccion-refugio">
        <h3 className="seccion-refugio-titulo">Contacto</h3>
        <p>{perfil.email || 'Sin email cargado'}</p>
        <p>{perfil.telefono || 'Sin teléfono cargado'}</p>
      </section>

    </div>
  )
}
