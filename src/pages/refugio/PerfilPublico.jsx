import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Loader from '../../components/Loader'
import { obtenerMascotasDeRefugio, obtenerRefugio } from '../../repositories/perfilRefugioRepository'
import '../../styles/perfilRefugio.css'

export default function PerfilPublicoRefugio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refugio, setRefugio] = useState(null)
  const [mascotas, setMascotas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    const cargarDatos = async () => {
      try {
        const [refugioRes, mascotasRes] = await Promise.all([
          obtenerRefugio(id),
          obtenerMascotasDeRefugio(id),
        ])

        if (!activo) return

        setRefugio(refugioRes?.data || null)
        setMascotas(mascotasRes?.data || [])
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarDatos()
    return () => { activo = false }
  }, [id])

  if (cargando) return <Loader />

  if (!refugio) {
    return (
      <div className="pagina-perfil-refugio">
        <header className="perfil-refugio-header">
          <button type="button" onClick={() => navigate(-1)}>←</button>
        </header>
        <div className="seccion-refugio" style={{ marginTop: '80px' }}>
          <h3 className="seccion-refugio-titulo">Refugio no encontrado</h3>
          <p className="sobre-nosotros-texto">No pudimos cargar este perfil.</p>
        </div>
      </div>
    )
  }

  const ubicacion = [refugio.ciudad, refugio.provincia].filter(Boolean).join(', ') || refugio.direccion || 'Ubicación no disponible'

  return (
    <div className="pagina-perfil-refugio">
      <header className="perfil-refugio-header">
        <button type="button" onClick={() => navigate(-1)}>←</button>
      </header>

      <div className="perfil-refugio-portada">
        <img
          src={refugio.portada_url || '/assets/img/refugio_default.jpg'}
          alt={refugio.nombre || 'Refugio'}
        />
        <div className="perfil-refugio-avatar">
          <img
            src={refugio.logo_url || '/assets/img/perfil_default.jpg'}
            alt={refugio.nombre || 'Logo del refugio'}
          />
        </div>
      </div>

      <section className="perfil-refugio-info">
        <h2>{refugio.nombre || 'Refugio'}</h2>
        <p className="perfil-refugio-ubicacion">
          📍 {ubicacion}
        </p>
      </section>

      <section className="seccion-refugio">
        <h3 className="seccion-refugio-titulo">Sobre nosotros</h3>
        <p className="sobre-nosotros-texto">
          {refugio.descripcion || 'Este refugio todavía no agregó una descripción.'}
        </p>
      </section>

      <section className="seccion-refugio">
        <h3 className="seccion-refugio-titulo">Mascotas en adopción</h3>
        {mascotas.length === 0 ? (
          <p className="sobre-nosotros-texto">Todavía no publicaron mascotas disponibles.</p>
        ) : (
          <div className="scroll-horizontal-refugio">
            {mascotas.map(m => (
              <article
                key={m.id}
                className="tarjeta-mascota-refugio"
                onClick={() => navigate(`/mascota/${m.id}`)}
              >
                <img src={m.foto_url || '/assets/img/perfil_default.jpg'} alt={m.nombre} />
                <div style={{ padding: '8px 10px' }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#2c2c2a' }}>{m.nombre}</strong>
                  <span style={{ fontSize: '12px', color: '#6b6b68' }}>{m.edad || 'Edad no cargada'}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
