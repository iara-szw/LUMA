import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import { Link } from 'react-router-dom'

import { obtenerMascotasDeRefugio } from '../../repositories/perfilRefugioRepository'
import '../../styles/misMascotas.css'
import FooterRefugio from '../../components/FooterRefugio'

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
        <button className="agregar" onClick={() => navigate('/refugio/cargarMascota')}>
          <span className="dash-accion-icono">+</span>
        </button>
      </div>
    </div>
    <FooterRefugio />
    </>
  )
}