import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import '../../styles/formularios.css'
import {
  obtenerFormularioMascota,
  guardarFormularioMascota,
  FORMULARIO_DEFAULT,
} from '../../repositories/formularioRepository'
import { obtenerMascotaPorId } from '../../repositories/mascotaRepository'
import ConfirmModal from '../../components/ConfirmModal'

const TIPOS = [
  { valor: 'text', label: 'Texto corto' },
  { valor: 'textarea', label: 'Texto largo' },
  { valor: 'photo', label: 'Foto' },
  { valor: 'multiple', label: 'Opciones' },
]

function IconoBasura() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
    </svg>
  )
}

export default function EditarFormularioMascota() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = usarAuth()

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mascota, setMascota] = useState(null)
  const [bloquesFormulario, setBloquesFormulario] = useState(FORMULARIO_DEFAULT)
  const [modalConfirmacion, setModalConfirmacion] = useState({ isOpen: false, indexSeccion: null, indexPregunta: null, tipo: null })

  useEffect(() => {
    async function cargar() {
      if (!usuario) {
        navigate('/login')
        return
      }

      setCargando(true)
      const [{ data }, formularioRes] = await Promise.all([
        obtenerMascotaPorId(id),
        obtenerFormularioMascota(id),
      ])

      if (!data) {
        navigate(-1)
        return
      }

      if (data.refugio_id !== usuario.id) {
        navigate('/refugio/perfil')
        return
      }

      setMascota(data)
      setBloquesFormulario(formularioRes?.data?.bloques || FORMULARIO_DEFAULT)
      setCargando(false)
    }

    void cargar()
  }, [id, usuario, navigate])

  function actualizarSeccion(indexSeccion, campo, valor) {
    setBloquesFormulario(prev =>
      prev.map((s, i) => (i === indexSeccion ? { ...s, [campo]: valor } : s))
    )
  }

  function actualizarPregunta(indexSeccion, indexPregunta, campo, valor) {
    setBloquesFormulario(prev =>
      prev.map((s, i) => {
        if (i !== indexSeccion) return s
        return {
          ...s,
          preguntas: s.preguntas.map((p, j) => {
            if (j !== indexPregunta) return p
            // Si se cambia el tipo a multiple y no hay opciones, inicializar
            if (campo === 'tipo' && valor === 'multiple') {
              return { ...p, tipo: valor, opciones: p.opciones && p.opciones.length ? p.opciones : ['Opción 1', 'Opción 2'] }
            }
            // Actualizar opciones completas cuando se pasa un array
            if (campo === 'opciones') {
              return { ...p, opciones: Array.isArray(valor) ? valor : p.opciones }
            }
            return { ...p, [campo]: valor }
          }),
        }
      })
    )
  }

  function agregarSeccion() {
    setBloquesFormulario(prev => [
      ...prev,
      { id: `seccion_${Date.now()}`, titulo: 'Nueva sección', preguntas: [] },
    ])
  }

  function agregarPregunta(indexSeccion) {
    setBloquesFormulario(prev =>
      prev.map((s, i) => {
        if (i !== indexSeccion) return s
        return {
          ...s,
          preguntas: [
            ...s.preguntas,
            { id: `pregunta_${Date.now()}`, titulo: 'Nueva pregunta', tipo: 'text', placeholder: '', obligatorio: true },
          ],
        }
      })
    )
  }

  function quitarPregunta(indexSeccion, indexPregunta) {
    setModalConfirmacion({
      isOpen: true,
      indexSeccion,
      indexPregunta,
      tipo: 'pregunta',
    })
  }

  function quitarSeccion(indexSeccion) {
    setModalConfirmacion({
      isOpen: true,
      indexSeccion,
      tipo: 'seccion',
    })
  }

  async function confirmarAccion() {
    setModalConfirmacion(prev => ({ ...prev, isOpen: false }))

    if (modalConfirmacion.tipo === 'pregunta') {
      const { indexSeccion, indexPregunta } = modalConfirmacion
      setBloquesFormulario(prev =>
        prev.map((s, i) => {
          if (i !== indexSeccion) return s
          return { ...s, preguntas: s.preguntas.filter((_, j) => j !== indexPregunta) }
        })
      )
    } else if (modalConfirmacion.tipo === 'seccion') {
      const { indexSeccion } = modalConfirmacion
      setBloquesFormulario(prev => prev.filter((_, i) => i !== indexSeccion))
    }
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)

    const { error } = await guardarFormularioMascota(id, bloquesFormulario)

    if (error) {
      alert(error.message)
      setGuardando(false)
      return
    }

    navigate(`/refugio/editarMascota/${id}`)
  }

  if (cargando) return <Loader />

  return (
    <div className="fe-pagina">
      <header className="fe-header">
        <button type="button" className="fe-btn-volver" onClick={() => navigate(-1)} aria-label="Volver">←</button>
        <div className="fe-header-info">
          <h1 className="fe-titulo">Formulario de adopción</h1>
          <span className="fe-subtitulo">Para {mascota?.nombre || 'tu mascota'}</span>
        </div>
      </header>

      <form className="fe-contenido" onSubmit={guardar}>
        <p className="fe-intro">
          Armá las preguntas que verán los adoptantes. El orden de las secciones define el recorrido por páginas.
        </p>

        {bloquesFormulario.map((seccion, indexSeccion) => (
          <section key={seccion.id || indexSeccion} className="fe-seccion">
            <div className="fe-seccion-cabecera">
              <span className="fe-seccion-numero">{indexSeccion + 1}</span>
              <input
                className="fe-input fe-input--seccion"
                value={seccion.titulo || ''}
                placeholder="Título de la sección"
                aria-label="Título de la sección"
                onChange={(e) => actualizarSeccion(indexSeccion, 'titulo', e.target.value)}
              />
              <button
                type="button"
                className="fe-icono-btn"
                aria-label="Quitar sección"
                onClick={() => quitarSeccion(indexSeccion)}
              >
                <IconoBasura />
              </button>
            </div>

            {seccion.preguntas.length === 0 && (
              <p className="fe-vacio">Esta sección todavía no tiene preguntas.</p>
            )}

            {seccion.preguntas.map((pregunta, indexPregunta) => (
              <div key={pregunta.id || indexPregunta} className="fe-pregunta">
                <div className="fe-pregunta-cabecera">
                  <span className="fe-pregunta-etiqueta">Pregunta {indexPregunta + 1}</span>
                  <button
                    type="button"
                    className="fe-link-peligro"
                    onClick={() => quitarPregunta(indexSeccion, indexPregunta)}
                  >
                    Quitar
                  </button>
                </div>

                <label className="fe-campo">
                  <span>Pregunta</span>
                  <input
                    className="fe-input"
                    value={pregunta.titulo || ''}
                    placeholder="Ej: ¿Cuánto tiempo podés dedicarle?"
                    onChange={(e) => actualizarPregunta(indexSeccion, indexPregunta, 'titulo', e.target.value)}
                  />
                </label>

                <div className="fe-campo">
                  <span>Tipo de respuesta</span>
                  <div className="fe-chips" role="group" aria-label="Tipo de respuesta">
                    {TIPOS.map(t => (
                      <button
                        key={t.valor}
                        type="button"
                        className={`fe-chip ${(pregunta.tipo || 'text') === t.valor ? 'activo' : ''}`}
                        onClick={() => actualizarPregunta(indexSeccion, indexPregunta, 'tipo', t.valor)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(pregunta.tipo === 'text' || pregunta.tipo === 'textarea' || !pregunta.tipo) && (
                  <label className="fe-campo">
                    <span>Texto de ayuda (placeholder)</span>
                    <input
                      className="fe-input"
                      value={pregunta.placeholder || ''}
                      placeholder="Ej: 2 horas por día"
                      onChange={(e) => actualizarPregunta(indexSeccion, indexPregunta, 'placeholder', e.target.value)}
                    />
                  </label>
                )}

                {pregunta.tipo === 'multiple' && (
                  <div className="fe-campo">
                    <span>Opciones</span>
                    <ul className="fe-opciones">
                      {(pregunta.opciones || []).map((op, idx) => (
                        <li key={idx} className="fe-opcion">
                          <span className="fe-opcion-punto" aria-hidden="true" />
                          <input
                            className="fe-input"
                            value={op}
                            onChange={(e) =>
                              actualizarPregunta(
                                indexSeccion,
                                indexPregunta,
                                'opciones',
                                (pregunta.opciones || []).map((o, i) => (i === idx ? e.target.value : o))
                              )
                            }
                          />
                          <button
                            type="button"
                            className="fe-icono-btn fe-icono-btn--chico"
                            aria-label="Eliminar opción"
                            onClick={() => {
                              const nueva = (pregunta.opciones || []).filter((_, i) => i !== idx)
                              actualizarPregunta(indexSeccion, indexPregunta, 'opciones', nueva)
                            }}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="fe-btn-texto"
                      onClick={() => {
                        const nueva = [...(pregunta.opciones || []), `Opción ${(pregunta.opciones || []).length + 1}`]
                        actualizarPregunta(indexSeccion, indexPregunta, 'opciones', nueva)
                      }}
                    >
                      + Añadir opción
                    </button>
                  </div>
                )}

                <label className="fe-switch">
                  <input
                    type="checkbox"
                    checked={pregunta.obligatorio !== false}
                    onChange={(e) => actualizarPregunta(indexSeccion, indexPregunta, 'obligatorio', e.target.checked)}
                  />
                  <span className="fe-switch-pista" />
                  <span>Respuesta obligatoria</span>
                </label>
              </div>
            ))}

            <button type="button" className="fe-btn-agregar" onClick={() => agregarPregunta(indexSeccion)}>
              + Agregar pregunta
            </button>
          </section>
        ))}

        <button type="button" className="fe-btn-agregar fe-btn-agregar--seccion" onClick={agregarSeccion}>
          + Agregar sección
        </button>

        <div className="fe-barra-acciones">
          <button
            type="button"
            className="fe-btn fe-btn--secundario"
            onClick={() => navigate(`/refugio/editarMascota/${id}`)}
          >
            Cancelar
          </button>
          <button type="submit" className="fe-btn fe-btn--primario" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar formulario'}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={modalConfirmacion.isOpen}
        title={modalConfirmacion.tipo === 'pregunta' ? 'Eliminar pregunta' : 'Eliminar sección'}
        message={modalConfirmacion.tipo === 'pregunta'
          ? '¿Estás seguro que querés eliminar esta pregunta?'
          : '¿Estás seguro que querés eliminar esta sección?'}
        confirmText="Eliminar"
        onConfirm={confirmarAccion}
        onCancel={() => setModalConfirmacion({ isOpen: false, indexSeccion: null, indexPregunta: null, tipo: null })}
      />
    </div>
  )
}