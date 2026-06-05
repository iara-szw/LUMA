import { Supabase } from '../services/supabase'

export async function obtenerPostulacionesDeUsuario(usuarioId) {
  return Supabase
    .from('postulaciones')
    .select('id, estado, creado_en, mascotas(id, nombre, foto_url), refugios(nombre)')
    .eq('usuario_id', usuarioId)
    .order('creado_en', { ascending: false })
}

export async function obtenerCursosDeUsuario(usuarioId) {
  return Supabase
    .from('cursos_usuario')
    .select('id, completado, cursos(id, nombre)')
    .eq('usuario_id', usuarioId)
}

export async function obtenerGuardadosDeUsuario(usuarioId) {
  return Supabase
    .from('guardados')
    .select('id, mascotas(id, nombre, foto_url, urgente)')
    .eq('usuario_id', usuarioId)
    .order('creado_en', { ascending: false })
}
