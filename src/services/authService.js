import { Supabase } from './supabase'

const ROLES = {
  adoptante: 'b89cc8e2-c8cc-4c9d-9394-87f7d995b4fe',
  refugio:   'f5346fd4-12d6-463b-bb40-d1872611cb39',
}

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
