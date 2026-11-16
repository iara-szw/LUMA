import '../styles/home.css'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usarAuth } from '../hooks/UsarAuth'
import Buscador from '../components/Buscador'
import Footer from '../components/Footer'
import NotiBadge from '../components/NotiBadge'
import { obtenerMascotasRecientes } from '../repositories/mascotaRepository'
import { obtenerCalendarioAdoptante } from '../repositories/calendarioRepository'
import { obtenerEventosProximos } from '../repositories/eventoRepository'
import { agregarFavorito, eliminarFavorito } from '../repositories/usuarioRepository'
import { obtenerGuardadosDeUsuario } from '../repositories/perfilRepository'

export default function Home() {
  const navigate = useNavigate()
  const { usuario } = usarAuth()
  const [mascotas, setMascotas] = useState([])
  const [eventos, setEventos] = useState([])
  const [favoritos, setFavoritos] = useState(new Set())
  const [cargandoMascotas, setCargandoMascotas] = useState(true)
  const [cargandoEventos, setCargandoEventos] = useState(true)
  const [cargandoFavoritos, setCargandoFavoritos] = useState(false)

  useEffect(() => {
    let activo = true

    const obtenerDatos = async () => {
      try {
        const [mascotasRes, eventosRes] = await Promise.all([
          obtenerMascotasRecientes(),
          usuario?.id ? obtenerCalendarioAdoptante(usuario.id) : obtenerEventosProximos(2),
        ])

        if (!activo) return
        setMascotas(mascotasRes.data || [])
        setEventos((eventosRes.data || []).slice(0, 2))
      } finally {
        if (activo) {
          setCargandoMascotas(false)
          setCargandoEventos(false)
        }
      }
    }

    const obtenerFavoritos = async () => {
      if (!usuario) return setFavoritos(new Set())
      const guardadosRes = await obtenerGuardadosDeUsuario(usuario.id)
      if (!activo) return
      const ids = new Set((guardadosRes.data || []).map(item => item.mascotas?.id).filter(Boolean))
      setFavoritos(ids)
    }

    obtenerDatos()
    obtenerFavoritos()
    return () => { activo = false }
  }, [usuario])

  const nombre = usuario?.nombre?.split(' ')[0]
  const avatarUsuario = usuario?.foto_url || '/assets/img/perfil_default.jpg'

  const toggleFavorito = async (mascotaId) => {
    if (!usuario) return navigate('/login')
    if (cargandoFavoritos) return
    setCargandoFavoritos(true)
    try {
      if (favoritos.has(mascotaId)) {
        const res = await eliminarFavorito(usuario.id, mascotaId)
        if (!res.error) {
          const next = new Set(favoritos)
          next.delete(mascotaId)
          setFavoritos(next)
        }
      } else {
        const res = await agregarFavorito(usuario.id, mascotaId)
        if (!res.error) {
          const next = new Set(favoritos)
          next.add(mascotaId)
          setFavoritos(next)
        }
      }
    } finally {
      setCargandoFavoritos(false)
    }
  }

  const formatearFechaEvento = (fechaStr) => {
    const fecha = new Date(fechaStr)
    return {
      mes: fecha.toLocaleString('es-AR', { month: 'short' }).toUpperCase(),
      dia: fecha.getDate(),
      hora: fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  return (
    <div className="pagina-inicio">
      <header className="inicio-header">
        <Link to="/" className="logo"><img src="/assets/img/logo.png" alt="" /></Link>
        <div className="inicio-header-iconos">
          {usuario ? (
            <>
              <button className="icono-campana" aria-label="Notificaciones" onClick={() => navigate('/notificaciones')}>
                <img src="/assets/img/notificaciones.png" alt="" />
                <NotiBadge />
              </button>
              <img
                className="avatar"
                src={avatarUsuario}
                alt="perfil"
                onClick={() => navigate('/adoptante/perfil')}
              />
            </>
          ) : (
            <nav className="nav-auth">
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/registro" className="btn-registro">Registrarse</Link>
            </nav>
          )}
        </div>
      </header>

      <div className='inicioDiv'>
        <h2 className="saludo">
          {nombre ? `Hola, ${nombre} 🐾` : 'Bienvenido a LUMA 🐾'}
        </h2>

        <Buscador
          placeholder="Buscar por nombre o refugio..."
          onBuscar={(query) => navigate(`/adoptante/buscar?q=${query}`)}
        />
      </div>

      <section className="banner-test-match">
        <p>Descubrí tu mascota ideal con nuestro test de compatibilidad</p>
        <button type="button" onClick={() => navigate('/adoptante/test-match')}>
          Hacer test
        </button>
      </section>

      <section className="seccion">
        <h3 className="seccion-titulo">Explorar</h3>
        <div className="scroll-horizontal">
          {cargandoMascotas ? (
            <p className="vacio">Cargando mascotas...</p>
          ) : mascotas.length > 0 ? (
            mascotas.map(m => (
              <article
                key={m.id}
                className="tarjeta-mascota"
                onClick={() => navigate(`/adoptante/mascota/${m.id}`)}
              >
                <button
                  type="button"
                  className="tarjeta-favorito"
                  aria-label={`${favoritos.has(m.id) ? 'Remover' : 'Guardar'} ${m.nombre}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorito(m.id)
                  }}
                >
                  <img src={favoritos.has(m.id) ? '/assets/img/corazon-seleccionado.png' : '/assets/img/corazon.png'} alt="" />
                </button>
                <img src={m.foto_url || '/assets/img/perfil_default.jpg'} alt={m.nombre} />
                <h4>{m.nombre}</h4>
                {m.edad && <span>{m.edad}</span>}
                {m.urgente && <span className="badge-urgente">Urgente</span>}
              </article>
            ))
          ) : (
            <p className="vacio">No hay mascotas disponibles por ahora.</p>
          )}
        </div>
      </section>

      <section className="seccion">
        <h3 className="seccion-titulo">Eventos</h3>
        <div className="lista-eventos">
          {cargandoEventos ? (
            <p className="vacio">Cargando eventos...</p>
          ) : eventos.length > 0 ? (
            eventos.map(e => {
              const fecha = e.fecha_evento || e.fecha
              const { dia, hora } = formatearFechaEvento(fecha)
              const esEntrevista = e.tipo === 'entrevista'

              return (
                <article
                  key={`${e.tipo}-${e.id}`}
                  className={`cal-tarjeta ${esEntrevista ? 'cal-tarjeta--entrevista' : 'cal-tarjeta--evento'}`}
                  onClick={() => {
                    if (esEntrevista) navigate(`/entrevistas/${e.id}`)
                    else navigate(`/eventos/${e.id}`)
                  }}
                >
                  <div className="cal-tarjeta-fecha">
                    <span className="cal-tarjeta-dia">{dia}</span>
                  </div>
                  <div className="cal-tarjeta-info">
                    <span className={`cal-badge ${esEntrevista ? 'cal-badge--entrevista' : 'cal-badge--evento'}`}>
                      {esEntrevista ? 'Entrevista' : 'Evento'}
                    </span>
                    <h4>{e.titulo}</h4>
                    <p>
                      {hora}
                      {e.lugar ? ` · ${e.lugar}` : ''}
                      {e.modalidad ? ` · ${e.modalidad}` : ''}
                      {e.refugio ? ` · ${e.refugio}` : ''}
                    </p>
                  </div>
                </article>
              )
            })
          ) : (
            <p className="vacio">No hay eventos próximos.</p>
          )}
        </div>
        <button
          type="button"
          className="btn-ver-todos"
          onClick={() => navigate('/adoptante/calendario')}
        >
          Ver todos
        </button>
      </section>

      {!usuario && (
        <section className="seccion cta-auth">
          <p>¿Querés adoptar o publicar mascotas?</p>
          <div className="cta-auth-botones">
            <Link to="/login" className="btn-primario">Iniciar sesión</Link>
            <Link to="/registro" className="btn-secundario">Crear cuenta</Link>
          </div>
        </section>
      )}
      <Footer />
    </div>
  )
}