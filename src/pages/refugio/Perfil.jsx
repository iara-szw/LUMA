import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import {
  obtenerMascotasDeRefugio,
  obtenerSolicitudesDeRefugio,
  obtenerEstadisticasDeRefugio,
} from '../../repositories/perfilRefugioRepository'
import '../../styles/perfilRefugio.css'

export default function PerfilRefugio() {
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = usarAuth()
  const [mascotas, setMascotas] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [stats, setStats] = useState({ mascotas: 0, voluntarios: 0, adopciones: 0, eventos: 0 })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!usuario) {
      navigate('/login')
      return
    }

    let activo = true

    const obtenerDatos = async () => {
      try {
        const [mascotasRes, solicitudesRes, statsRes] = await Promise.all([
          obtenerMascotasDeRefugio(usuario.id),
          obtenerSolicitudesDeRefugio(usuario.id),
          obtenerEstadisticasDeRefugio(usuario.id),
        ])

        if (!activo) return
        setMascotas(mascotasRes.data || [])
        setSolicitudes(solicitudesRes.data || [])
        setStats(statsRes.data || { mascotas: 0, voluntarios: 0, adopciones: 0, eventos: 0 })
      } finally {
        if (activo) setCargando(false)
      }
    }

    obtenerDatos()
    return () => { activo = false }
  }, [usuario])

  if (cargando) return <Loader />

  return (
    <div className="pagina-perfil-refugio">

      {/* Header flotante sobre la foto */}
      <header className="perfil-refugio-header">
        <button onClick={() => navigate(-1)} aria-label="Volver">←</button>
        <div className="perfil-refugio-header-iconos">
          <button aria-label="Notificaciones" onClick={() => navigate('/refugio/notificaciones')}>
            <img src="/cliente/public/assets/img/notificaciones.png" alt="" />
          </button>
          <button aria-label="Configuración" onClick={() => navigate('/refugio/editarRefugio')}>
            <img src="/cliente/public/assets/img/configurar.png" alt="" />
          </button>
        </div>
      </header>

      {/* Foto de portada */}
      <div className="perfil-refugio-portada">
        <img
          src={usuario.foto_portada_url || '/cliente/public/assets/img/refugio_default.jpg'}
          alt={usuario.nombre}
        />
      </div>

      {/* Nombre y ubicación */}
      <section className="perfil-refugio-info">
        <h2>{usuario.nombre}</h2>
        {usuario.direccion && (
          <p className="perfil-refugio-ubicacion">
            <img src="/cliente/public/assets/img/ubicacion.png" alt="" />
            {usuario.direccion}
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
            <p className="resumen-stat-label">Mascotas</p>
            <p className="resumen-stat-valor">{stats.mascotas}</p>
          </div>
          <div className="resumen-stat">
            <p className="resumen-stat-label">Voluntarios</p>
            <p className="resumen-stat-valor">{stats.voluntarios}</p>
          </div>
          <div className="resumen-stat">
            <p className="resumen-stat-label">Adopciones</p>
            <p className="resumen-stat-valor">{stats.adopciones}</p>
          </div>
          <div className="resumen-stat">
            <p className="resumen-stat-label">Eventos</p>
            <p className="resumen-stat-valor">{stats.eventos}</p>
          </div>
        </div>
      </section>

      {/* Sobre nosotros */}
      <section className="seccion-refugio">
        <h3 className="seccion-refugio-titulo">Sobre nosotros</h3>
        <p className="sobre-nosotros-texto">
          {usuario.descripcion || 'Sin descripción todavía.'}
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
                  <p>{m.especie}</p>
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
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/inicio')}>
          <img src="/cliente/public/assets/img/inicio.png" alt="" />
          <span>Inicio</span>
        </button>
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/mascotas')}>
          <img src="/cliente/public/assets/img/mascotas.png" alt="" />
          <span>Mascotas</span>
        </button>
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/solicitudes')}>
          <img src="/cliente/public/assets/img/solicitudes.png" alt="" />
          <span>Solicitudes</span>
        </button>
        <button className="nav-item-refugio activo" onClick={() => navigate('/refugio/perfil')}>
          <img src="/cliente/public/assets/img/perfil.png" alt="" />
          <span>Perfil</span>
        </button>
      </nav>

    </div>
  )
}