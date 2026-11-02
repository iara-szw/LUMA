import { useEffect, useState } from 'react'
import { usarAuth } from '../hooks/UsarAuth'
import { obtenerCantidadNoLeidas } from '../repositories/notificacionesRepository'
import { Supabase } from '../services/supabase'
import '../styles/notificaciones.css'

export default function NotiBadge({ refreshInterval = 30000 }) {
  const { usuario } = usarAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let activo = true

    const fetchCount = async () => {
      if (!usuario?.id) {
        if (activo) setCount(0)
        return
      }
      try {
        const res = await obtenerCantidadNoLeidas(usuario.id)
        if (!activo) return
        if (res && typeof res.count === 'number') setCount(res.count)
        else if (res && Array.isArray(res.data)) setCount(res.data.length)
        else setCount(0)
      } catch (e) {
        if (activo) setCount(0)
      }
    }

    if (!usuario?.id) {
      setCount(0)
      return () => { activo = false }
    }

    fetchCount()
    const id = setInterval(fetchCount, refreshInterval)

    const channel = Supabase
      .channel(`notificaciones:${usuario.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${usuario.id}`,
        },
        () => fetchCount()
      )
      .subscribe()

    return () => {
      activo = false
      clearInterval(id)
      Supabase.removeChannel(channel)
    }
  }, [usuario?.id, refreshInterval])

  if (!count) return null

  return (
    <span className="luma-noti-badge" aria-hidden>{count > 99 ? '99+' : count}</span>
  )
}
