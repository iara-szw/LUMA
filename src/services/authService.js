import { Supabase } from './supabase'

const ROLES = {
  adoptante: 'b89cc8e2-c8cc-4c9d-9394-87f7d995b4fe',
  refugio:   'f5346fd4-12d6-463b-bb40-d1872611cb39',
}

const ESTADOS={
  adoptada: '31d5d4a1-2d4f-4f56-8f31-68b76c8ae5d5',
  pausada: '68ad868b-a90e-4b1b-a2dd-489cf325a5ce',
  Reservada: 'cb6f2916-550e-4429-8596-09360c48d9f3',
  publicada:'de53d3f0-4100-4599-9547-56983e23e30d'
}
export  {ESTADOS}
export { ROLES }

export async function obtenerSesionActual() {
  return Supabase.auth.getSession()
}

export function suscribirCambiosAuth(callback) {
  return Supabase.auth.onAuthStateChange(callback)
}

export async function iniciarSesion(email, password) {
  return Supabase.auth.signInWithPassword({ email, password })
}

export async function cerrarSesion() {
  return Supabase.auth.signOut({ scope: 'local' })
}

export async function registrarUsuario(email, password) {
  return Supabase.auth.signUp({ email, password })
}
