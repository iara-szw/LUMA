import { Supabase } from '../services/supabase'

// El refugio agenda una entrevista para una solicitud puntual
export async function crearEntrevista({ solicitud_id, responsable_id, fecha, modalidad, notas }) {
  return Supabase
    .from('entrevistas')
    .insert({ solicitud_id, responsable_id, fecha, modalidad, notas })
    .select()
    .single()
}

// Reprogramar fecha/modalidad, cargar resultado, editar notas, etc.
export async function actualizarEntrevista(id, cambios) {
  return Supabase.from('entrevistas').update(cambios).eq('id', id).select().single()
}

export async function obtenerEntrevistaPorSolicitud(solicitudId) {
  return Supabase
    .from('entrevistas')
    .select('*')
    .eq('solicitud_id', solicitudId)
    .maybeSingle()
}

// Todas las entrevistas del adoptante logueado (para armar su calendario)
export async function obtenerEntrevistasAdoptante(usuarioId) {
  return Supabase
    .from('entrevistas')
    .select(`
      *,
      solicitudes!inner (
        adoptante_id,
        mascota_id,
        mascotas ( nombre, refugio_id, refugios ( nombre ) )
      )
    `)
    .eq('solicitudes.adoptante_id', usuarioId)
    .order('fecha', { ascending: true })
}

// Todas las entrevistas que un refugio tiene agendadas (para su propio calendario)
export async function obtenerEntrevistasRefugio(refugioId) {
  return Supabase
    .from('entrevistas')
    .select(`
      *,
      solicitudes!inner (
        adoptante_id,
        mascota_id,
        mascotas!inner ( refugio_id, nombre ),
        usuarios ( nombre, apellido )
      )
    `)
    .eq('solicitudes.mascotas.refugio_id', refugioId)
    .order('fecha', { ascending: true })
}