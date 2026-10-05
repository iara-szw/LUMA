import { Supabase } from '../services/supabase'

// El refugio agenda una entrevista para una solicitud puntual
export async function crearEntrevista({
  solicitud_id = null,
  adoptante_id = null,
  refugio_id = null,
  fecha,
  modalidad = 'Presencial',
  lugar = '',
  duracion_minutos = 30,
  notas = '',
  estado_confirmacion = 'Pendiente',
  resultado = null,
}) {
  return Supabase
    .from('entrevistas')
    .insert({
      solicitud_id,
      adoptante_id,
      refugio_id,
      fecha,
      modalidad,
      lugar,
      duracion_minutos,
      notas,
      estado_confirmacion,
      resultado,
    })
    .select()
    .single()
}

export async function obtenerEntrevistasPorSolicitud(solicitudId) {
  if (!solicitudId) return { data: [], error: null }

  return Supabase
    .from('entrevistas')
    .select(`
      id,
      fecha,
      modalidad,
      lugar,
      duracion_minutos,
      notas,
      resultado,
      estado_confirmacion,
      solicitud_id,
      adoptante_id,
      refugio_id
    `)
    .eq('solicitud_id', solicitudId)
    .order('fecha', { ascending: true })
}

export async function obtenerEntrevistasPorMascotaYUsuario({ adoptanteId, refugioId, solicitudId }) {
  if (!adoptanteId && !refugioId && !solicitudId) {
    return { data: [], error: null }
  }

  let query = Supabase.from('entrevistas').select(`
    id,
    fecha,
    modalidad,
    lugar,
    duracion_minutos,
    notas,
    resultado,
    estado_confirmacion,
    solicitud_id,
    adoptante_id,
    refugio_id
  `)

  if (adoptanteId) query = query.eq('adoptante_id', adoptanteId)
  if (refugioId) query = query.eq('refugio_id', refugioId)
  if (solicitudId) query = query.eq('solicitud_id', solicitudId)

  return query.order('fecha', { ascending: true })
}

// Reprogramar fecha/modalidad, cargar resultado, editar notas, etc.
export async function actualizarEntrevista(id, cambios) {
  return Supabase.from('entrevistas').update(cambios).eq('id', id).select().single()
}

export const obtenerEntrevistasAdoptante = (adoptanteId) =>
  Supabase
    .from('entrevistas')
    .select(`
      *,
      solicitudes!inner (
        id,
        adoptante_id,
        mascota_id,
        mascotas ( nombre, refugios ( nombre ) )
      )
    `)
    .eq('solicitudes.adoptante_id', adoptanteId)
    .in('estado_confirmacion', ['Pendiente', 'Confirmada'])
    .order('fecha', { ascending: true })

export const responderEntrevista = async (id, aceptar) => {
  if (!id) {
    return { data: null, error: { message: 'entrevista_id faltante' } }
  }

  const { data, error } = await Supabase
    .from('entrevistas')
    .update({
      estado_confirmacion: aceptar ? 'Confirmada' : 'Rechazada',
      resultado: aceptar ? 'Confirmada' : 'Rechazada',
      fecha_respuesta: new Date().toISOString(),
    })
    .eq('id', id)
    .select()

  if (error) return { data: null, error }

  if (!data || data.length === 0) {
    return { data: null, error: null }
  }

  return { data: data[0], error: null }
}

export const obtenerEntrevistasConfirmadas = (adoptanteId) =>
  Supabase
    .from('entrevistas')
    .select(`
      id,
      fecha,
      modalidad,
      lugar,
      duracion_minutos,
      solicitudes!inner (
        adoptante_id,
        mascota_id,
        mascotas ( nombre, refugios ( nombre ) )
      )
    `)
    .eq('solicitudes.adoptante_id', adoptanteId)
    .eq('estado_confirmacion', 'Confirmada')
    .gte('fecha', new Date().toISOString())
    .order('fecha', { ascending: true })

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
    .eq('refugio_id', refugioId)
    .order('fecha', { ascending: true })
}