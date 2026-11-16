import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import { actualizarPerfil } from '../../repositories/usuarioRepository'
import { subirAvatar } from '../../repositories/storageRepository'
import '../../styles/editarUsuario.css'

export default function EditarUsuario() {
  const navigate = useNavigate()
  const { refrescarUsuario, usuario } = usarAuth()

  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState(usuario?.nombre || '')
  const [apellido, setApellido] = useState(usuario?.apellido || '')
  const [telefono, setTelefono] = useState(usuario?.telefono || '')
  const [ciudad, setCiudad] = useState(usuario?.ciudad || '')
  const [provincia, setProvincia] = useState(usuario?.provincia || '')
  const [biografia, setBiografia] = useState(usuario?.biografia || '')
  const [fotoArchivo, setFotoArchivo] = useState(null)
  const [previewFoto, setPreviewFoto] = useState(usuario?.foto_url || null)

  async function guardarCambios(e) {
    e.preventDefault()
    setLoading(true)

    try {
      let fotoUrl = null
      if (fotoArchivo) {
        const { url, error } = await subirAvatar(usuario.id, fotoArchivo)
        if (error) {
          alert('No se pudo subir la foto. Intenta de nuevo.')
          setLoading(false)
          return
        }
        fotoUrl = url
      }
      const payload = { nombre, apellido, telefono, ciudad, provincia, biografia }
      if (fotoUrl) payload.foto_url = fotoUrl
      const { error } = await actualizarPerfil(usuario.id, payload)

      if (error) {
        alert(error.message)
      } else {
        await refrescarUsuario()
        navigate('/adoptante/perfil')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pagina-editar">
      <header className="perfil-header">
        <button onClick={() => navigate(-1)}>← Editar perfil</button>
      </header>

      <form onSubmit={guardarCambios}>
        <div className="foto-campo">
          <label>Foto de perfil</label>
          <div className="foto-preview" onClick={() => document.getElementById('foto-input').click()}>
            {previewFoto ? (
              <img src={previewFoto} alt="preview" />
            ) : (
              <div className="placeholder">Agregar foto</div>
            )}
          </div>
          <input id="foto-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            setFotoArchivo(f)
            setPreviewFoto(URL.createObjectURL(f))
          }} />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="text" value={usuario?.email || ''} disabled />
        </div>
        <div>
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="apellido">Apellido</label>
          <input
            id="apellido"
            type="text"
            required
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="telefono">Teléfono</label>
          <input
            id="telefono"
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="ciudad">Ciudad</label>
          <input
            id="ciudad"
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="provincia">Provincia</label>
          <input
            id="provincia"
            type="text"
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="biografia">Sobre mí</label>
          <textarea
            id="biografia"
            value={biografia}
            onChange={(e) => setBiografia(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
