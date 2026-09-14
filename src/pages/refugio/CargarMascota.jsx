import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import { crearMascotaRefugio, idEspeciePorNombre } from '../../repositories/mascotaRepository'
import { subirFotoMascota } from '../../repositories/storageRepository'
import '../../styles/cargarMascota.css'

const ESTADO_INICIAL = {
  nombre: '',
  especie: '',
  edad: '',
  sexo: '',
  tamaño: '',
  descripcion: '',
  vacunado: false,
  castrado: false,
  desparasitado: false,
  problemasSalud: false,
  detalleSalud: '',
  urgente: false,
  fechaRescate: '',
  fechaAdopcion: '',
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

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setErrorEnvio(null)

    if (!validar()) return
    if (!usuario?.id) {
      setErrorEnvio('No se pudo identificar el refugio. Inicia sesión nuevamente.')
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
        edad: form.edad.trim(),
        sexo: form.sexo,
        tamaño: form.tamaño,
        descripcion: form.descripcion.trim(),
        vacunado: form.vacunado,
        castrado: form.castrado,
        desparasitado: form.desparasitado,
        problemas_salud: form.problemasSalud,
        detalle_salud: form.detalleSalud.trim(),
        urgente: form.urgente,
        fecha_rescate: form.fechaRescate || null,
        fecha_adopcion: form.fechaAdopcion || null,
        foto_url: fotoUrl,
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

        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="edad">Edad aproximada</label>
          <input
            id="edad"
            type="text"
            className="cargar-input"
            placeholder="Ej: 2 años, 6 meses..."
            value={form.edad}
            onChange={e => actualizarCampo('edad', e.target.value)}
          />
        </section>

        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="sexo">Sexo</label>
          <select
            id="sexo"
            className="cargar-input cargar-select"
            value={form.sexo}
            onChange={e => actualizarCampo('sexo', e.target.value)}
          >
            <option value="">Seleccionar</option>
            <option value="Macho">Macho</option>
            <option value="Hembra">Hembra</option>
          </select>
        </section>

        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="tamaño">Tamaño</label>
          <select
            id="tamaño"
            className="cargar-input cargar-select"
            value={form.tamaño}
            onChange={e => actualizarCampo('tamaño', e.target.value)}
          >
            <option value="">Seleccionar</option>
            <option value="Pequeño">Pequeño</option>
            <option value="Mediano">Mediano</option>
            <option value="Grande">Grande</option>
          </select>
        </section>

        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            className="cargar-input cargar-textarea"
            placeholder="Contá su personalidad, historia y detalles relevantes..."
            value={form.descripcion}
            onChange={e => actualizarCampo('descripcion', e.target.value)}
          />
        </section>

        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="detalleSalud">Detalle de salud</label>
          <textarea
            id="detalleSalud"
            className="cargar-input cargar-textarea"
            placeholder="Especificá si tiene alergias, medicación, etc."
            value={form.detalleSalud}
            onChange={e => actualizarCampo('detalleSalud', e.target.value)}
          />
        </section>

        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="fechaRescate">Fecha de rescate</label>
          <input
            id="fechaRescate"
            type="date"
            className="cargar-input"
            value={form.fechaRescate}
            onChange={e => actualizarCampo('fechaRescate', e.target.value)}
          />
        </section>

        <section className="cargar-tarjeta">
          <label className="cargar-label" htmlFor="fechaAdopcion">Fecha de adopción</label>
          <input
            id="fechaAdopcion"
            type="date"
            className="cargar-input"
            value={form.fechaAdopcion}
            onChange={e => actualizarCampo('fechaAdopcion', e.target.value)}
          />
        </section>

        <section className="cargar-tarjeta cargar-tarjeta--checks">
          <label className="cargar-checkbox-fila" htmlFor="vacunado">
            <span>Vacunado</span>
            <input
              id="vacunado"
              type="checkbox"
              checked={form.vacunado}
              onChange={e => actualizarCampo('vacunado', e.target.checked)}
            />
          </label>

          <label className="cargar-checkbox-fila" htmlFor="castrado">
            <span>Castrado</span>
            <input
              id="castrado"
              type="checkbox"
              checked={form.castrado}
              onChange={e => actualizarCampo('castrado', e.target.checked)}
            />
          </label>

          <label className="cargar-checkbox-fila" htmlFor="desparasitado">
            <span>Desparasitado</span>
            <input
              id="desparasitado"
              type="checkbox"
              checked={form.desparasitado}
              onChange={e => actualizarCampo('desparasitado', e.target.checked)}
            />
          </label>

          <label className="cargar-checkbox-fila" htmlFor="problemasSalud">
            <span>Problemas de salud</span>
            <input
              id="problemasSalud"
              type="checkbox"
              checked={form.problemasSalud}
              onChange={e => actualizarCampo('problemasSalud', e.target.checked)}
            />
          </label>

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
        {exito && <p className="cargar-exito">Mascota publicada</p>}

        <button type="submit" className="cargar-btn-guardar" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Publicar mascota'}
        </button>
      </form>
    </div>
  )
}
