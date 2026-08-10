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

export default function EditarFormularioMascota() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = usarAuth()

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mascota, setMascota] = useState(null)
  const [bloquesFormulario, setBloquesFormulario] = useState(FORMULARIO_DEFAULT)

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
    prev.map((s, i) => i === indexSeccion ? { ...s, [campo]: valor } : s)
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
          // Actualizar opciones completos cuando se pasa un array
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
  const confirmar = window.confirm('¿Estás seguro que querés eliminar esta pregunta?')
  if (!confirmar) return

  setBloquesFormulario(prev =>
    prev.map((s, i) => {
      if (i !== indexSeccion) return s
      return { ...s, preguntas: s.preguntas.filter((_, j) => j !== indexPregunta) }
    })
  )
}

function quitarSeccion(indexSeccion) {
  const confirmar = window.confirm('¿Estás seguro que querés eliminar esta sección?')
  if (!confirmar) return

  setBloquesFormulario(prev => prev.filter((_, i) => i !== indexSeccion))
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
    <div className="pagina-formulario-adopcion">
      <div className="formulario-shell">
        <header className="formulario-topbar">
          <button className="btn-formulario volver" onClick={() => navigate(-1)}>← Volver</button>
          <strong>{mascota?.nombre || 'Formulario'}</strong>
        </header>

        <section className="formulario-card">
          <h2>Editar formulario de adopción</h2>
          <p>Armá los bloques que verán los adoptantes. El orden define el recorrido por páginas.</p>

          <form onSubmit={guardar} className="formulario-editor-lista">
           {bloquesFormulario.map((seccion, indexSeccion) => (
  <div key={seccion.id || indexSeccion} className="formulario-editor-seccion">
    <label>
      Título de la sección
      <input
        className="formulario-input"
        value={seccion.titulo || ''}
        onChange={(e) => actualizarSeccion(indexSeccion, 'titulo', e.target.value)}
      />
    </label>

    {seccion.preguntas.map((pregunta, indexPregunta) => (
      <div key={pregunta.id || indexPregunta} className="formulario-editor-bloque">
        <div className="row">
          <label>
            Título
            <input
              className="formulario-input"
              value={pregunta.titulo || ''}
              onChange={(e) => actualizarPregunta(indexSeccion, indexPregunta, 'titulo', e.target.value)}
            />
          </label>

          <label>
            Tipo
            <select
              className="formulario-select"
              value={pregunta.tipo || 'text'}
              onChange={(e) => actualizarPregunta(indexSeccion, indexPregunta, 'tipo', e.target.value)}
            >
              <option value="text">Texto corto</option>
              <option value="textarea">Texto largo</option>
              <option value="photo">Foto</option>
              <option value="multiple">Multiple choice</option>
            </select>
          </label>
        </div>

        <label>
          Placeholder
          <input
            className="formulario-input"
            value={pregunta.placeholder || ''}
            onChange={(e) => actualizarPregunta(indexSeccion, indexPregunta, 'placeholder', e.target.value)}
          />
        </label>

        {pregunta.tipo === 'multiple' && (
          <div className="editor-opciones">
            <label>Opciones</label>
            {(pregunta.opciones || []).map((op, idx) => (
              <div key={idx} className="row" style={{ gap: 8, alignItems: 'center' }}>
                <input
                  className="formulario-input"
                  value={op}
                  onChange={(e) => actualizarPregunta(indexSeccion, indexPregunta, 'opciones', (pregunta.opciones || []).map((o, i) => i === idx ? e.target.value : o))}
                />
                <button type="button" className="btn-formulario-eliminar" onClick={() => {
                  const nueva = (pregunta.opciones || []).filter((_, i) => i !== idx)
                  actualizarPregunta(indexSeccion, indexPregunta, 'opciones', nueva)
                }}>Eliminar</button>
              </div>
            ))}

            <button type="button" className="btn-anadir-pregunta" onClick={() => {
              const nueva = [ ...(pregunta.opciones || []), `Opción ${(pregunta.opciones || []).length + 1}` ]
              actualizarPregunta(indexSeccion, indexPregunta, 'opciones', nueva)
            }}>+ Añadir opción</button>
          </div>
        )}

        <button type="button" className="btn-formulario quitar" onClick={() => quitarPregunta(indexSeccion, indexPregunta)}>
          Quitar pregunta
        </button>
      </div>
    ))}

    <button type="button" className="btn-anadir-pregunta" onClick={() => agregarPregunta(indexSeccion)}>
      + Agregar pregunta a esta sección
    </button>

    <button type="button" className="btn-formulario quitar" onClick={() => quitarSeccion(indexSeccion)}>
      Quitar sección
    </button>
  </div>
))}

<button type="button" className="btn-anadir-bloque" onClick={agregarSeccion}>
  + Agregar sección
</button>

            <div className="formulario-bloque-acciones">
              <button type="button" className="btn-formulario ghost" onClick={() => navigate(`/refugio/editarMascota/${id}`)}>
                Cancelar
              </button>
              <button type="submit" className="btn-guardar-formulario" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar formulario'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
