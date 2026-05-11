
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supbase } from '../../servicios/Supbase'

export default function IniciarSesion() {
  const navigate = useNavigate()

  // Guardamos lo que escribe el usuario
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // Para mostrar errores y el estado de carga
  const [error, setError]       = useState(null)
  const [cargando, setCargando] = useState(false)

  const manejarLogin = async () => {
    setError(null)
    setCargando(true)

    // Le pedimos a Supabase que verifique email + contraseña
    const { error } = await supbase.auth.signInWithPassword({ email, password })

    if (error) {
console.log(error)   
   setError('Email o contraseña incorrectos')
      setCargando(false)
      return
    }

    // Si está bien, el ContextoAuth detecta la sesión nueva
    // y redirige solo según el rol. No hace falta hacer nada más acá.
    setCargando(false)
  }

  return (
    <div className="pantalla-auth">
      <h1 className="logo">LUMA</h1>
      <h2>Iniciar sesión</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      {/* Solo se muestra si hay un error */}
      {error && <p className="error">{error}</p>}

      <button onClick={manejarLogin} disabled={cargando}>
        {cargando ? 'Ingresando...' : 'Ingresar'}
      </button>

      <p>
        ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
      </p>
    </div>
  )
}