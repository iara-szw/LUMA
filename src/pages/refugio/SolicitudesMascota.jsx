import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import FooterRefugio from '../../components/FooterRefugio'
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
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState(null)
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null)

  const solicitudesVisibles = useMemo(() => {
    if (!Object.keys(filtros).length) return solicitudes
    return solicitudes.filter(s =>
      Object.entries(filtros).every(([preguntaId, opciones]) =>
        // opciones es un array, hace OR: la respuesta debe estar en el array
        Array.isArray(opciones) && opciones.includes((s.info || {})[preguntaId])
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
                      <button className="volver" onClick={() => navigate(-1)} aria-label="Volver">←</button>

          <h1 className="solicitudes-titulo">Postulaciones </h1>
          <button className="btn-accion-primaria" onClick={() => { setFiltrosTemp(filtros); setMostrarFiltro(true) }}>Filtrar respuestas</button>
        </div>
<h1 className="nombre">{mascota ? ` ${mascota.nombre}` : ''}</h1>
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
      <FooterRefugio />

      {mostrarFiltro && (
        <div className="filtro-overlay" onClick={() => setMostrarFiltro(false)}>
          <div className="filtro-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Filtrar por pregunta</h3>
            
            <div className="filtro-seccion-selectores">
              <div style={{ marginBottom: 12 }}>
                <label>Selecciona una pregunta:</label>
                <select 
                  className="filtro-select"
                  value={preguntaSeleccionada?.id || ''}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setPreguntaSeleccionada(null)
                      setOpcionSeleccionada(null)
                    } else {
                      const p = preguntasMC.find(x => x.id === e.target.value)
                      setPreguntaSeleccionada(p)
                      setOpcionSeleccionada(null)
                    }
                  }}
                >
                  <option value="">-- Selecciona una pregunta --</option>
                  {preguntasMC.map(p => (
                    <option key={p.id} value={p.id}>{p.titulo}</option>
                  ))}
                </select>
              </div>

              {preguntaSeleccionada && (
                <div style={{ marginBottom: 12 }}>
                  <label>Selecciona una opción:</label>
                  <select 
                    className="filtro-select"
                    value={opcionSeleccionada || ''}
                    onChange={(e) => setOpcionSeleccionada(e.target.value || null)}
                  >
                    <option value="">-- Selecciona una opción --</option>
                    {(preguntaSeleccionada.opciones || []).map((op, idx) => (
                      <option key={idx} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
              )}

              {preguntaSeleccionada && opcionSeleccionada && (
                <button 
                  className="btn-accion-verde"
                  onClick={() => {
                    setFiltrosTemp(prev => {
                      const opcionesActuales = prev[preguntaSeleccionada.id] || []
                      // Evitar duplicados
                      if (opcionesActuales.includes(opcionSeleccionada)) {
                        return prev
                      }
                      return {
                        ...prev,
                        [preguntaSeleccionada.id]: [...opcionesActuales, opcionSeleccionada]
                      }
                    })
                    setPreguntaSeleccionada(null)
                    setOpcionSeleccionada(null)
                  }}
                >
                  Agregar filtro
                </button>
              )}
            </div>

            {Object.keys(filtrosTemp).length > 0 && (
              <div className="filtro-lista-aplicados">
                <h4>Filtros aplicados:</h4>
                <div className="filtro-items-scroll">
                  {Object.entries(filtrosTemp).map(([pId, opcion]) => {
                    const preg = preguntasMC.find(p => p.id === pId)
                    return (
                      <div key={pId} className="filtro-item-aplicado">
                        <div className="filtro-item-contenido">
                          <strong>{preg?.titulo}</strong>
                          <span>{opcion}</span>
                        </div>
                        <button 
                          className="filtro-item-eliminar"
                          onClick={() => {
                            setFiltrosTemp(prev => {
                              const next = { ...prev }
                              delete next[pId]
                              return next
                            })
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 16 }}>
              <button className="btn-formulario ghost" onClick={() => { setFiltros({}); setFiltrosTemp({}); setPreguntaSeleccionada(null); setOpcionSeleccionada(null); }}>Limpiar filtros</button>
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
