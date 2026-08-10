import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import { obtenerSolicitudesDeRefugio } from '../../repositories/perfilRefugioRepository'
import '../../styles/solicitudes.css'

const FILTROS = ['Todas', 'En revisión', 'Aprobadas', 'Rechazadas']

const PASO_LABEL = {
  formulario_completo: 'Formulario completo',
  entrevista_sugerida: 'Entrevista sugerida',
  checklist_listo: 'Checklist listo',
  revision: 'revision',
}

function tiempoRelativo(fecha) {
  const ahora = new Date()
  const diff = Math.floor((ahora - new Date(fecha)) / (1000 * 60 * 60 * 24))
  if (diff < 1) return 'hoy'
  if (diff === 1) return 'ayer'
  return `hace ${diff} días`
}

export default function SolicitudesRefugio() {
  const navigate = useNavigate()
  const { usuario } = usarAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroActivo, setFiltroActivo] = useState('Todas')
  const [mostrarTodas, setMostrarTodas] = useState(false)

  useEffect(() => {
    if (!usuario) {
      navigate('/login')
      return
    }

    let activo = true

    const obtenerDatos = async () => {
      try {
        const res = await obtenerSolicitudesDeRefugio(usuario.id)
        if (!activo) return
        setSolicitudes(res.data || [])
      } finally {
        if (activo) setCargando(false)
      }
    }

    obtenerDatos()
    return () => { activo = false }
  }, [usuario])

  if (cargando) return <Loader />

  // Filtrado por tab
  const solicitudesFiltradas = solicitudes.filter(s => {
    if (filtroActivo === 'Todas') return true
    if (filtroActivo === 'En revisión') return s.estado === 'revision'
    if (filtroActivo === 'Aprobadas') return s.estado === 'aprobada'
    if (filtroActivo === 'Rechazadas') return s.estado === 'rechazada'
    return true
  })

  const nuevas = solicitudes.filter(s => s.es_nueva).length

  // Mostrar 3 por defecto, todas si el usuario lo pide
  const solicitudesVisibles = mostrarTodas
    ? solicitudesFiltradas
    : solicitudesFiltradas.slice(0, 3)

  const hayMas = solicitudesFiltradas.length > 3 && !mostrarTodas

  return (

<div className="pagina-solicitudes">

      <div className="solicitudes-contenedor">
        <div className="nav">

        <h1 className="solicitudes-titulo">Solicitudes</h1>

        {/* Filtros */}
        <div className="solicitudes-filtros">
          
          {FILTROS.map(f => (
            <button
              key={f}
              className={`filtro-btn ${filtroActivo === f ? 'activo' : ''}`}
              onClick={() => { setFiltroActivo(f); setMostrarTodas(false) }}
            >
              {f}
              {f === 'Todas' && nuevas > 0 && (
                <span className="filtro-badge">+{nuevas}</span>
              )}
            </button>
          ))}
        </div>
</div>
        {/* Resumen */}
        <div className="solicitudes-resumen">
          <span>Tenés {solicitudesFiltradas.length} solicitudes</span>
          {nuevas > 0 && (
            <span className="nuevas">{nuevas} solicitudes nuevas</span>
          )}
        </div>

        {/* Lista */}
        <div className="solicitudes-lista">
          {solicitudesVisibles.length === 0 ? (
            <p className="vacio-solicitudes">No hay solicitudes en esta categoría.</p>
          ) : (
            solicitudesVisibles.map(s => (
              <TarjetaSolicitud
                key={s.id}
                solicitud={s}
                onVerFormulario={() => navigate(`/refugio/solicitud/${s.id}/formulario`)}
                onVerPerfil={() => navigate(`/refugio/solicitud/${s.id}/perfil`)}
                onCoordinar={() => navigate(`/refugio/solicitud/${s.id}/entrevista`)}
              />
            ))
          )}
        </div>

        {/* Ver todos */}
        {hayMas && (
          <button
            className="btn-ver-todos"
            onClick={() => setMostrarTodas(true)}
          >
            Ver todos
          </button>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav-refugio">
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/dashboard')}>
          <img src="/assets/img/home.png" alt="" />
          <span>Inicio</span>
        </button>
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/mismascotas')}>
          <img src="/assets/img/animal.png" alt="Cargar" style={{ width: '24px', height: '24px', opacity: 0.2, filter: "invert(100%)"}} />
          <span>Animales</span>
        </button>
        <button className="nav-item-refugio activo" onClick={() => navigate('/refugio/solicitudes')}>
          <img src="/assets/img/solicitudes.png" alt="" />
          <span>Solicitudes</span>
        </button>
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/perfil')}>
          <img src="/assets/img/perfil.png" alt="" />
          <span>Perfil</span>
        </button>
      </nav>

    </div>
  )
}

/* ── Componente interno de tarjeta ── */
function TarjetaSolicitud({ solicitud: s, onVerFormulario, onVerPerfil, onCoordinar }) {
  const esNueva = s.es_nueva
  const estadoKey = s.estado
  const paso = PASO_LABEL[s.paso_actual] || s.paso_actual || ''

  return (
    <>
    <article className="tarjeta-solicitud-refugio">
      {esNueva && <span className="punto-nuevo" aria-label="Nueva solicitud" />}

      <div className="solicitud-fila-superior">
        {s.usuarios?.foto_url ? (
          <img
            className="solicitud-avatar"
            src={s.usuarios.foto_url}
            alt={s.usuarios.nombre}
          />
        ) : (
          <div className="solicitud-avatar-placeholder">🐾</div>
        )}

        <div className="solicitud-datos">
          <h4>{s.usuarios?.nombre}</h4>
          <p>Para {s.mascotas?.nombre} · {tiempoRelativo(s.creado_en)}</p>
        </div>
        <span className={`badge-estado-sol badge-${estadoKey}`}>
          {estadoKey === 'revision' ? 'En revisión'
            : estadoKey === 'aprobada' ? 'Aprobada'
            : estadoKey === 'rechazada' ? 'Rechazada'
            : 'Pendiente'}
        </span>
      </div>


      <div className="solicitud-acciones">
        {estadoKey === 'Aprobada' ? (
          <button className="btn-accion-verde" onClick={onCoordinar}>
            Coordinar entrevista
          </button>
        ) : (
          <button className="btn-accion-primaria" onClick={onVerFormulario}>
            Ver formulario
          </button>
        )}
        <button className="btn-ver-perfil" onClick={onVerPerfil}>
          Ver perfil
        </button>
      </div>
    </article>
     <nav className="bottom-nav-refugio">
        <button className="nav-item-refugio " onClick={() => navigate('/refugio/dashboard')}>
          <img src="/assets/img/home.png" alt="Inicio" />
          <span>Inicio</span>
        </button>
       <button className="nav-item-refugio" onClick={()=>navigate('/refugio/MisMascotas')} >
          <img src="/assets/img/animal.png" alt="Cargar" style={{ width: '24px', height: '24px', opacity: 0.2, filter: "invert(100%)"}} />
          <span>Animales</span>
        </button>
        <button className="nav-item-refugio activo" onClick={() => navigate('/refugio/solicitudes')}>
          <img src="/assets/img/solicitudes.png" alt="Solicitudes" />
          <span>Solicitudes</span>
        </button>
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/perfil')}>
          <img src="/assets/img/perfil.png" alt="Perfil" /> 
          <span>Perfil</span>
        </button>
      </nav>
      </>
  )
}