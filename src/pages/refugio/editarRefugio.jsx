import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import { actualizarRefugio } from '../../repositories/perfilRefugioRepository'
import { subirAvatar } from '../../repositories/storageRepository'
import '../../styles/editarUsuario.css'

export default function EditarRefugio() {
  const navigate = useNavigate()
  const { refrescarUsuario, usuario } = usarAuth()

  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState(usuario?.nombre || '')
  const [descripcion, setDescripcion] = useState(usuario?.descripcion || '')
  const [telefono, setTelefono] = useState(usuario?.telefono || '')
  const [direccion, setDireccion] = useState(usuario?.direccion || '')
  const [ciudad, setCiudad] = useState(usuario?.ciudad || '')
  const [provincia, setProvincia] = useState(usuario?.provincia || '')
  const [instagram, setInstagram] = useState(usuario?.instagram || '')

  const [logoArchivo, setLogoArchivo] = useState(null)
  const [previewLogo, setPreviewLogo] = useState(usuario?.logo_url || null)

  const [portadaArchivo, setPortadaArchivo] = useState(null)
  const [previewPortada, setPreviewPortada] = useState(usuario?.portada_url || usuario?.foto_portada_url || null)

  async function guardarCambios(e) {
    e.preventDefault()
    setLoading(true)

    try {
      let logoUrl = null
      let portadaUrl = null

      if (logoArchivo) {
        const { url, error } = await subirAvatar(usuario.id, logoArchivo)
        if (error) {
          alert('No se pudo subir el logo. Intenta de nuevo.')
          setLoading(false)
          return
        }
        logoUrl = url
      }

      if (portadaArchivo) {
        const { url, error } = await subirAvatar(usuario.id, portadaArchivo)
        if (error) {
          alert('No se pudo subir la foto de portada. Intenta de nuevo.')
          setLoading(false)
          return
        }
        portadaUrl = url
      }

      const payload = { nombre, descripcion, telefono, direccion, ciudad, provincia, instagram }
      if (logoUrl) payload.logo_url = logoUrl
      if (portadaUrl) payload.portada_url = portadaUrl

      const { error } = await actualizarRefugio(usuario.id, payload)

      if (error) {
        alert(error.message || 'Error al actualizar perfil')
      } else {
        await refrescarUsuario()
        navigate('/refugio/perfil')
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
          <label>Logo</label>
          <div className="foto-preview" onClick={() => document.getElementById('logo-input').click()}>
            {previewLogo ? (
              <img src={previewLogo} alt="preview" />
            ) : (
              <div className="placeholder">Agregar logo</div>
            )}
          </div>
          <input id="logo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            setLogoArchivo(f)
            setPreviewLogo(URL.createObjectURL(f))
          }} />
        </div>

        <div className="foto-campo">
          <label>Foto de portada</label>
          <div className="foto-preview" onClick={() => document.getElementById('portada-input').click()}>
            {previewPortada ? (
              <img src={previewPortada} alt="preview" />
            ) : (
              <div className="placeholder">Agregar portada</div>
            )}
          </div>
          <input id="portada-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            setPortadaArchivo(f)
            setPreviewPortada(URL.createObjectURL(f))
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
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
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
          <label htmlFor="direccion">Dirección</label>
          <input
            id="direccion"
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
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
          <label htmlFor="instagram">Instagram</label>
          <input
            id="instagram"
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
