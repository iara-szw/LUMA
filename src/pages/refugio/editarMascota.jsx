import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import Loader from '../../components/Loader'
import '../../styles/editarMascota.css'
import {
  obtenerMascotaPorId,
  actualizarMascota
} from '../../repositories/mascotaRepository'
import { subirAvatar } from '../../repositories/storageRepository'
import '../../styles/editarUsuario.css'

export default function EditarMascota() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = usarAuth()

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [nombre, setNombre] = useState('')
  const [edad, setEdad] = useState('')
  const [sexo, setSexo] = useState('')
  const [tamaño, setTamaño] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [vacunado, setVacunado] = useState(false)
  const [castrado, setCastrado] = useState(false)
  const [desparasitado, setDesparasitado] = useState(false)
  const [problemasSalud, setProblemasSalud] = useState(false)
  const [detalleSalud, setDetalleSalud] = useState('')
  const [urgente, setUrgente] = useState(false)
  const [fechaRescate, setFechaRescate] = useState('')
  const [fechaAdopcion, setFechaAdopcion] = useState('')

  const [fotoArchivo, setFotoArchivo] = useState(null)
  const [previewFoto, setPreviewFoto] = useState(null)

  async function cargar() {
    setCargando(true)
    const { data } = await obtenerMascotaPorId(id)

    if (!data) {
      navigate(-1)
      return
    }

    if (data.refugio_id !== usuario.id) {
      navigate('/refugio/perfil')
      return
    }

    setNombre(data.nombre || '')
    setEdad(data.edad || '')
    setSexo(data.sexo || '')
    setTamaño(data.tamaño || '')
    setDescripcion(data.descripcion || '')
    setVacunado(data.vacunado === true)
    setCastrado(data.castrado === true)
    setDesparasitado(data.desparasitado === true)
    setProblemasSalud(data.problemas_salud === true)
    setDetalleSalud(data.detalle_salud || '')
    setUrgente(data.urgente === true)
    setFechaRescate(data.fecha_rescate || '')
    setFechaAdopcion(data.fecha_adopcion || '')
    setPreviewFoto(data.foto_url)

    setCargando(false)
  }

  useEffect(() => {
    void cargar()
  }, [id, usuario?.id, navigate])

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)

    let foto = null
    if (fotoArchivo) {
      const { url } = await subirAvatar(usuario.id, fotoArchivo)
      foto = url
    }

    const payload = {
      nombre,
      edad,
      sexo,
      tamaño,
      descripcion,
      vacunado: Boolean(vacunado),
      castrado: Boolean(castrado),
      desparasitado: Boolean(desparasitado),
      problemas_salud: Boolean(problemasSalud),
      detalle_salud: detalleSalud,
      urgente: Boolean(urgente),
      fecha_rescate: fechaRescate || null,
      fecha_adopcion: fechaAdopcion || null,
      foto_url: foto || previewFoto,
    }

    const { error } = await actualizarMascota(id, payload)

    if (error) {
      alert(error.message)
      setGuardando(false)
      return
    }

    navigate(`/mascota/${id}`)
  }

  if (cargando) return <Loader />

  return (
    <div className="pagina-editar">
      <header className="perfil-header">
        <button onClick={() => navigate(-1)}>← Editar mascota</button>
      </header>

      <form onSubmit={guardar}>
        {/* Foto */}
        <div className="foto-campo">
          <label>Foto</label>
          <div className="foto-preview" onClick={() => document.getElementById('foto').click()}>
            {previewFoto ? <img src={previewFoto} alt="" /> : <div className="placeholder">Agregar foto</div>}
          </div>
          <input
            id="foto"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              if (!archivo) return
              setFotoArchivo(archivo)
              setPreviewFoto(URL.createObjectURL(archivo))
            }}
          />
        </div>

        {/* Campos de texto */}
        <label>Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />

        <label>Edad</label>
        <input value={edad} onChange={(e) => setEdad(e.target.value)} />
            
        <label>Sexo</label>
        <select value={sexo} onChange={(e) => setSexo(e.target.value)}>
          <option value="">Seleccionar</option>
          <option>Macho</option>
          <option>Hembra</option>
        </select>

        <label>Tamaño</label>
        <select value={tamaño} onChange={(e) => setTamaño(e.target.value)}>
          <option value="">Seleccionar</option>
          <option>Pequeño</option>
          <option>Mediano</option>
          <option>Grande</option>
        </select>

        <label>Descripción</label>
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />

        <label>Detalle de salud</label>
        <textarea value={detalleSalud} onChange={(e) => setDetalleSalud(e.target.value)} />

        <label>Fecha rescate</label>
        <input type="date" value={fechaRescate || ''} onChange={(e) => setFechaRescate(e.target.value)} />

        <label>Fecha adopción</label>
        <input type="date" value={fechaAdopcion || ''} onChange={(e) => setFechaAdopcion(e.target.value)} />

        {/* Checkboxes */}
        <label>
          <input type="checkbox" checked={vacunado} onChange={(e) => setVacunado(e.target.checked)} />
          Vacunado
        </label>

        <label>
          <input type="checkbox" checked={castrado} onChange={(e) => setCastrado(e.target.checked)} />
          Castrado
        </label>

        <label>
          <input type="checkbox" checked={desparasitado} onChange={(e) => setDesparasitado(e.target.checked)} />
          Desparasitado
        </label>

        <label>
          <input type="checkbox" checked={problemasSalud} onChange={(e) => setProblemasSalud(e.target.checked)} />
          Problemas de salud
        </label>

        <label>
          <input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} />
          Adopción urgente
        </label>

     <div className="formulario-bloque-acciones">
          <button type="button" className="btn-formulario" onClick={() => navigate(`/refugio/editarFormulario/${id}`)}>
            Editar formulario
          </button>
        </div>

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
