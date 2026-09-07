import '../styles/mascotaDetalle.css'
import '../styles/perfilRefugio.css'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usarAuth } from '../hooks/UsarAuth'
import Footer from '../components/Footer'
import Loader from '../components/Loader'
import { obtenerMascotaPorId, obtenerOtrasMascotas } from '../repositories/mascotaRepository'
import { obtenerRefugioPorMascota } from '../repositories/refugioRepository'
import { agregarFavorito, eliminarFavorito, esFavorito } from '../repositories/usuarioRepository'

export default function Mascota() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario, esRefugio } = usarAuth()   // ✅ primero obtenemos usuario y esRefugio
  const [mascota, setMascota] = useState(null)
  const [recomendadas, setRecomendadas] = useState([])
    const [refugio, setRefugio] = useState(null)

  const [cargando, setCargando] = useState(true)
  const [favorito, setFavorito] = useState(false)
  const [cargandoFavorito, setCargandoFavorito] = useState(false)

  // ✅ calcular esDueño después de tener usuario y mascota
  const esDueño = esRefugio && usuario && mascota && usuario.id === mascota.refugio_id

  useEffect(() => {
    let activo = true

    const cargar = async () => {
      try {
        const res = await obtenerMascotaPorId(id)
        if (!activo) return

        const mascotaData = res.data || null
        const refugioAnidado = Array.isArray(mascotaData?.refugios)
          ? mascotaData.refugios[0]
          : mascotaData?.refugios || mascotaData?.refugio || null

        setMascota(mascotaData)
        setRefugio(refugioAnidado)

        const refugioId = mascotaData?.refugio_id || refugioAnidado?.id || null

        if (!refugioAnidado?.nombre && refugioId) {
          const refugioRes = await obtenerRefugioPorMascota(id)
          if (!activo) return
          if (refugioRes?.data) {
            setRefugio(refugioRes.data)
          }
        }

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

  // comprobar si la mascota está en guardados cuando tengamos usuario y mascota
  useEffect(() => {
    let vivo = true
    const check = async () => {
      if (!usuario || !mascota) return setFavorito(false)
      try {
        const res = await esFavorito(usuario.id, mascota.id)
        if (!vivo) return
        const existe = Array.isArray(res.data) ? res.data.length > 0 : (res.data ? true : false)
        setFavorito(!!existe)
      } catch (err) {
        setFavorito(false)
      }
    }
    check()
    return () => { vivo = false }
  }, [usuario, mascota])

  if (cargando) return <Loader />
  if (!mascota) return (
    <div className="mascota-pagina vacio">
      <p>Mascota no encontrada.</p>
      <button onClick={() => navigate(-1)}>Volver</button>
    </div>
  )

  const nombreRefugio = Array.isArray(mascota?.refugios)
    ? mascota.refugios[0]?.nombre
    : mascota?.refugios?.nombre || mascota?.refugio?.nombre || refugio?.nombre || '—'

  const handleAplicar = () => {
    if (esRefugio) {
      if (usuario.id === mascota.refugio_id) {
        return navigate(`/refugio/editarMascota/${mascota.id}`)
      }
      return navigate('/refugio/perfil')
    }

    if (!usuario) {
      return navigate('/login')
    }

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
        <button
          className={`btn-fav ${favorito ? 'activo' : ''}`}
          aria-label="Favorito"
          aria-pressed={favorito}
          onClick={async () => {
            if (!usuario) return navigate('/login')
            if (cargandoFavorito) return
            setCargandoFavorito(true)
            try {
              if (favorito) {
                const res = await eliminarFavorito(usuario.id, mascota.id)
                if (res.error) {
                  console.error('Error eliminando favorito:', res.error)
                } else {
                  setFavorito(false)
                }
              } else {
                const res = await agregarFavorito(usuario.id, mascota.id)
                if (res.error) {
                  console.error('Error agregando favorito:', res.error)
                } else {
                  setFavorito(true)
                }
              }
            } catch (err) {
              console.error('Error toggle favorito', err)
            } finally {
              setCargandoFavorito(false)
            }
          }}
        >
          <img
            src={favorito ? '/assets/img/corazon-seleccionado.png' : '/assets/img/corazon.png'}
            alt="Favorito"
          />
        </button>
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
          <div className="atributos">
            <div className="atributo-card">
              <strong>Edad</strong>
              <span>{mascota.edad || '—'}</span>
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
            <button
              type="button"
              onClick={() => refugio?.id && navigate(`/refugio/${refugio.id}`)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#4a7a62',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '1rem',
              }}
            >
              {nombreRefugio}
            </button>
          </div>
        <div className="mascota-pagina">
      <div className="acciones">
        {!esRefugio && (
          <button className="btn-primario" onClick={handleAplicar}>
            Solicitar adopción
          </button>
        )}

        {esDueño && (
          <button className="btn-primario" onClick={() => navigate(`/refugio/editarMascota/${mascota.id}`)}>
            Editar mascota
          </button>
        )}
      </div>

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
                  <img src={r.foto_url || '/assets/img/perfil_default.jpg'} alt={r.nombre} />
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
          <button className="nav-item-refugio" onClick={()=>navigate('/refugio/mismascotas')} >
          <img src="/assets/img/animal.png" alt="Cargar" style={{ width: '24px', height: '24px', opacity: 0.2, filter: "invert(100%)"}} />
          <span>Animales</span>
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
