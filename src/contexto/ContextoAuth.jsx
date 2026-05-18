import { createContext, useContext, useEffect, useState } from 'react'
import { Supabase } from '../servicios/Supabase'

const ContextoAuth = createContext(null)

export function ProveedorAuth({ children })
   {  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarSesion = async () => {
      const { data: { session } } = await Supabase.auth.getSession()
      if (session?.user) await cargarPerfil(session.user.id)
      setCargando(false)
    }

    const { data: { subscription } } = Supabase.auth.onAuthStateChange(
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
  try {

    const promesa = Supabase
      .from('usuarios')
      .select('*')
      .eq('id', uid)
      .maybeSingle()

    const resultado = await Promise.race([
      promesa,
      new Promise((_, reject) =>
        setTimeout(() => reject('TIMEOUT'), 5000)
      )
    ])


  } catch (e) {
    console.log('ERROR:', e)
  }
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