import { useEffect, useState } from 'react'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import { Link, useNavigate } from 'react-router-dom'

import { obtenerMascotasDeRefugio } from '../../repositories/perfilRefugioRepository'
import { archivarMascota } from '../../repositories/mascotaRepository'
import '../../styles/misMascotas.css'
import FooterRefugio from '../../components/FooterRefugio'
import ConfirmModal from '../../components/ConfirmModal'

export default function MisMascotas() {
  const { usuario } = usarAuth()
  const navigate = useNavigate()
  const [mascotas, setMascotas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [confirmacion, setConfirmacion] = useState({ isOpen: false, mascotaId: null, nombre: '' })

  const cargarMascotas = async () => {
    if (!usuario) return
    const res = await obtenerMascotasDeRefugio(usuario.id)
    setMascotas(res.data || [])
  }

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

  const handleArchivarMascota = async () => {
    if (!confirmacion.mascotaId) return

    const { error } = await archivarMascota(confirmacion.mascotaId)

    if (!error) {
      setMascotas(prev => prev.filter(m => m.id !== confirmacion.mascotaId))
    }

    setConfirmacion({ isOpen: false, mascotaId: null, nombre: '' })
  }

  if (cargando) return <Loader />

  return (
    <>
      <div className="pagina-mis-mascotas">
        <div className="mis-header">
          <Link to="/" className="dash-logo">
            <img src="/assets/img/logo.png" alt="LUMA" />
          </Link>
          <div className="mis-saludo">Mis mascotas</div>
        </div>

        <div className="mis-filtros">
          <button className="filtro-btn activo">Todas</button>
          <button className="filtro-btn">Activas</button>
          <button className="filtro-btn">Adoptadas</button>
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmacion({
                          isOpen: true,
                          mascotaId: m.id,
                          nombre: m.nombre,
                        })
                      }}
                      className="btn-accion-terciaria"
                    >
                      Archivar
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

      <ConfirmModal
        isOpen={confirmacion.isOpen}
        title="Archivar mascota"
        message={`¿Querés archivar a ${confirmacion.nombre || 'esta mascota'}? No se mostrará en la vista pública.`}
        confirmText="Archivar"
        onConfirm={handleArchivarMascota}
        onCancel={() => setConfirmacion({ isOpen: false, mascotaId: null, nombre: '' })}
      />

      <FooterRefugio />
    </>
  )
}