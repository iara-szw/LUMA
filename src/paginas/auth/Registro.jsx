import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supbase } from '../../servicios/supbase'

const ROLES = {
  adoptante: 'b89cc8e2-c8cc-4c9d-9394-87f7d995b4fe',
  refugio: 'f5346fd4-12d6-463b-bb40-d1872611cb39',
}

export default function Registro() {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [telefono, setTelefono] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [rol, setRol] = useState('adoptante')

  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const manejarRegistro = async () => {
    try {
      setError('')
      setCargando(true)

      if (!nombre || !apellido || !email || !password) {
        throw new Error('Completá todos los campos obligatorios')
      }

      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }

      // Crear usuario auth
      const { data, error: authError } = await supbase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (!data.user) {
        throw new Error('No se pudo crear el usuario')
      }

      const uid = data.user.id

      // Insertar usuario
      const { error: usuarioError } = await supbase
        .from('usuarios')
        .insert([
          {
            id: uid,
            nombre,
            apellido,
            email,
            telefono: telefono || null,
            ciudad: ciudad || null,
            provincia: provincia || null,
            activo: true,
          },
        ])

      if (usuarioError) throw usuarioError

      // Insertar rol
      const { error: rolError } = await supbase
        .from('usuarios_roles')
        .insert([
          {
            usuario_id: uid,
            rol_id: ROLES[rol],
          },
        ])

      if (rolError) throw rolError

      alert('Cuenta creada correctamente')

    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="pantalla-auth">
      <h1 className="logo">LUMA</h1>
      <h2>Crear cuenta</h2>

      <div className="selector-rol">
        <button
          type="button"
          className={rol === 'adoptante' ? 'activo' : ''}
          onClick={() => setRol('adoptante')}
        >
          Quiero adoptar
        </button>

        <button
          type="button"
          className={rol === 'refugio' ? 'activo' : ''}
          onClick={() => setRol('refugio')}
        >
          Soy un refugio
        </button>
      </div>

      <input
        type="text"
        placeholder="Nombre *"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />

      <input
        type="text"
        placeholder="Apellido *"
        value={apellido}
        onChange={(e) => setApellido(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Contraseña *"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="tel"
        placeholder="Teléfono"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
      />

      <input
        type="text"
        placeholder="Ciudad"
        value={ciudad}
        onChange={(e) => setCiudad(e.target.value)}
      />

      <input
        type="text"
        placeholder="Provincia"
        value={provincia}
        onChange={(e) => setProvincia(e.target.value)}
      />

      {error && <p className="error">{error}</p>}

      <button
        type="button"
        onClick={manejarRegistro}
        disabled={cargando}
      >
        {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>

      <p>
        ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
      </p>
    </div>
  )
}