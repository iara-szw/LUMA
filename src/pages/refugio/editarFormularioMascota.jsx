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

  function actualizarBloque(index, campo, valor) {
    setBloquesFormulario(prev => prev.map((bloque, i) => i === index ? { ...bloque, [campo]: valor } : bloque))
  }

  function agregarBloque() {
    setBloquesFormulario(prev => [
      ...prev,
      {
        id: `pregunta_${Date.now()}`,
        titulo: 'Nueva pregunta',
        tipo: 'text',
        placeholder: 'Escribí la consigna o ejemplo',
        obligatorio: true,
      },
    ])
  }

  function quitarBloque(index) {
    setBloquesFormulario(prev => prev.filter((_, i) => i !== index))
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
          <button className="btn-formulario ghost" onClick={() => navigate(-1)}>← Volver</button>
          <strong>{mascota?.nombre || 'Formulario'}</strong>
        </header>

        <section className="formulario-card">
          <h2>Editar formulario de adopción</h2>
          <p>Armá los bloques que verán los adoptantes. El orden define el recorrido por páginas.</p>

          <form onSubmit={guardar} className="formulario-editor-lista">
            {bloquesFormulario.map((bloque, index) => (
              <div key={bloque.id || index} className="formulario-editor-bloque">
                <div className="row">
                  <label>
                    Título
                    <input
                      className="formulario-input"
                      value={bloque.titulo || ''}
                      onChange={(e) => actualizarBloque(index, 'titulo', e.target.value)}
                    />
                  </label>

                  <label>
                    Tipo
                    <select
                      className="formulario-select"
                      value={bloque.tipo || 'text'}
                      onChange={(e) => actualizarBloque(index, 'tipo', e.target.value)}
                    >
                      <option value="text">Texto corto</option>
                      <option value="textarea">Texto largo</option>
                      <option value="photo">Foto</option>
                    </select>
                  </label>
                </div>

                <label>
                  Placeholder
                  <input
                    className="formulario-input"
                    value={bloque.placeholder || ''}
                    onChange={(e) => actualizarBloque(index, 'placeholder', e.target.value)}
                  />
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={bloque.obligatorio !== false}
                    onChange={(e) => actualizarBloque(index, 'obligatorio', e.target.checked)}
                  />
                  Obligatorio
                </label>

                <button type="button" className="btn-formulario ghost" onClick={() => quitarBloque(index)}>
                  Quitar bloque
                </button>
              </div>
            ))}

            <button type="button" className="btn-anadir-bloque" onClick={agregarBloque}>
              + Agregar bloque
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
