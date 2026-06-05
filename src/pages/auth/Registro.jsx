import '../../styles/auth.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registrarUsuario, ROLES } from '../../services/authService'
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
  const [estado, setEstado]         = useState('')
  const [cargando, setCargando]   = useState(false)

  const manejarRegistro = async () => {
    setEstado('')
   if (!nombre || !apellido || !email || !password) {
  setEstado('Completa todos los campos obligatorios')
  return
}
if (password.length < 6) {
  setEstado('La contrasena debe tener al menos 6 caracteres')
  return
}

setCargando(true)

const { data, error: authError } = await registrarUsuario(email, password)

if (authError) {
  if(authError.message="User already registered"){
  setEstado("Email ya en uso")

  }
  setCargando(false)
  return
}

const uid = data.user.id
const { error: usuarioError } = await insertarUsuario(uid, { nombre, apellido, email, telefono, ciudad, provincia })
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

setEstado("Usuario creado exitosamente")
setCargando(false)
  }

  return (
    <div className="pantalla-auth">
<img src="../../../cliente/public/assets/img/logo.png" alt="LUMA" className="logo-img" />
      <div className="selector-rol">
        <button type="button" className={rol === 'adoptante' ? 'activo' : ''} onClick={() => setRol('adoptante')}>
          Quiero adoptar
        </button>
        <button type="button" className={rol === 'refugio' ? 'activo' : ''} onClick={() => setRol('refugio')}>
          Soy un refugio
        </button>
      </div>

      <input type="text"     placeholder="Nombre *"     value={nombre} id="Nombre"   onChange={e => setNombre(e.target.value)} />
      <input type="text"     placeholder="Apellido *"   value={apellido} id="Apellido" onChange={e => setApellido(e.target.value)} />
      <input type="email"    placeholder="Email *"      value={email}    id="Mail" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Contraseña *" value={password} id="Password" onChange={e => setPassword(e.target.value)} />
      <input type="tel"      placeholder="Telefono"     value={telefono} id="Telefono" onChange={e => setTelefono(e.target.value)} />
      <input type="text"     placeholder="Ciudad"       value={ciudad}   id="Ciudad" onChange={e => setCiudad(e.target.value)} />
      <input type="text"     placeholder="Provincia"    value={provincia} id="Provincia" onChange={e => setProvincia(e.target.value)} />

      {estado && <p className="estado">{estado}</p>}

      <button type="button" onClick={manejarRegistro} disabled={cargando}>
        {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>

      <p>¿Ya tenes cuenta? <Link to="/login">Iniciar sesión</Link></p>

      <p><Link to="/">Volver al inicio</Link></p>
    </div>
  )
}
