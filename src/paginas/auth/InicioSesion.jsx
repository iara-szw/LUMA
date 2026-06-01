import '../../css/auth.css'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Supabase } from '../../servicios/Supabase'

export default function IniciarSesion() {
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [cargando, setCargando] = useState(false)

  const manejarLogin = async () => {
    setError(null)
    setCargando(true)

    const { error } = await Supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.log(error)
      setError('Email o contraseña incorrectos')
      setCargando(false)
      return
    }

    navigate('/', { replace: true })
    setCargando(false)
  }

  return (
    <div className="pantalla-auth">
<img src="../../../cliente/public/assets/img/logo.png" alt="LUMA" className="logo-img" />
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

      {error && <p className="error">{error}</p>}

      <button onClick={manejarLogin} disabled={cargando}>
        {cargando ? 'Ingresando...' : 'Ingresar'}
      </button>

      <p>
        ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
      </p>

      <p>
        <Link to="/">Volver al inicio</Link>
      </p>
    </div>
  )
}