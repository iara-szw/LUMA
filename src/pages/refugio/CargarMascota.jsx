import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import {ESTADOS} from '../../services/authService'
import { crearMascotaRefugio, idEspeciePorNombre } from '../../repositories/mascotaRepository'
import { subirFotoMascota } from '../../repositories/storageRepository'
import '../../styles/cargarMascota.css'

const ESTADO_INICIAL = {
  nombre: '',
  especie: '',
  tipo: '',
  edad: '',
  urgente: false,
}

export default function CargarMascota() {
  const navigate = useNavigate()
  const { usuario } = usarAuth()
  const inputFotoRef = useRef(null)

  const [form, setForm] = useState(ESTADO_INICIAL)
  const [archivoFoto, setArchivoFoto] = useState(null)
  const [previewFoto, setPreviewFoto] = useState(null)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState(null)
  const [exito, setExito] = useState(false)

  const actualizarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
    if (errores[campo]) {
      setErrores(prev => ({ ...prev, [campo]: null }))
    }
  }

  const manejarSeleccionFoto = (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setArchivoFoto(archivo)
    setPreviewFoto(URL.createObjectURL(archivo))
  }

  const validar = () => {
    const nuevosErrores = {}
    if (!form.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio.'
    if (!form.especie) nuevosErrores.especie = 'Elegí una especie.'
    if (!form.tipo.trim()) nuevosErrores.tipo = 'Indica el tipo o raza.'
    if (!form.edad.trim()) nuevosErrores.edad = 'Indica la edad aproximada.'

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setErrorEnvio(null)

    if (!validar()) return
    if (!usuario?.id) {
      setErrorEnvio('No se pudo identificar el refugio. Inicia sesion nuevamente.')
      return
    }

    setGuardando(true)

    try {
      let fotoUrl = null

      if (archivoFoto) {
        const { url, error: errorFoto } = await subirFotoMascota(usuario.id, archivoFoto)
        if (errorFoto) {
          setErrorEnvio('No se pudo subir la foto. Intenta de nuevo.')
          setGuardando(false)
          return
        }
        fotoUrl = url
      }

      const res = await crearMascotaRefugio(usuario.id, {
        nombre: form.nombre.trim(),
        especie: idEspeciePorNombre(form.especie),
        tipo: form.tipo.trim(),
        edad: form.edad.trim(),
        foto_url: fotoUrl,
        urgente: form.urgente,
      })

      if (res?.error) {
        console.error('Error creando mascota:', res.error)
        const msg = res.error?.message || 'No se pudo guardar la mascota. Intenta de nuevo.'
        setErrorEnvio(msg)
        setGuardando(false)
        return
      }

      setExito(true)
      setTimeout(() => navigate('/refugio/dashboard'), 1200)
    } catch {
      setErrorEnvio('Ocurrío un error inesperado. Intenta de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <div className="cargar-pagina">

      {/* Header */}
      <header className="cargar-header">
        <button
          className="cargar-volver"
          aria-label="Volver"
          onClick={() => navigate('/refugio/dashboard')}
        >
          <span className="cargar-volver-icono">←</span>
        </button>
        <h1 className="cargar-titulo">Cargar mascota</h1>
      </header>

      <form className="cargar-form" onSubmit={manejarEnvio}>

        {/* Foto */}
        <section className="cargar-tarjeta cargar-tarjeta--foto">
          <div
            className="cargar-foto-zona"
            onClick={() => inputFotoRef.current?.click()}
          >
            {previewFoto ? (
              <img src={previewFoto} alt="Vista previa" className="cargar-foto-preview" />
            ) : (
              <div className="cargar-foto-placeholder">
                <span className="cargar-foto-icono">+</span>
                <span>Agregar foto</span>
              </div>
            )}
          </div>
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            className="cargar-foto-input"
            onChange={manejarSeleccionFoto}
          />
          <div className="cargar-foto-pie">
            <span>Ficha principal</span>
          </div>
        </section>

        {/* Nombre */}
        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            className="cargar-input"
            placeholder="Ej: Pipa"
            value={form.nombre}
            onChange={e => actualizarCampo('nombre', e.target.value)}
          />
          {errores.nombre && <span className="cargar-error">{errores.nombre}</span>}
        </section>

        {/* Especie */}
        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="especie">Especie</label>
          <select
            id="especie"
            className="cargar-input cargar-select"
            value={form.especie}
            onChange={e => actualizarCampo('especie', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
          </select>
          {errores.especie && <span className="cargar-error">{errores.especie}</span>}
        </section>

        {/* Tipo / Raza */}
        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="tipo">Tipo / Raza</label>
          <input
            id="tipo"
            type="text"
            className="cargar-input"
            placeholder="Ej: Mestizo, Labrador..."
            value={form.tipo}
            onChange={e => actualizarCampo('tipo', e.target.value)}
          />
          {errores.tipo && <span className="cargar-error">{errores.tipo}</span>}
        </section>

        {/* Edad */}
        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="edad">Edad aproximada</label>
          <input
            id="edad"
            type="text"
            className="cargar-input"
            placeholder="Ej: 2 aÃ±os"
            value={form.edad}
            onChange={e => actualizarCampo('edad', e.target.value)}
          />
          {errores.edad && <span className="cargar-error">{errores.edad}</span>}
        </section>

        {/* Urgente */}
        <section className="cargar-tarjeta cargar-tarjeta--urgente">
          <label className="cargar-checkbox-fila" htmlFor="urgente">
            <span>Marcar como urgente</span>
            <input
              id="urgente"
              type="checkbox"
              checked={form.urgente}
              onChange={e => actualizarCampo('urgente', e.target.checked)}
            />
          </label>
        </section>

        {errorEnvio && <p className="cargar-error cargar-error--general">{errorEnvio}</p>}
        {exito && <p className="cargar-exito">Mascota publicada âœ“</p>}

        <button type="submit" className="cargar-btn-guardar" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Publicar mascota'}
        </button>

      </form>
    </div>
  )
}
