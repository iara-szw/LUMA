import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import {
  obtenerMascotasDeRefugio,
  obtenerSolicitudesDeRefugio,
  obtenerEstadisticasDeRefugio,
  obtenerRefugio,
} from '../../repositories/perfilRefugioRepository'
import '../../styles/perfilRefugio.css'

export default function Perfil() {
  const navigate = useNavigate()
  const { usuario, cerrarSesion, cargando } = usarAuth()
  const [mascotas, setMascotas] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [stats, setStats] = useState({ mascotas: 0, voluntarios: 0, adopciones: 0, eventos: 0 })
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [refugio, setRefugio] = useState(null)

  useEffect(() => {
    if (!usuario) return

    let activo = true

    const obtenerDatos = async () => {
      try {
        const [refugioRes, mascotasRes, solicitudesRes, statsRes] = await Promise.all([
          obtenerRefugio(usuario.id),
          obtenerMascotasDeRefugio(usuario.id),
          obtenerSolicitudesDeRefugio(usuario.id),
          obtenerEstadisticasDeRefugio(usuario.id),
        ])

        if (!activo) return
        setRefugio(refugioRes?.data || null)
        setMascotas(mascotasRes?.data || [])
        setSolicitudes(solicitudesRes?.data || [])
        setStats(statsRes?.data || { mascotas: 0, voluntarios: 0, adopciones: 0, eventos: 0 })
      } finally {
        if (activo) setCargandoDatos(false)
      }
    }

    obtenerDatos()
    return () => { activo = false }
  }, [usuario])

  useEffect(() => {
    if (!cargando && !usuario) {
      navigate('/login')
    }
  }, [cargando, usuario])

  if (cargando || (usuario && cargandoDatos)) return <Loader />

  return (
    <div className="pagina-perfil-refugio">

      {/* Header flotante sobre la foto */}
      <header className="perfil-refugio-header">
        <button onClick={() => navigate(-1)} aria-label="Volver">←</button>
        <div className="perfil-refugio-header-iconos">
          <button aria-label="Notificaciones" onClick={() => navigate('/refugio/dashboard')}>
            <img src="/assets/img/notificaciones.png" alt="" />
          </button>
          <button aria-label="Configuración" onClick={() => navigate('/refugio/editarRefugio')}>
            <img src="/assets/img/configurar.png" alt="" />
          </button>
        </div>
      </header>

      {/* Foto de portada + avatar superpuesto */}
      <div className="perfil-refugio-portada">
        <img
          src={(refugio && refugio.portada_url) || usuario.foto_portada_url || '/assets/img/refugio_default.jpg'}
          alt={refugio?.nombre || usuario.nombre}
        />
        
      </div>

      {/* Nombre y ubicación */}
      <section className="perfil-refugio-info">
        <h2>{refugio?.nombre || usuario.nombre}</h2>
        {(refugio?.direccion || usuario.direccion) && (
          <p className="perfil-refugio-ubicacion">
            <img src="/assets/img/ubicacion.png" alt="" />
            {refugio?.direccion || usuario.direccion}
          </p>
        )}
      </section>

      {/* Resumen general */}
      <section className="seccion-refugio">
        <div className="resumen-header">
          <h3>Resumen general</h3>
          <span className="resumen-periodo">Hoy</span>
        </div>
        <div className="resumen-grid">
          <div className="resumen-stat">
            <p className="resumen-stat-valor">{stats.mascotas}</p>
            <p className="resumen-stat-label">Mascotas</p>
          </div>
          <div className="resumen-stat">
            <p className="resumen-stat-valor">{stats.voluntarios}</p>
            <p className="resumen-stat-label">Voluntarios</p>
          </div>
          <div className="resumen-stat">
            <p className="resumen-stat-valor">{stats.adopciones}</p>
            <p className="resumen-stat-label">Adopciones</p>
          </div>
          <div className="resumen-stat">
            <p className="resumen-stat-valor">{stats.eventos}</p>
            <p className="resumen-stat-label">Eventos</p>
          </div>
        </div>
      </section>

      {/* Sobre nosotros */}
      <section className="seccion-refugio">
        <h3 className="seccion-refugio-titulo">Sobre nosotros</h3>
        <p className="sobre-nosotros-texto">
          {refugio?.descripcion || usuario?.descripcion || 'Sin descripción todavía.'}
        </p>
      </section>

      {/* Mascotas en adopción */}
      <section className="seccion-refugio">
        <h3 className="seccion-refugio-titulo">Mascotas en adopción</h3>
        {mascotas.length === 0 ? (
          <p className="vacio-refugio">No hay mascotas publicadas aún.</p>
        ) : (
          <div className="scroll-horizontal-refugio">
            {mascotas.map(m => (
              <article
                key={m.id}
                className="tarjeta-mascota-refugio"
                onClick={() => navigate(`/refugio/mascota/${m.id}`)}
              >
                {m.foto_url && (
                  <img src={m.foto_url} alt={m.nombre} />
                )}
                <div className="tarjeta-mascota-refugio-info">
                  <h4>{m.nombre}</h4>
                  <p>{m.especies?.nombre || m.especie}</p>
                  {m.urgente && (
                    <span className="badge-urgente-refugio">Urgente</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Solicitudes recientes */}
      <section className="seccion-refugio">
        <h3 className="seccion-refugio-titulo">Solicitudes recientes</h3>
        {solicitudes.length === 0 ? (
          <p className="vacio-refugio">No hay solicitudes todavía.</p>
        ) : (
          <div className="lista-solicitudes">
            {solicitudes.slice(0, 5).map(s => (
              <article
                key={s.id}
                className="tarjeta-solicitud"
                onClick={() => navigate(`/refugio/solicitud/${s.id}`)}
              >
                {s.usuarios?.foto_url ? (
                  <img src={s.usuarios.foto_url} alt={s.usuarios.nombre} />
                ) : (
                  <div
                    style={{
                      width: 46, height: 46, borderRadius: '50%',
                      background: '#e8f0e4', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, flexShrink: 0,
                    }}
                  >
                    🐾
                  </div>
                )}
                <div className="solicitud-info">
                  <h4>{s.usuarios?.nombre}</h4>
                  <p>quiere adoptar a {s.mascotas?.nombre}</p>
                </div>
                <span className={`badge-estado badge-${s.estado}`}>
                  {s.estado.replace('_', ' ')}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Botón editar perfil */}
      <button
        className="btn-editar-perfil"
        onClick={() => navigate('/refugio/editarRefugio')}
      >
        Editar perfil
      </button>

      {/* Cerrar sesión */}
      <button
        className="btn-cerrar-sesion-refugio"
        onClick={async () => {
          await cerrarSesion()
          navigate('/login')
        }}
      >
        Cerrar sesión
      </button>

      {/* Bottom Nav */}
      <nav className="bottom-nav-refugio">
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/dashboard')}>
          <img src="/assets/img/home.png" alt="" />
          <span>Inicio</span>
        </button>
        <button className="nav-item-refugio" >
          <img src="/assets/img/animal.png" alt="Cargar" style={{ width: '24px', height: '24px', opacity: 0.2, filter: "invert(100%)"}} />
          <span>Animales</span>
        </button>
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/solicitudes')}>
          <img src="/assets/img/solicitudes.png" alt="" />
          <span>Solicitudes</span>
        </button>
        <button className="nav-item-refugio activo" onClick={() => navigate('/refugio/perfil')}>
          <img src="/assets/img/perfil.png" alt="" />
          <span>Perfil</span>
        </button>
      </nav>

    </div>
  )
}