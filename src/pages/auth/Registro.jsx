import '../../styles/auth.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registrarUsuario, ROLES } from '../../services/authService'
import { Supabase } from '../../services/supabase'
import { insertarUsuario, insertarRolUsuario } from '../../repositories/usuarioRepository'

export default function Registro() {
  const [nombre, setNombre]       = useState('')
  const [apellido, setApellido]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [telefono, setTelefono]   = useState('')
  const [ciudad, setCiudad]       = useState('')
  const [provincia, setProvincia] = useState('')
  const [rol, setRol]             = useState('adoptante')
  const [estado, setEstado]       = useState('')
  const [cargando, setCargando]  = useState(false)

  const esRefugio = rol === 'refugio'

  const manejarRegistro = async () => {
    setEstado('')

    const nombreTrim = nombre.trim()
    const apellidoTrim = apellido.trim()
    const emailTrim = email.trim()
    const telefonoTrim = telefono.trim()
    const ciudadTrim = ciudad.trim()
    const provinciaTrim = provincia.trim()
    const passwordTrim = password.trim()

    if (!nombreTrim || (!esRefugio && !apellidoTrim) || !emailTrim || !passwordTrim) {
      setEstado('Completa todos los campos obligatorios')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setEstado('Ingresá un email válido')
      return
    }

    if (passwordTrim.length < 6) {
      setEstado('La contrasena debe tener al menos 6 caracteres')
      return
    }

    if (telefonoTrim && !/^\d{2,4}[\s-]?\d{4}[\s-]?\d{4}$/.test(telefonoTrim)) {
      setEstado('Ingresá un teléfono válido')
      return
    }

    setCargando(true)

    const { data, error: authError } = await registrarUsuario(emailTrim, passwordTrim)

    if (authError) {
      if (authError.message === "User already registered") {
        setEstado("Email ya en uso")
      } else {
        setEstado(authError.message)
      }
      setCargando(false)
      return
    }

    const uid = data.user.id
    const apellidoFinal = esRefugio ? 'REFUGIO' : apellidoTrim
    const { error: usuarioError } = await insertarUsuario(uid, {
      nombre: nombreTrim,
      apellido: apellidoFinal,
      email: emailTrim,
      telefono: telefonoTrim || null,
      ciudad: ciudadTrim || null,
      provincia: provinciaTrim || null,
    })

    if (usuarioError) {
      setEstado('No se pudo guardar el perfil: ' + usuarioError.message)
      setCargando(false)
      return
    }

    const { error: rolError } = await insertarRolUsuario(uid, ROLES[rol])

    if (rolError) {
      setEstado('No se pudo asignar el rol: ' + rolError.message)
      setCargando(false)
      return
    }

    if (esRefugio) {
      const { error: refugioError } = await Supabase
        .from('refugios')
        .upsert({
          id: uid,
          nombre: nombreTrim,
          ciudad: ciudadTrim || null,
          provincia: provinciaTrim || null,
          telefono: telefonoTrim || null,
          descripcion: '',
        }, { onConflict: 'id' })

      if (refugioError) {
        setEstado('Se creó el usuario, pero no se pudo crear el perfil del refugio: ' + refugioError.message)
        setCargando(false)
        return
      }
    }

    setEstado("Usuario creado exitosamente")
    setCargando(false)
  }

  return (
    <div className="auth-page">
      <div className="pantalla-auth">
        <img src="/assets/img/logo.png" alt="LUMA" className="logo-img" />
        <div className="selector-rol">
          <button type="button" className={rol === 'adoptante' ? 'activo' : ''} onClick={() => setRol('adoptante')}>
            Quiero adoptar
          </button>
          <button type="button" className={rol === 'refugio' ? 'activo' : ''} onClick={() => setRol('refugio')}>
            Soy un refugio
          </button>
        </div>

        <input type="text" placeholder={esRefugio ? 'Nombre del refugio *' : 'Nombre *'} value={nombre} id="Nombre" onChange={e => setNombre(e.target.value)} />
        {!esRefugio && (
          <input type="text" placeholder="Apellido *" value={apellido} id="Apellido" onChange={e => setApellido(e.target.value)} />
        )}
        <input type="email" placeholder="Email *" value={email} id="Mail" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Contraseña *" value={password} id="Password" onChange={e => setPassword(e.target.value)} />
        <input type="tel" placeholder="Telefono" pattern="[0-9]{2} [0-9]{4}-[0-9]{4}" value={telefono} id="Telefono" onChange={e => setTelefono(e.target.value)} />
        <input type="text" placeholder="Ciudad" value={ciudad} id="Ciudad" onChange={e => setCiudad(e.target.value)} />
        <input type="text" placeholder="Provincia" value={provincia} id="Provincia" onChange={e => setProvincia(e.target.value)} />

        {estado && <p className="estado">{estado}</p>}

        <button type="button" onClick={manejarRegistro} disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p>¿Ya tenes cuenta? <Link to="/login">Iniciar sesión</Link></p>

        <p><Link to="/">Volver al inicio</Link></p>
      </div>
    </div>
  )
}
