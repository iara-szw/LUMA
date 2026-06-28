import { Supabase } from '../services/supabase'
import { ESTADOS } from '../services/authService'

export async function obtenerMascotasDeRefugio(refugioId) {
  return Supabase
    .from('mascotas')
    .select('id, nombre, edad, foto_url, urgente, especie_id')
    .eq('refugio_id', refugioId)
    .eq('estado_id', ESTADOS.publicada)
    .order('fecha_publicacion', { ascending: false })
}

export async function obtenerSolicitudesDeRefugio(refugioId) {
  const { data, error } = await Supabase
    .from('solicitudes')
    .select(
      'id, estado, fecha_solicitud, notas, usuarios:adoptante_id(id, nombre, foto_url), mascotas!inner(id, nombre, foto_url, refugio_id)'
    )
    .eq('mascotas.refugio_id', refugioId)
    .order('fecha_solicitud', { ascending: false })

  if (data) {
    const mapped = data.map(s => ({
      id: s.id,
      estado: s.estado === 'Pendiente' ? 'en_revision' : s.estado.toLowerCase(),
      creado_en: s.fecha_solicitud,
      es_nueva: s.estado === 'Pendiente',
      paso_actual: s.estado === 'Pendiente' ? 'formulario_completo' : s.estado === 'Aprobada' ? 'entrevista_sugerida' : 'en_revision',
      usuarios: s.usuarios,
      mascotas: s.mascotas,
    }))
    return { data: mapped, error }
  }
  return { data, error }
}

export async function obtenerEstadisticasDeRefugio(refugioId) {
  const [mascotasRes, solicitudesRes, eventosRes] = await Promise.all([
    Supabase
      .from('mascotas')
      .select('id', { count: 'exact', head: true })
      .eq('refugio_id', refugioId),
    Supabase
      .from('solicitudes')
      .select('id, mascotas!inner(refugio_id)', { count: 'exact', head: true })
      .eq('estado', 'Aprobada')
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
      adopciones: solicitudesRes.count || 0,
      eventos: eventosRes.count || 0,
    },
  }
}
