import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Buscador from '../../components/Buscador'
import Bandeja from '../../../cliente/public/assets/img/bandeja-entrada.png'
import Animal from '../../../cliente/public/assets/img/animal.png'

import { obtenerMascotasRefugio } from '../../repositories/mascotaRepository'
import { obtenerEventosProximos } from '../../repositories/eventoRepository'
import { obtenerRefugio } from '../../repositories/perfilRefugioRepository'
import '../../styles/dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { usuario } = usarAuth()

  const [mascotas, setMascotas] = useState([])
  const [eventos, setEventos] = useState([])
  const [cargandoMascotas, setCargandoMascotas] = useState(true)
  const [cargandoEventos, setCargandoEventos] = useState(true)
  const [refugio, setRefugio] = useState(null)

  const publicadas = mascotas.length
  const urgentes = mascotas.filter(m => m.urgente).length

  useEffect(() => {
    let activo = true

    const obtenerDatos = async () => {
      try {
        const [refugioRes, mascotasRes, eventosRes] = await Promise.all([
          obtenerRefugio(usuario?.id),
          obtenerMascotasRefugio(usuario?.id),
          obtenerEventosProximos(),
        ])
        if (!activo) return
        setRefugio(refugioRes?.data || null)
        setMascotas(mascotasRes?.data || [])
        setEventos(eventosRes?.data || [])
      } finally {
        if (activo) {
          setCargandoMascotas(false)
          setCargandoEventos(false)
        }
      }
    }

    if (usuario?.id) obtenerDatos()
    return () => { activo = false }
  }, [usuario])

  const nombreRefugio = refugio?.nombre || usuario?.nombre || 'Refugio'

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return { mes: '', dia: '' }
    const fecha = new Date(fechaStr)
    const mes = fecha.toLocaleString('es-AR', { month: 'short' }).toUpperCase()
    const dia = fecha.getDate()
    return { mes, dia }
  }

  return (
    <div className="dash-pagina">

      {/* Header */}
      <header className="dash-header">
        <Link to="/" className="dash-logo">
          <img src="/assets/img/logo.png" alt="LUMA" />
        </Link>
        <div className="dash-header-iconos">
          <button className="dash-icono-campana" aria-label="Notificaciones">
            <img src="/assets/img/notificaciones.png" alt="" />
          </button>
          <img
            className="dash-avatar"
            src={refugio?.logo_url || usuario?.foto_perfil || '/assets/img/perfil_default.jpg'}
            alt="perfil"
            onClick={() => navigate('/refugio/perfil')}
          />
        </div>
      </header>

      {/* Saludo */}
      <h2 className="dash-saludo">Hola, {nombreRefugio} 🐾</h2>

      {/* Buscador */}
      <div className="dash-buscador">
        <Buscador ></Buscador>

      </div>

      {/* Dashboard stats */}
      <section className="dash-seccion">
        <div className="dash-seccion-cabecera">
          <h3 className="dash-seccion-titulo">Dashboard</h3>
        </div>

        <div className="dash-stats-card">
          <div className="dash-stats-header">
            <span className="dash-stats-subtitulo">Mis datos</span>
            <span className="dash-stats-label-activas">
              {cargandoMascotas ? '...' : `${publicadas} mascotas activas`}
            </span>
            <span className="dash-stats-hoy">Hoy</span>
          </div>
          <div className="dash-stats-grid">
            <div className="dash-stat-item">
              <span className="dash-stat-label">Publicadas</span>
              <span className="dash-stat-valor">{cargandoMascotas ? '–' : publicadas}</span>
            </div>
            <div className="dash-stat-item">
              <span className="dash-stat-label">Solicitudes nuevas</span>
              <span className="dash-stat-valor">–</span>
            </div>
            <div className="dash-stat-item">
              <span className="dash-stat-label">Formularios</span>
              <span className="dash-stat-valor">–</span>
            </div>
            <div className="dash-stat-item">
              <span className="dash-stat-label">Visitas agendadas</span>
              <span className="dash-stat-valor">–</span>
            </div>
          </div>
        </div>
      </section>

      {/* Acciones rápidas */}
      <div className="dash-acciones">
        <button className="dash-accion-btn" onClick={() => navigate('/refugio/solicitudes')}>
          <span className="dash-accion-icono"><img src={Bandeja} alt="" style={{ filter: "invert(100%)" }} /></span>
          <span>Solicitudes</span>
        </button>
        <button className="dash-accion-btn dash-accion-btn--verde" onClick={() => navigate('/refugio/cargarMascota')}>
          <span className="dash-accion-icono">+</span>
          <span>Cargar</span>
        </button>
        <button className="dash-accion-btn" onClick={() => navigate('/refugio/dashboard')}>
          <span className="dash-accion-icono"><img src={Animal} alt="" style={{ filter: "invert(100%)" }} /></span>
          <span>Animales</span>
        </button>
      </div>

      {/* Mascotas publicadas */}
      <section className="dash-seccion">
        <div className="dash-seccion-cabecera">
          <h3 className="dash-seccion-titulo">Mascotas publicadas</h3>
          <button className="dash-ver-todos" onClick={() => navigate('/refugio/dashboard')}>
            Ver todos
          </button>
        </div>

        <div className="dash-scroll-horizontal">
          {cargandoMascotas ? (
            <p className="dash-vacio">Cargando mascotas...</p>
          ) : mascotas.length > 0 ? (
            mascotas.map(m => (
              <article
                key={m.id}
                className="dash-tarjeta-mascota"
                onClick={() => navigate(`/refugio/mascota/${m.id}`)}
              >
                {m.urgente && <span className="dash-badge-urgente">URGENTE</span>}
                <button
                  className="dash-btn-fav"
                  aria-label="Guardar"
                  onClick={e => { e.stopPropagation() }}
                >♡</button>
                {m.foto_url
                  ? <img src={m.foto_url} alt={m.nombre} />
                  : <div className="dash-tarjeta-placeholder" />
                }
                <h4>{m.nombre}</h4>
                {(m.especies?.nombre || m.especie) && m.edad && (
                  <span className="dash-tarjeta-detalle">{m.especies?.nombre || m.especie} · {m.edad}</span>
                )}
              </article>
            ))
          ) : (
            <p className="dash-vacio">Todavía no publicaste mascotas.</p>
          )}
        </div>
      </section>

      {/* Mis eventos */}
      <section className="dash-seccion">
        <div className="dash-seccion-cabecera">
          <h3 className="dash-seccion-titulo">Mis eventos</h3>
        </div>

        <div className="dash-lista-eventos">
          {cargandoEventos ? (
            <p className="dash-vacio">Cargando eventos...</p>
          ) : eventos.length > 0 ? (
            eventos.slice(0, 3).map(e => {
              const { mes, dia } = formatearFecha(e.fecha)
              return (
                <article key={e.id} className="dash-tarjeta-evento">
                  <div className="dash-evento-fecha">
                    <span className="dash-evento-mes">{mes}</span>
                    <span className="dash-evento-dia">{dia}</span>
                  </div>
                  <div className="dash-evento-info">
                    <h4>{e.nombre}</h4>
                    <p>{e.lugar}{e.hora ? ` · ${e.hora}` : ''}</p>
                  </div>
                </article>
              )
            })
          ) : (
            <p className="dash-vacio">No hay eventos próximos.</p>
          )}
        </div>

        <button
          type="button"
          className="dash-btn-ver-todos"
          onClick={() => navigate('/refugio/dashboard')}
        >
          Ver todos
        </button>
      </section>

      <nav className="bottom-nav-refugio">
        <button className="nav-item-refugio activo" onClick={() => navigate('/refugio/dashboard')}>
          <img src="/assets/img/home.png" alt="Inicio" />
          <span>Inicio</span>
        </button>
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/cargarMascota')}>
          <img src="/assets/img/animal.png" alt="Cargar" style={{ width: '24px', height: '24px', opacity: 0.2, filter: "invert(100%)"}} />
          <span>Cargar</span>
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
    </div>
  )
}
