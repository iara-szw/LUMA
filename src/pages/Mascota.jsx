import '../styles/mascotaDetalle.css'
import '../styles/perfilRefugio.css'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usarAuth } from '../hooks/UsarAuth'
import Footer from '../components/Footer'
import Loader from '../components/Loader'
import { obtenerMascotaPorId, obtenerOtrasMascotas } from '../repositories/mascotaRepository'

export default function Mascota() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario, esRefugio } = usarAuth()
  const [mascota, setMascota] = useState(null)
  const [recomendadas, setRecomendadas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    const cargar = async () => {
      try {
        const res = await obtenerMascotaPorId(id)
        if (!activo) return
        setMascota(res.data || null)

        const refugioId = res.data?.refugio_id || res.data?.refugios?.id
        const otras = await obtenerOtrasMascotas(id, refugioId, 6)
        if (!activo) return
        setRecomendadas(otras.data || [])
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => { activo = false }
  }, [id])

  if (cargando) return <Loader />
  if (!mascota) return (
    <div className="mascota-pagina vacio">
      <p>Mascota no encontrada.</p>
      <button onClick={() => navigate(-1)}>Volver</button>
    </div>
  )

  const handleAplicar = () => {
    if (esRefugio) {
      return navigate('/refugio/perfil')
    }

    if (!usuario) return navigate('/login')
    // Mock apply flow: navigate to a placeholder form or show modal
    navigate(`/adoptante/solicitud/${mascota.id}`)
  }

  return (
    <div className="mascota-pagina">
      <header
        className="mascota-hero"
        style={{
          backgroundImage: mascota.foto_url ? `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.04)), url(${mascota.foto_url})` : undefined,
        }}
      >
        <button className="btn-back" onClick={() => navigate(-1)}>←</button>
        <button className="btn-fav" aria-label="Favorito">★</button>
      </header>

      <main className="mascota-contenido">
        <section className="perfil">
          <div className="perfil-encabezado">
            <h1>{mascota.nombre}</h1>
            <div className="badges">
              {mascota.sexo && <span className="badge sexo">{mascota.sexo}</span>}
              {mascota.urgente && <span className="badge urgente">Urgente</span>}
            </div>
          </div>
          <div className="meta">
            {mascota.edad && <span>{mascota.edad}</span>}
            {mascota.tamaño && <span>{mascota.tamaño}</span>}
            {mascota.peso && <span>{mascota.peso} kg</span>}
          </div>

          <div className="atributos">
            <div className="atributo-card">
              <strong>Peso</strong>
              <span>{mascota.peso || '—'}</span>
            </div>
            <div className="atributo-card">
              <strong>Tamaño</strong>
              <span>{mascota.tamaño || '—'}</span>
            </div>
            <div className="atributo-card">
              <strong>Actividad</strong>
              <span>{mascota.actividad || 'Moderada'}</span>
            </div>
          </div>

          <div className="sobre">
            <h3>Sobre mí</h3>
            <p>{mascota.descripcion || 'No hay descripción disponible.'}</p>
          </div>

          <div className="salud">
            <h4>Salud</h4>
            <div className="salud-badges">
              <span className={mascota.vacunado ? 'badge ok' : 'badge no'}>Vacunado</span>
              <span className={mascota.desparasitado ? 'badge ok' : 'badge no'}>Desparasitado</span>
              <span className={mascota.castrado ? 'badge ok' : 'badge no'}>Castrado</span>
            </div>
          </div>

          <div className="refugio">
            <h4>Refugio</h4>
            <p>{mascota.refugios?.nombre || mascota.refugio_nombre || '—'}</p>
          </div>

          <div className="acciones">
            <button className="btn-primario" onClick={handleAplicar}>
              {esRefugio ? 'Editar perfil' : 'Solicitar adopción'}
            </button>
          </div>
        </section>

        <aside className="recomendadas">
          <h3>Otras mascotas del refugio</h3>
          <div className="scroll-horizontal recomendaciones">
            {recomendadas.length === 0 ? (
              <p className="vacio">No hay recomendaciones.</p>
            ) : (
              recomendadas.map(r => (
                <article key={r.id} className="tarjeta-mascota" onClick={() => navigate(`/mascota/${r.id}`)}>
                  {r.foto_url && <img src={r.foto_url} alt={r.nombre} />}
                  <h4>{r.nombre}</h4>
                  {r.edad && <span>{r.edad}</span>}
                  {r.urgente && <span className="badge-urgente">Urgente</span>}
                </article>
              ))
            )}
          </div>
        </aside>
      </main>

      {esRefugio ? (
        <nav className="bottom-nav-refugio">
          <button className="nav-item-refugio" onClick={() => navigate('/refugio/dashboard')}>
            <img src="/assets/img/home.png" alt="Inicio" />
            <span>Inicio</span>
          </button>
          <button className="nav-item-refugio" onClick={() => navigate('/refugio/cargarMascota')}>
            <img src="/assets/img/white-paw.png" alt="Cargar" style={{ width: '24px', height: '24px', opacity: 0.7 }} />
            <span>Cargar</span>
          </button>
          <button className="nav-item-refugio" onClick={() => navigate('/refugio/solicitudes')}>
            <img src="/assets/img/solicitudes.png" alt="Solicitudes" />
            <span>Solicitudes</span>
          </button>
          <button className="nav-item-refugio activo" onClick={() => navigate('/refugio/perfil')}>
            <img src="/assets/img/perfil.png" alt="Perfil" />
            <span>Perfil</span>
          </button>
        </nav>
      ) : (
        <Footer />
      )}
    </div>
  )
}
