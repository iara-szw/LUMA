import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Buscador from '../../components/Buscador'

import Footer from '../../components/Footer'
import { obtenerMascotasRefugio } from '../../repositories/mascotaRepository'
import { obtenerEventosProximos } from '../../repositories/eventoRepository'
import '../../styles/dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { usuario } = usarAuth()

  const [mascotas, setMascotas] = useState([])
  const [eventos, setEventos] = useState([])
  const [cargandoMascotas, setCargandoMascotas] = useState(true)
  const [cargandoEventos, setCargandoEventos] = useState(true)

  const publicadas = mascotas.length
  const urgentes = mascotas.filter(m => m.urgente).length

  useEffect(() => {
    let activo = true

    const obtenerDatos = async () => {
      try {
        const [mascotasRes, eventosRes] = await Promise.all([
          obtenerMascotasRefugio(usuario?.id),
          obtenerEventosProximos(),
        ])
        if (!activo) return
        setMascotas(mascotasRes.data || [])
        setEventos(eventosRes.data || [])
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

  const nombreRefugio = usuario?.nombre || 'Refugio'

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
          <img src="/cliente/public/assets/img/logo.png" alt="LUMA" />
        </Link>
        <div className="dash-header-iconos">
          <button className="dash-icono-campana" aria-label="Notificaciones">
            <img src="/cliente/public/assets/img/notificaciones.png" alt="" />
          </button>
          <img
            className="dash-avatar"
            src={usuario?.foto_perfil || '/cliente/public/assets/img/perfil_default.jpg'}
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
          <span className="dash-accion-icono">📋</span>
          <span>Solicitudes</span>
        </button>
        <button className="dash-accion-btn dash-accion-btn--verde" onClick={() => navigate('/refugio/cargarMascota')}>
          <span className="dash-accion-icono">＋</span>
          <span>Cargar</span>
        </button>
        <button className="dash-accion-btn" onClick={() => navigate('/refugio/animales')}>
          <span className="dash-accion-icono">🐾</span>
          <span>Animales</span>
        </button>
      </div>

      {/* Mascotas publicadas */}
      <section className="dash-seccion">
        <div className="dash-seccion-cabecera">
          <h3 className="dash-seccion-titulo">Mascotas publicadas</h3>
          <button className="dash-ver-todos" onClick={() => navigate('/refugio/animales')}>
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
                {m.especie && m.edad && (
                  <span className="dash-tarjeta-detalle">{m.especie} · {m.edad}</span>
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
          onClick={() => navigate('/refugio/eventos')}
        >
          Ver todos
        </button>
      </section>

      <Footer />
    </div>
  )
}
