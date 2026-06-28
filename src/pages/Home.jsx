import '../styles/home.css'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usarAuth } from '../hooks/UsarAuth'
import Buscador from '../components/Buscador'
import Footer from '../components/Footer'
import { obtenerMascotasRecientes } from '../repositories/mascotaRepository'
import { obtenerEventosProximos } from '../repositories/eventoRepository'

export default function Home() {
  const navigate = useNavigate()
  const { usuario } = usarAuth()
  const [mascotas, setMascotas] = useState([])
  const [eventos, setEventos] = useState([])
  const [cargandoMascotas, setCargandoMascotas] = useState(true)
  const [cargandoEventos, setCargandoEventos] = useState(true)

  useEffect(() => {
    let activo = true
    
    const obtenerDatos = async () => {
      try {
        const [mascotasRes, eventosRes] = await Promise.all([
          obtenerMascotasRecientes(),
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

    obtenerDatos()
    return () => { activo = false }
  }, [])

  const nombre = usuario?.nombre?.split(' ')[0]

  return (
    <div className="pagina-inicio">
      <header className="inicio-header">
        <Link to="/" className="logo"><img src="/assets/img/logo.png" alt="" /></Link>
        <div className="inicio-header-iconos">
          {usuario ? (
            <>
              <button className="icono-campana" aria-label="Notificaciones"><img src="/assets/img/notificaciones.png" />
</button>
        <img
  className="avatar"
  src={usuario.foto_perfil || '/assets/img/perfil_default.jpg'}
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
                {m.foto_url && <img src={m.foto_url} alt={m.nombre} />}
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
            eventos.map(e => (
              <article key={e.id} className="tarjeta-evento">
                <h4>{e.nombre}</h4>
                <p>{e.lugar}</p>
                <p>{e.fecha} {e.hora && `· ${e.hora}`}</p>
              </article>
            ))
          ) : (
            <p className="vacio">No hay eventos próximos.</p>
          )}
        </div>
        <button
          type="button"
          className="btn-ver-todos"
          onClick={() => navigate('/adoptante/eventos')}
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
