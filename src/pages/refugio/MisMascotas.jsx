import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import { Link } from 'react-router-dom'

import { obtenerMascotasDeRefugio } from '../../repositories/perfilRefugioRepository'
import '../../styles/misMascotas.css'

export default function MisMascotas() {
  const { usuario } = usarAuth()
  const navigate = useNavigate()
  const [mascotas, setMascotas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!usuario) return
    let activo = true
    const cargar = async () => {
      try {
        const res = await obtenerMascotasDeRefugio(usuario.id)
        if (!activo) return
        setMascotas(res.data || [])
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [usuario])

  if (cargando) return <Loader />

  return (
    <>
    <div className="pagina-mis-mascotas">
      <div className="mis-header">
        <div className="mis-header-inner">
<Link to="/" className="logo">
  <img src="/assets/img/logo.png" alt="Logo" />
</Link>          {usuario?.foto_url ? (
            <img className="mis-avatar" src={usuario.foto_url} alt={usuario.nombre} />
          ) : (
            <div className="mis-avatar-placeholder">🐾</div>
          )}
        </div>
        <div className="mis-saludo">Mis mascotas</div>
              <div className="mis-filtros">
        <button className="filtro-btn activo">Todas </button>
        <button className="filtro-btn">Activas</button>
        <button className="filtro-btn">Adoptadas</button>
      </div>
      </div>



      <div className="lista-mascotas-refugio">
        {mascotas.length === 0 ? (
          <p>No tenés mascotas publicadas.</p>
        ) : (
          mascotas.map(m => (
            <article
              key={m.id}
              className="tarjeta-mascota-refugio tarjeta-mascota-clickeable"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/refugio/mascota/${m.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/refugio/mascota/${m.id}`)
                }
              }}
            >
              <div className="foto-mascota">
                {m.foto_url ? (
                  <img src={m.foto_url} alt={m.nombre} />
                ) : (
                  <div className="placeholder-mascota">🐶</div>
                )}
              </div>

              <div className="datos-mascota">
                <h3>{m.nombre}</h3>
                <p>Edad: {m.edad || 'N/D'}</p>
                <div className="acciones-mascota">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/refugio/mascota/${m.id}/postulaciones`)
                    }}
                    className="btn-accion-primaria"
                  >
                    Ver postulaciones
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/refugio/editarFormulario/${m.id}`)
                    }}
                    className="btn-accion-secundaria"
                  >
                    Editar form
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
    <nav className="bottom-nav-refugio">
        <button className="nav-item-refugio " onClick={() => navigate('/refugio/dashboard')}>
          <img src="/assets/img/home.png" alt="Inicio" />
          <span>Inicio</span>
        </button>
        <button className="nav-item-refugio activo" onClick={()=>navigate('/refugio/mismascotas')} >
          <img src="/assets/img/animal.png" alt="Cargar" style={{ width: '24px', height: '24px', opacity: 0.2, filter: "invert(100%)"}} />
          <span>Animales</span>
        </button>
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/solicitudes')}>
          <img src="/assets/img/solicitudes.png" alt="Solicitudes" />
          <span>Solicitudes</span>
        </button>
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/perfil')}>
          <img src="/assets/img/perfil.png" alt="Perfil" /> 
          <span>Perfil</span>
        </button>
      </nav>
    </>
  )
}