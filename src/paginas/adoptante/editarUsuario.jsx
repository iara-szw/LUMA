import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Supabase } from '../../servicios/Supabase'
import { usarAuth } from '../../contexto/usarAuth'

export default function EditarUsuario() {
  const navigate = useNavigate()
  const { usuario } = usarAuth()

  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState(usuario?.nombre || '')
  const [apellido, setApellido] = useState(usuario?.apellido || '')
  const [telefono, setTelefono] = useState(usuario?.telefono || '')
  const [ciudad, setCiudad] = useState(usuario?.ciudad || '')
  const [provincia, setProvincia] = useState(usuario?.provincia || '')
  const [biografia, setBiografia] = useState(usuario?.biografia || '')

  async function guardarCambios(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await Supabase
      .from('usuarios')
      .update({ nombre, apellido, telefono, ciudad, provincia, biografia })
      .eq('id', usuario.id)

    if (error) {
      alert(error.message)
    } else {
      navigate('/adoptante/perfil')
    }

    setLoading(false)
  }

  return (
    <div className="pagina-editar">
      <header className="perfil-header">
        <button onClick={() => navigate(-1)}>← Editar perfil</button>
      </header>

      <form onSubmit={guardarCambios}>
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