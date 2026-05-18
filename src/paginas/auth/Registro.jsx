import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Supabase } from '../../servicios/Supabase'

const ROLES = {
  adoptante: 'b89cc8e2-c8cc-4c9d-9394-87f7d995b4fe',
  refugio:   'f5346fd4-12d6-463b-bb40-d1872611cb39',
}

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

const { data, error: authError } = await Supabase.auth.signUp({ email, password })

if (authError) {
  if(authError.message="User already registered"){
  setEstado("Email ya en uso")

  }
  setCargando(false)
  return
}

const uid = data.user.id
const { error: usuarioError } = await Supabase
  .from('usuarios')
  .insert({
    id: uid,
    nombre: nombre,
    apellido: apellido,
    email: email,
    telefono:  telefono  || null,
    ciudad:    ciudad    || null,
    provincia: provincia || null,
    activo:    true,
  })
if (usuarioError) {
  setEstado('No se pudo guardar el perfil: ' + usuarioError.message)
  setCargando(false)
  return
}

const { error: rolError } = await Supabase
  .from('usuarios_roles')
  .insert({ usuario_id: uid, rol_id: ROLES[rol] })

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
      <h1 className="logo">LUMA</h1>
      <h2>Crear cuenta</h2>

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
    </div>
  )
}

