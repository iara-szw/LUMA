import '../../styles/auth.css'
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import { iniciarSesion } from '../../services/authService'

export default function IniciarSesion() {
  const navigate = useNavigate()
  const { usuario, cargando } = usarAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [cargandoForm, setCargandoForm] = useState(false)

  const manejarLogin = async () => {
    setError(null)
    setCargandoForm(true)

    const { error } = await iniciarSesion(email, password)

    if (error) {
      console.log(error)
      setError('Email o contraseña incorrectos')
      setCargandoForm(false)
      return
    }

    navigate('/', { replace: true })
    setCargandoForm(false)
  }

  useEffect(() => {
    // si ya está logeado, redirigir según rol
    if (!cargando && usuario) {
      if (usuario.rol === 'refugio') navigate('/refugio/dashboard', { replace: true })
      else navigate('/', { replace: true })
    }
  }, [usuario, cargando, navigate])

  return (
    <div className="auth-page">
      <div className="pantalla-auth">
<img src="/assets/img/logo.png" alt="LUMA" className="logo-img" />
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

      <button onClick={manejarLogin} disabled={cargandoForm}>
        {cargandoForm ? 'Ingresando...' : 'Ingresar'}
      </button>

      <p>
        ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
      </p>

      <p>
        <Link to="/">Volver al inicio</Link>
      </p>
    </div>
  </div>
  )
}
