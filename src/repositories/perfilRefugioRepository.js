import { Supabase } from '../services/supabase'

export async function obtenerMascotasDeRefugio(refugioId) {
  return Supabase
    .from('mascotas')
    .select('id, nombre, especie, tipo, edad, foto_url, urgente')
    .eq('refugio_id', refugioId)
    .eq('estado', 1)
    .order('creado_en', { ascending: false })
}

export async function obtenerSolicitudesDeRefugio(refugioId) {
  return Supabase
    .from('postulaciones')
    .select(
      'id, estado, creado_en, es_nueva, paso_actual, usuarios(id, nombre, foto_url), mascotas(id, nombre, foto_url, refugio_id)'
    )
    .eq('mascotas.refugio_id', refugioId)
    .order('creado_en', { ascending: false })
}

export async function obtenerEstadisticasDeRefugio(refugioId) {
  const [mascotasRes, adopcionesRes, eventosRes] = await Promise.all([
    Supabase
      .from('mascotas')
      .select('id', { count: 'exact', head: true })
      .eq('refugio_id', refugioId),
    Supabase
      .from('postulaciones')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'aprobada')
      .eq('mascotas.refugio_id', refugioId),
    Supabase
      .from('eventos')
      .select('id', { count: 'exact', head: true })
      .eq('refugio_id', refugioId),
  ])

  return {
    data: {
      mascotas: mascotasRes.count || 0,
      voluntarios: 0,
      adopciones: adopcionesRes.count || 0,
      eventos: eventosRes.count || 0,
    },
  }
}
