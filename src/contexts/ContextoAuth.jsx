import { createContext, useEffect, useState } from 'react'
import { obtenerPerfilConRol } from '../repositories/usuarioRepository'
import {
  obtenerSesionActual,
  suscribirCambiosAuth,
  cerrarSesion as cerrarSesionAuth,
} from '../services/authService'

export const ContextoAuth = createContext(null)

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarSesion = async () => {
      const { data: { session } } = await obtenerSesionActual()
      if (session?.user) {
        await cargarPerfil(session.user.id)
      }
      setCargando(false)
    }

    const { data: { subscription } } = suscribirCambiosAuth(
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

  const cargarPerfil = async (uid) => {
    try {
      const perfil = await obtenerPerfilConRol(uid)
      setUsuario(perfil)
    } catch (e) {
      console.log('ERROR:', e)
      setUsuario(null)
    }
  }

  const cerrarSesion = async () => {
    await cerrarSesionAuth()
    setUsuario(null)
  }

  const valor = {
    usuario,
    cargando,
    cerrarSesion,
    refrescarUsuario: () => cargarPerfil(usuario?.id),
    esAdoptante: usuario?.rol === 'adoptante',
    esRefugio:   usuario?.rol === 'refugio',
  }

  return (
    <>
      <ContextoAuth.Provider value={valor}>
        {children}
      </ContextoAuth.Provider>
    </>
  )
}
