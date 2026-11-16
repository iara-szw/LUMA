import { useContext } from 'react'
import { ContextoAuth } from '../contexts/ContextoAuth'

export function usarAuth() {
  const ctx = useContext(ContextoAuth)
  if (!ctx) throw new Error('usarAuth debe usarse dentro de ProveedorAuth')
  return ctx
}           
