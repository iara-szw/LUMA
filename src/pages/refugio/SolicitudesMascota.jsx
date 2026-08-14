import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import { obtenerSolicitudesDeRefugio } from '../../repositories/perfilRefugioRepository'
import { obtenerMascotaPorId } from '../../repositories/mascotaRepository'
import { obtenerFormularioMascota } from '../../repositories/formularioRepository'
import '../../styles/solicitudes.css'

function tiempoRelativo(fecha) {
  const ahora = new Date()
  const diff = Math.floor((ahora - new Date(fecha)) / (1000 * 60 * 60 * 24))
  if (diff < 1) return 'hoy'
  if (diff === 1) return 'ayer'
  return `hace ${diff} días`
}

export default function SolicitudesMascota() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = usarAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [mascota, setMascota] = useState(null)
  const [preguntasMC, setPreguntasMC] = useState([])
  const [filtros, setFiltros] = useState({})
  const [filtrosTemp, setFiltrosTemp] = useState({})
  const [mostrarFiltro, setMostrarFiltro] = useState(false)
  const [cargando, setCargando] = useState(true)

  const solicitudesVisibles = useMemo(() => {
    if (!Object.keys(filtros).length) return solicitudes
    return solicitudes.filter(s =>
      Object.entries(filtros).every(([preguntaId, opcion]) =>
        (s.info || {})[preguntaId] === opcion
      )
    )
  }, [solicitudes, filtros])

  useEffect(() => {
    if (!usuario) return
    let activo = true

    const cargar = async () => {
      try {
        const [solRes, masRes, formRes] = await Promise.all([
          obtenerSolicitudesDeRefugio(usuario.id),
          obtenerMascotaPorId(id),
          obtenerFormularioMascota(id),
        ])

        if (!activo) return
        const todas = solRes.data || []
        const filtradas = todas.filter(s => s.mascotas?.id === id || (s.mascotas && String(s.mascotas.id) === String(id)))
        setSolicitudes(filtradas)
        setMascota(masRes.data || null)

        const bloques = formRes?.data?.bloques || []
        const mc = []
        bloques.forEach(b => {
          (b.preguntas || []).forEach(p => { if (p.tipo === 'multiple') mc.push(p) })
        })
        setPreguntasMC(mc)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => { activo = false }
  }, [usuario, id])

  if (cargando) return <Loader />

  return (
    <div className="pagina-solicitudes">
      <div className="solicitudes-contenedor">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0px 0px 15px 15px', backgroundColor: 'var(--crema)', padding: '3%' }}>
          <h1 className="solicitudes-titulo">Postulaciones {mascota ? `para ${mascota.nombre}` : ''}</h1>
          <button className="btn-accion-primaria" onClick={() => { setFiltrosTemp(filtros); setMostrarFiltro(true) }}>Filtrar respuestas</button>
        </div>

        <div className="solicitudes-lista">
          {solicitudesVisibles.length === 0 ? (
            <p className="vacio-solicitudes">No hay postulaciones para esta mascota.</p>
          ) : (
            solicitudesVisibles.map(s => (
              <Tarjeta key={s.id} solicitud={s} onVerFormulario={() => navigate(`/refugio/solicitud/${s.id}/formulario`)} onVerPerfil={() => navigate(`/refugio/solicitud/${s.id}/perfil`)} />
            ))
          )}
        </div>
      </div>
      <nav className="bottom-nav-refugio">
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/dashboard')}>
          <img src="/assets/img/home.png" alt="" />
          <span>Inicio</span>
        </button>
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/mascotas')}>
          <img src="/assets/img/animal.png" alt="" style={{ width: '24px', height: '24px', opacity: 0.2, filter: "invert(100%)"}} />
          <span>Animales</span>
        </button>
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/solicitudes')}>
          <img src="/assets/img/solicitudes.png" alt="" />
          <span>Solicitudes</span>
        </button>
        <button className="nav-item-refugio" onClick={() => navigate('/refugio/perfil')}>
          <img src="/assets/img/perfil.png" alt="" />
          <span>Perfil</span>
        </button>
      </nav>

      {mostrarFiltro && (
        <div className="filtro-overlay">
          <div className="filtro-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Filtrar por pregunta</h3>
            {preguntasMC.length === 0 ? (
              <p>No hay preguntas de tipo multiple-choice para esta mascota.</p>
            ) : (
              preguntasMC.map(p => (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <strong>{p.titulo}</strong>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {(p.opciones || []).map((op, idx) => {
                      const seleccionado = filtrosTemp[p.id] === op
                      return (
                        <button
                          key={idx}
                          className={`filtro-opcion ${seleccionado ? 'activo' : ''}`}
                          onClick={() => {
                            setFiltrosTemp(prev => {
                              const actual = prev[p.id]
                              if (actual === op) {
                                const next = { ...prev }
                                delete next[p.id]
                                return next
                              }
                              return { ...prev, [p.id]: op }
                            })
                          }}
                        >
                          {op}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 16 }}>
              <button className="btn-formulario ghost" onClick={() => { setFiltros({}); setFiltrosTemp({}); }}>Limpiar filtro</button>
              <button className="btn-accion-verde" onClick={() => { setFiltros(filtrosTemp); setMostrarFiltro(false) }}>Guardar filtros</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Tarjeta({ solicitud: s, onVerFormulario, onVerPerfil }) {
  const estadoKey = s.estado
  return (
    <article className="tarjeta-solicitud-refugio">
      <div className="solicitud-fila-superior">
        {s.usuarios?.foto_url ? (
          <img className="solicitud-avatar" src={s.usuarios.foto_url} alt={s.usuarios.nombre} />
        ) : (
          <div className="solicitud-avatar-placeholder">🐾</div>
        )}

        <div className="solicitud-datos">
          <h4>{s.usuarios?.nombre}</h4>
          <p>Para {s.mascotas?.nombre} · {tiempoRelativo(s.creado_en || s.fecha_solicitud)}</p>
        </div>

        <span className={`badge-estado-sol badge-${estadoKey}`}>
          {estadoKey === 'en_revision' ? 'En revisión'
            : estadoKey === 'aprobada' ? 'Aprobada'
            : estadoKey === 'rechazada' ? 'Rechazada'
            : 'Pendiente'}
        </span>
      </div>

      <div className="solicitud-acciones">
        <button className="btn-accion-primaria" onClick={onVerFormulario}>Ver formulario</button>
        <button className="btn-ver-perfil" onClick={onVerPerfil}>Ver perfil</button>
      </div>
    </article>
  )
}
