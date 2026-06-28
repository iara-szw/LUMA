import { Supabase } from '../services/supabase'

export async function obtenerPostulacionesDeUsuario(usuarioId) {
  const { data, error } = await Supabase
    .from('solicitudes')
    .select('id, estado, fecha_solicitud, mascotas(id, nombre, foto_url, refugios(nombre))')
    .eq('adoptante_id', usuarioId)
    .order('fecha_solicitud', { ascending: false })

  if (data) {
    const mapped = data.map(item => ({
      id: item.id,
      estado: item.estado,
      creado_en: item.fecha_solicitud,
      mascotas: item.mascotas,
      refugios: item.mascotas?.refugios,
    }))
    return { data: mapped, error }
  }
  return { data, error }
}

export async function obtenerCursosDeUsuario(usuarioId) {
  // Returns empty mock structure to prevent crashes due to missing DB tables
  return { data: [], error: null }
}

export async function obtenerGuardadosDeUsuario(usuarioId) {
  return Supabase
    .from('favoritos')
    .select('id, mascotas(id, nombre, foto_url, urgente)')
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })
}
