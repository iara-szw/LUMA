import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { usarAuth } from '../hooks/UsarAuth'
import {
  contarMensajesNoLeidos,
  suscribirseANoLeidosGlobal,
  desuscribirse,
} from '../repositories/chatRepository'

const ContextoChat = createContext(null)

export function ProveedorChat({ children }) {
  const { usuario, esRefugio } = usarAuth()
  const [noLeidos, setNoLeidos] = useState(0)
  const channelRef = useRef(null)

  const refrescarContador = async () => {
    if (!usuario?.id) {
      setNoLeidos(0)
      return
    }
    const { count } = await contarMensajesNoLeidos(usuario.id, esRefugio)
    setNoLeidos(count)
  }

  useEffect(() => {
    if (!usuario?.id) {
      setNoLeidos(0)
      return
    }

    refrescarContador()

    channelRef.current = suscribirseANoLeidosGlobal(usuario.id, () => {
      setNoLeidos(prev => prev + 1)
    })

    return () => {
      desuscribirse(channelRef.current)
      channelRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id, esRefugio])

  return (
    <ContextoChat.Provider value={{ noLeidos, refrescarContador }}>
      {children}
    </ContextoChat.Provider>
  )
}

export function usarChat() {
  const ctx = useContext(ContextoChat)
  if (!ctx) throw new Error('usarChat debe usarse dentro de ProveedorChat')
  return ctx
}