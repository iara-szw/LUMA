import { Supabase } from '../services/supabase'
import { ESTADOS } from '../services/authService'

export async function obtenerPostulacionesDeUsuario(usuarioId) {
  if (!usuarioId) return { data: [], error: null }

  const { data, error } = await Supabase
    .from('solicitudes')
    .select('id, estado, fecha_solicitud, mascota_id, mascotas(id, nombre, foto_url, refugios(nombre))')
    .eq('adoptante_id', usuarioId)
    .eq('eliminada', false)
    .order('fecha_solicitud', { ascending: false })

  if (error) return { data: [], error }

  const mascotaIds = [...new Set((data || []).map(item => item.mascota_id).filter(Boolean))]
  let mapaMascotas = new Map()

  if (mascotaIds.length) {
    const { data: mascotasData, error: errorMascotas } = await Supabase
      .from('mascotas')
      .select('id, nombre, foto_url, refugios(nombre)')
      .in('id', mascotaIds)

    if (!errorMascotas) {
      (mascotasData || []).forEach(m => mapaMascotas.set(m.id, m))
    }
  }

  const mapped = (data || []).map(item => {
    const mascota = item.mascotas || mapaMascotas.get(item.mascota_id) || null

    return {
      id: item.id,
      estado: item.estado,
      creado_en: item.fecha_solicitud,
      mascota_id: item.mascota_id,
      mascotas: mascota,
      refugios: mascota?.refugios || item.mascotas?.refugios || null,
      nombre_mascota: mascota?.nombre || 'Mascota',
    }
  })

  return { data: mapped, error: null }
}

export async function obtenerCursosDeUsuario(usuarioId) {
  // Returns empty mock structure to prevent crashes due to missing DB tables
  return { data: [], error: null }
}

export async function obtenerGuardadosDeUsuario(usuarioId) {
  if (!usuarioId) return { data: [], error: null }

  const { data: favoritos, error: errorFavoritos } = await Supabase
    .from('favoritos')
    .select('id, mascota_id, fecha')
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })

  if (errorFavoritos) return { data: [], error: errorFavoritos }

  const mascotaIds = [...new Set((favoritos || []).map(f => f.mascota_id).filter(Boolean))]
  if (!mascotaIds.length) return { data: [], error: null }

  const { data: mascotas, error: errorMascotas } = await Supabase
    .from('mascotas')
    .select('id, nombre, foto_url, urgente, adoptado, estado_id')
    .in('id', mascotaIds)

  if (errorMascotas) return { data: [], error: errorMascotas }

  const mapaMascotas = new Map((mascotas || []).map(m => [m.id, m]))

  const resultado = (favoritos || [])
    .map(fav => ({
      id: fav.id,
      mascota_id: fav.mascota_id,
      fecha: fav.fecha,
      mascotas: mapaMascotas.get(fav.mascota_id) || null,
    }))
    .filter(item => item.mascotas)

  return { data: resultado, error: null }
}
