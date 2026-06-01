import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Supabase } from '../../servicios/Supabase'
import { usarAuth } from '../../contexto/UsarAuth'
import '../../css/perfil.css'

export default function Perfil() {
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = usarAuth()
  const [postulaciones, setPostulaciones] = useState([])
  const [cursos, setCursos] = useState([])
  const [guardados, setGuardados] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!usuario) {
      navigate('/login')
      return
    }

    let activo = true

    const obtenerDatos = async () => {
      try {
        const [postulacionesRes, cursosRes, guardadosRes] = await Promise.all([
          Supabase
            .from('postulaciones')
            .select('id, estado, creado_en, mascotas(id, nombre, foto_url), refugios(nombre)')
            .eq('usuario_id', usuario.id)
            .order('creado_en', { ascending: false }),
          Supabase
            .from('cursos_usuario')
            .select('id, completado, cursos(id, nombre)')
            .eq('usuario_id', usuario.id),
          Supabase
            .from('guardados')
            .select('id, mascotas(id, nombre, foto_url, urgente)')
            .eq('usuario_id', usuario.id)
            .order('creado_en', { ascending: false }),
        ])

        if (!activo) return
        setPostulaciones(postulacionesRes.data || [])
        setCursos(cursosRes.data || [])
        setGuardados(guardadosRes.data || [])
      } finally {
        if (activo) setCargando(false)
      }
    }

    obtenerDatos()
    return () => { activo = false }
  }, [usuario])

  const cursosCompletos = cursos.filter(c => c.completado).length
  const nombre = usuario?.nombre?.split(' ')[0]

  if (cargando) return <p>Cargando perfil...</p>

  return (
    <div className="pagina-perfil">
      <header className="perfil-header">
        <button onClick={() => navigate(-1)}>← Mi perfil</button>
        <div className="perfil-header-iconos">
          <button aria-label="Notificaciones">🔔</button>
          <button onClick={() => navigate('/adoptante/editarUsuario')}>⚙️</button>
        </div>
      </header>

      <section className="perfil-info">
        <div className="perfil-avatar-wrapper">
          <img
            className="perfil-avatar"
            src={usuario.foto_url || '/assets/avatar-placeholder.png'}
            alt={usuario.nombre}
          />
          <button className="perfil-avatar-editar" onClick={() => navigate('/adoptante/editarUsuario')}>
            📷
          </button>
        </div>
        <h2>{usuario.nombre} </h2>
        <h3>Sobre mí</h3>
<p>{usuario.biografia || 'Sin descripción todavía.'}</p>   
   </section>

      <section className="seccion">
        <h3 className="seccion-titulo">Mis Postulaciones</h3>
        {postulaciones.length === 0 ? (
          <p className="vacio">No tenés postulaciones aún.</p>
        ) : (
          postulaciones.map(p => (
            <article
              key={p.id}
              className="tarjeta-postulacion"
              onClick={() => navigate(`/adoptante/postulacion/${p.id}`)}
            >
              <div className="postulacion-mascota">
                {p.mascotas?.foto_url && (
                  <img src={p.mascotas.foto_url} alt={p.mascotas.nombre} />
                )}
                <div>
                  <h4>{p.mascotas?.nombre}</h4>
                  <p>{p.refugios?.nombre}</p>
                </div>
                <span className={`badge-estado badge-${p.estado}`}>{p.estado}</span>
              </div>
              <div className="postulacion-pasos">
                <p>✅ Formulario enviado · {new Date(p.creado_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                {p.estado === 'en_revision' && (
                  <p>🔄 En proceso de revisión — te notificaremos cuando el refugio termine de revisar.</p>
                )}
              </div>
            </article>
          ))
        )}
      </section>

      <section className="seccion">
        <h3 className="seccion-titulo">Mi preparación</h3>
        {cursos.length === 0 ? (
          <p className="vacio">No hay cursos disponibles.</p>
        ) : (
          <>
            <div className="preparacion-resumen">
              <span>{cursosCompletos}/{cursos.length} cursos completos</span>
              <button onClick={() => navigate('/adoptante/cursos')}>Ir</button>
            </div>
            <div className="preparacion-resumen">
              <span>Guía general</span>
              <button onClick={() => navigate('/adoptante/guia')}>Revisar</button>
            </div>
          </>
        )}
      </section>

      <section className="seccion">
        <h3 className="seccion-titulo">Guardados</h3>
        {guardados.length === 0 ? (
          <p className="vacio">No guardaste mascotas todavía.</p>
        ) : (
          <div className="scroll-horizontal">
            {guardados.map(g => (
              <article
                key={g.id}
                className="tarjeta-mascota"
                onClick={() => navigate(`/adoptante/mascota/${g.mascotas?.id}`)}
              >
                {g.mascotas?.foto_url && (
                  <img src={g.mascotas.foto_url} alt={g.mascotas.nombre} />
                )}
                <h4>{g.mascotas?.nombre}</h4>
                {g.mascotas?.urgente && <span className="badge-urgente">Urgente</span>}
              </article>
            ))}
          </div>
        )}
      </section>

      <button
        className="btn-cerrar-sesion"
        onClick={async () => {
          await cerrarSesion()
          navigate('/login')
        }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}