import { Supabase } from '../services/supabase'

const ROLES = {
  'b89cc8e2-c8cc-4c9d-9394-87f7d995b4fe': 'adoptante',
  'f5346fd4-12d6-463b-bb40-d1872611cb39': 'refugio',
}

export async function obtenerPerfilConRol(uid) {
  const [{ data: perfil }, { data: roles }] = await Promise.all([
    Supabase.from('usuarios').select('*').eq('id', uid).maybeSingle(),
    Supabase.from('usuarios_roles').select('rol_id').eq('usuario_id', uid).limit(1),
  ])

  if (!perfil) return null

  const rol = roles?.[0]?.rol_id ? ROLES[roles[0].rol_id] : null
  return { ...perfil, rol }
}

export async function actualizarPerfil(uid, { nombre, apellido, telefono, ciudad, provincia, biografia }) {
  return Supabase
    .from('usuarios')
    .update({ nombre, apellido, telefono, ciudad, provincia, biografia })
    .eq('id', uid)
}

export async function insertarUsuario(uid, { nombre, apellido, email, telefono, ciudad, provincia }) {
  return Supabase
    .from('usuarios')
    .insert({
      id: uid,
      nombre,
      apellido,
      email,
      telefono:  telefono  || null,
      ciudad:    ciudad    || null,
      provincia: provincia || null,
      activo:    true,
    })
}

export async function insertarRolUsuario(uid, rolId) {
  return Supabase
    .from('usuarios_roles')
    .insert({ usuario_id: uid, rol_id: rolId })
}
