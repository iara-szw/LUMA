import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Supabase } from '../servicios/Supabase'
import { usarAuth } from '../contexto/ContextoAuth'
import Buscador from '../componentes/Buscador'

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
          Supabase
            .from('mascotas')
            .select('id, nombre, foto_url, urgente, edad')
            .eq('estado', 'activa')
            .order('creado_en', { ascending: false })
            .limit(10),
          Supabase
            .from('eventos')
            .select('id, nombre, lugar, fecha, hora')
            .order('fecha', { ascending: true })
            .limit(5),
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
        <Link to="/" className="logo">LUMA</Link>
        <div className="inicio-header-iconos">
          {usuario ? (
            <>
              <button className="icono-campana" aria-label="Notificaciones">🔔</button>
              <img
                className="avatar"
                src="/assets/avatar-placeholder.png"
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

      <h2 className="saludo">
        {nombre ? `Hola, ${nombre} 🐾` : 'Bienvenido a LUMA 🐾'}
      </h2>

      <Buscador
        placeholder="Buscar por nombre o refugio..."
        onBuscar={(query) => navigate(`/adoptante/buscar?q=${query}`)}
      />

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
    </div>
  )
}
