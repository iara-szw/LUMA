import { createContext, useContext, useEffect, useState } from 'react'
import { Supabase } from '../servicios/Supabase'
export const ContextoAuth = createContext(null)
export function ProveedorAuth({ children })
   {  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
   const cargarSesion = async () => {
  const { data: { session } } = await Supabase.auth.getSession()
  if (session?.user) {
    await cargarPerfil(session.user.id) 
  }
  setCargando(false) 
}
    const { data: { subscription } } = Supabase.auth.onAuthStateChange(
      async (evento, session) => {
        if (evento === 'INITIAL_SESSION') return

        if (session?.user) {
          cargarPerfil(session.user.id)
        } else {
          setUsuario(null)
        }
      }
    )

    cargarSesion()
    return () => subscription.unsubscribe()
  }, [])

  const ROLES = {
    'b89cc8e2-c8cc-4c9d-9394-87f7d995b4fe': 'adoptante',
    'f5346fd4-12d6-463b-bb40-d1872611cb39': 'refugio',
  }

  const cargarPerfil = async (uid) => {
    try {
      const [{ data: perfil }, { data: roles }] = await Promise.all([
        Supabase.from('usuarios').select('*').eq('id', uid).maybeSingle(),
        Supabase.from('usuarios_roles').select('rol_id').eq('usuario_id', uid).limit(1),
      ])

      if (!perfil) {
        setUsuario(null)
        return
      }

      const rol = roles?.[0]?.rol_id ? ROLES[roles[0].rol_id] : null
      setUsuario({ ...perfil, rol })
    } catch (e) {
      console.log('ERROR:', e)
      setUsuario(null)
    }
  }

const cerrarSesion = async () => {
  await Supabase.auth.signOut({ scope: 'local' }) 
  setUsuario(null)
}
const valor = {
  usuario,
  cargando,
  cerrarSesion,
  esAdoptante: usuario?.rol === 'adoptante',
  esRefugio:   usuario?.rol === 'refugio',
}
  return (
<>
    <ContextoAuth.Provider value={valor}>
      {children}
    </ContextoAuth.Provider>
  </>)
}
