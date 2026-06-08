import '../../styles/auth.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registrarUsuario, ROLES } from '../../services/authService'
import { insertarUsuario, insertarRolUsuario } from '../../repositories/usuarioRepository'
import { insertarRefugio } from '../../repositories/refugioRepository'

export default function Registro() {
  const [nombre, setNombre]       = useState('')
  const [apellido, setApellido]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [telefono, setTelefono]   = useState('')
  const [ciudad, setCiudad]       = useState('')
  const [provincia, setProvincia] = useState('')
  const [rol, setRol]             = useState('adoptante')
  const [step, setStep] = useState(1)
  // campos de refugio (paso 2)
  const [refNombre, setRefNombre] = useState('')
  const [refDescripcion, setRefDescripcion] = useState('')
  const [refTelefonoResp, setRefTelefonoResp] = useState('')
  const [refDireccion, setRefDireccion] = useState('')
  const [estado, setEstado]         = useState('')
  const [cargando, setCargando]   = useState(false)

  const handleContinue = async () => {
    setEstado('')
    if (!nombre || !apellido || !email || !password) {
      setEstado('Completa todos los campos obligatorios')
      return
    }
    if (password.length < 6) {
      setEstado('La contrasena debe tener al menos 6 caracteres')
      return
    }

    // si es adoptante, crear cuenta ahora; si es refugio, pasar al paso 2
    if (rol === 'adoptante') {
      await manejarRegistroFinal()
    } else {
      setStep(2)
    }
  }

  const manejarRegistroFinal = async () => {
    setEstado('')
    setCargando(true)

    const { data, error: authError } = await registrarUsuario(email, password)

    if (authError) {
      setEstado(authError.message?.includes('already') ? 'Email ya en uso' : authError.message)
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

    if (rol === 'refugio') {
      if (!refNombre || !refDescripcion || !refTelefonoResp || !refDireccion) {
        setEstado('Completa los datos del refugio')
        setCargando(false)
        return
      }

      const { error: refugioError } = await insertarRefugio(uid, {
        nombre: refNombre,
        descripcion: refDescripcion,
        telefono_responsable: refTelefonoResp,
        direccion: refDireccion,
      })

      if (refugioError) {
        setEstado('No se pudo crear el refugio: ' + refugioError.message)
        setCargando(false)
        return
      }
    }

    setEstado('Usuario creado exitosamente')
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
      {step === 1 && (
        <>
          <input type="text"     placeholder="Nombre *"     value={nombre} id="Nombre"   onChange={e => setNombre(e.target.value)} />
          <input type="text"     placeholder="Apellido *"   value={apellido} id="Apellido" onChange={e => setApellido(e.target.value)} />
          <input type="email"    placeholder="Email *"      value={email}    id="Mail" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Contraseña *" value={password} id="Password" onChange={e => setPassword(e.target.value)} />
          <input type="tel"      placeholder="Telefono"   pattern="[0-9]{2} [0-9]{4}-[0-9]{4}"  value={telefono} id="Telefono" onChange={e => setTelefono(e.target.value)} />
          <input type="text"     placeholder="Ciudad"       value={ciudad}   id="Ciudad" onChange={e => setCiudad(e.target.value)} />
          <input type="text"     placeholder="Provincia"    value={provincia} id="Provincia" onChange={e => setProvincia(e.target.value)} />
        </>
      )}

      {step === 2 && (
        <div className="datos-refugio">
          <input type="text" placeholder="Nombre del refugio *" value={refNombre} onChange={e => setRefNombre(e.target.value)} />
          <input type="text" placeholder="Descripcion *" value={refDescripcion} onChange={e => setRefDescripcion(e.target.value)} />
          <input type="tel" placeholder="Telefono responsable *" value={refTelefonoResp} onChange={e => setRefTelefonoResp(e.target.value)} />
          <input type="text" placeholder="Direccion *" value={refDireccion} onChange={e => setRefDireccion(e.target.value)} />
        </div>
      )}
      {estado && <p className="estado">{estado}</p>}

      {step === 1 ? (
        <button type="button" onClick={handleContinue} disabled={cargando}>
          {cargando ? 'Creando cuenta...' : (rol === 'adoptante' ? 'Crear cuenta' : 'Siguiente')}
        </button>
      ) : (
        <div style={{display: 'flex', gap: '0.5rem', width: '100%'}}>
          <button type="button" onClick={() => setStep(1)} disabled={cargando} style={{flex: 1, background: 'transparent', border: '1.5px solid #E0D5CC'}}>
            Volver
          </button>
          <button type="button" onClick={manejarRegistroFinal} disabled={cargando} style={{flex: 1}}>
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </div>
      )}

      <p>¿Ya tenes cuenta? <Link to="/login">Iniciar sesión</Link></p>

      <p><Link to="/">Volver al inicio</Link></p>
    </div>
  )
}
