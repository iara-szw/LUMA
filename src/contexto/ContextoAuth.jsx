import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../servicios/Supbase'

const ContextoAuth = createContext(null)

export function ProveedorAuth({ children })
   {  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) await cargarPerfil(session.user.id)
      setCargando(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_evento, session) => {
        if (session?.user) {
          await cargarPerfil(session.user.id)
        } else {
          setUsuario(null)
        }
        setCargando(false)
      }
    )

    cargarSesion()
    return () => subscription.unsubscribe()
  }, [])

  const cargarPerfil = async (uid) => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', uid)
      .single()
    if (!error) setUsuario(data)
  }

  const valor = {
    usuario,      
    cargando,
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

export const usarAuth = () => {
  const ctx = useContext(ContextoAuth)
  if (!ctx) throw new Error('usarAuth debe usarse dentro de ProveedorAuth')
  return ctx
}