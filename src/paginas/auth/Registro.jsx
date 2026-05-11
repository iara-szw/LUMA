
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../servicios/Supbase'

export default function Registro() {
  const [nombre, setNombre]     = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol]           = useState('adoptante') // 'adoptante' o 'refugio'
  const [error, setError]       = useState(null)
  const [cargando, setCargando] = useState(false)

  const manejarRegistro = async () => {
    setError(null)

    // Validación mínima antes de llamar a Supabase
    if (!nombre || !email || !password) {
      setError('Completá todos los campos')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setCargando(true)

    // PASO 1: Crear el usuario en el sistema de autenticación de Supabase
    // Esto guarda email + contraseña de forma segura (nunca en nuestra tabla)
    const { data, error: errorAuth } = await supabase.auth.signUp({ email, password })

    if (errorAuth) {
      setError('No se pudo crear la cuenta. Probá con otro email.')
      setCargando(false)
      return
    }

    // PASO 2: Guardar el perfil en nuestra tabla "perfiles"
    // Usamos el ID que Supabase le asignó al usuario nuevo
    const { error: errorPerfil } = await supabase
      .from('perfiles')
      .insert({
        id: data.user.id,  // mismo ID que el usuario de auth
        nombre,
        rol,
      })

    if (errorPerfil) {
      setError('Cuenta creada pero hubo un problema al guardar el perfil.')
      setCargando(false)
      return
    }

    // Listo. Supabase inicia sesión automáticamente después del signUp.
    // El ContextoAuth detecta la sesión → redirige según rol.
    setCargando(false)
  }

  return (
    <div className="pantalla-auth">
      <h1 className="logo">LUMA</h1>
      <h2>Crear cuenta</h2>

      {/* El usuario elige qué tipo de cuenta quiere */}
      <div className="selector-rol">
        <button
          className={rol === 'adoptante' ? 'activo' : ''}
          onClick={() => setRol('adoptante')}
        >
          Quiero adoptar
        </button>
        <button
          className={rol === 'refugio' ? 'activo' : ''}
          onClick={() => setRol('refugio')}
        >
          Soy un refugio
        </button>
      </div>

      <input
        type="text"
        placeholder={rol === 'refugio' ? 'Nombre del refugio' : 'Tu nombre'}
        value={nombre}
        onChange={e => setNombre(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Contraseña (mínimo 6 caracteres)"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      {error && <p className="error">{error}</p>}

      <button onClick={manejarRegistro} disabled={cargando}>
        {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>

      <p>
        ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
      </p>
    </div>
  )
}