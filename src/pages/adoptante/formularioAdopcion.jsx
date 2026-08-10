import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import '../../styles/formularios.css'
import { obtenerFormularioMascota, guardarProgresoSolicitud, obtenerSolicitudFormularioPorMascotaYAdoptante } from '../../repositories/formularioRepository'
import { obtenerMascotaPorId } from '../../repositories/mascotaRepository'

const DEFAULT_BLOQUES = [
  { id: 'foto_hogar', titulo: 'Foto del hogar', tipo: 'photo', placeholder: 'Subí una foto del espacio donde viviría la mascota' },
  { id: 'tipo_vivienda', titulo: '¿Qué tipo de vivienda tenés?', tipo: 'textarea', placeholder: 'Contanos si es casa, departamento, jardín, etc.' },
  { id: 'tiempo', titulo: '¿Cuánto tiempo podés dedicarle?', tipo: 'text', placeholder: 'Ej: 2 horas por día' },
]

export default function FormularioAdopcion() {
  const { id: mascotaId } = useParams()
  const navigate = useNavigate()
  const { usuario } = usarAuth()

  const [cargando, setCargando] = useState(true)
  const [bloques, setBloques] = useState(DEFAULT_BLOQUES)
  const [info, setInfo] = useState({})
  const [pagina, setPagina] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [mascota, setMascota] = useState(null)

  useEffect(() => {
    async function cargar() {
      if (!usuario) {
        navigate('/login')
        return
      }

      setCargando(true)

      const [mascotaRes, formularioRes, solicitudRes] = await Promise.all([
        obtenerMascotaPorId(mascotaId),
        obtenerFormularioMascota(mascotaId),
        obtenerSolicitudFormularioPorMascotaYAdoptante(mascotaId, usuario.id),
      ])

      if (mascotaRes.data) setMascota(mascotaRes.data)
      if (formularioRes.data?.bloques?.length) setBloques(formularioRes.data.bloques)
      if (solicitudRes.data?.info && Object.keys(solicitudRes.data.info).length > 0) {
        setInfo(solicitudRes.data.info)
      }

      setCargando(false)
    }

    cargar()
  }, [mascotaId, usuario, navigate])

const seccionActual = bloques[pagina]
const haySiguiente = pagina < bloques.length - 1
const hayAnterior = pagina > 0

function actualizarRespuesta(preguntaId, valor) {
  setInfo(prev => ({ ...prev, [preguntaId]: valor }))
}

function actualizarFotoArchivo(preguntaId, file) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    actualizarRespuesta(preguntaId, String(reader.result || ''))
  }
  reader.readAsDataURL(file)
}
  async function guardarAvance(nextPagina) {
    setGuardando(true)
    try {
      const res = await guardarProgresoSolicitud({
        mascotaId,
        adoptanteId: usuario.id,
        info,
        estado: 'Pendiente',
      })

      if (res.error) {
        alert(res.error.message || 'No se pudo guardar el progreso')
      } else if (typeof nextPagina === 'number') {
        setPagina(nextPagina)
      }
    } finally {
      setGuardando(false)
    }
  }

  async function enviarFormulario() {
    setGuardando(true)
    console.log(info)
    try {
      const res = await guardarProgresoSolicitud({
        mascotaId,
        adoptanteId: usuario.id,
        info,
        estado: 'revision',
      })

      if (res.error) {
        alert(res.error.message || 'No se pudo enviar la solicitud')
        return
      }

      navigate('/adoptante/perfil')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <Loader />

  return (
    <div className="pagina-formulario-adopcion">
      <div className="formulario-shell">
        <header className="formulario-topbar">
          <button className="btn-formulario ghost" onClick={() => navigate(-1)}>← Volver</button>
          <strong>{mascota?.nombre || 'Solicitud'}</strong>
        </header>

        <div className="formulario-steps" aria-label="Progreso del formulario">
          {bloques.map((_, index) => (
            <span key={index} className={`formulario-step ${index === pagina ? 'activo' : ''}`} />
          ))}
        </div>

      <section className="formulario-card">
  <h2>{seccionActual?.titulo}</h2>

  {seccionActual?.preguntas?.map((pregunta) => {
    const valor = info[pregunta.id] || ''

    return (
      <div key={pregunta.id} className="formulario-pregunta">
        <label>{pregunta.titulo}</label>
        {pregunta.placeholder && <p>{pregunta.placeholder}</p>}

        {pregunta.tipo === 'textarea' ? (
          <textarea
            className="formulario-textarea"
            value={valor}
            onChange={(e) => actualizarRespuesta(pregunta.id, e.target.value)}
          />
        ) : pregunta.tipo === 'photo' ? (
          <div className="solicitud-resumen">
            <input
              type="file"
              accept="image/*"
              className="formulario-input"
              onChange={(e) => actualizarFotoArchivo(pregunta.id, e.target.files?.[0])}
            />
            {valor && (
              <img src={valor} alt="Vista previa" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 12, marginTop: 8 }} />
            )}
          </div>
        ) : pregunta.tipo === 'multiple' ? (
          <div className="formulario-opciones">
            {(pregunta.opciones || []).map((op, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="radio"
                  name={pregunta.id}
                  value={op}
                  checked={valor === op}
                  onChange={(e) => actualizarRespuesta(pregunta.id, e.target.value)}
                />
                <span>{op}</span>
              </label>
            ))}
          </div>
        ) : (
          <input
            className="formulario-input"
            type="text"
            value={valor}
            placeholder={pregunta.placeholder}
            onChange={(e) => actualizarRespuesta(pregunta.id, e.target.value)}
          />
        )}
      </div>
    )
  })}
          <div className="formulario-bloque-acciones">
            <button
              type="button"
              className="btn-formulario ghost"
              disabled={!hayAnterior || guardando}
              onClick={() => {
                if (hayAnterior) {
                  guardarAvance(pagina - 1)
                }
              }}
            >
              Anterior
            </button>

            {haySiguiente ? (
              <button
                type="button"
                className="btn-formulario"
                disabled={guardando}
                onClick={() => guardarAvance(pagina + 1)}
              >
                {guardando ? 'Guardando...' : 'Guardar y continuar'}
              </button>
            ) : (
              <button
                type="button"
                className="btn-formulario"
                disabled={guardando}
                onClick={enviarFormulario}
              >
                {guardando ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
