import { Supabase } from '../services/supabase'

// Eventos públicos y activos (todos los refugios), para el calendario del adoptante.
// Pasá `limite` para traer solo los próximos N (ej. el widget "Mis eventos").
export async function obtenerEventosProximos(limite) {
  let query = Supabase
    .from('eventos')
    .select('*, refugios(nombre, logo_url)')
    .eq('activo', true)
    .gte('fecha_evento', new Date().toISOString())
    .order('fecha_evento', { ascending: true })

  if (limite) query = query.limit(limite)

  return query
}

// Un evento puntual por id, para la pantalla de detalle
export async function obtenerEventoPorId(id) {
  return Supabase
    .from('eventos')
    .select('*, refugios(nombre, logo_url)')
    .eq('id', id)
    .single()
}

// Eventos de un refugio en particular, para su propio dashboard/calendario
export async function obtenerEventosRefugio(refugioId) {
  return Supabase
    .from('eventos')
    .select('*')
    .eq('refugio_id', refugioId)
    .order('fecha_evento', { ascending: true })
}

export async function crearEvento(evento) {
  // evento: { refugio_id, titulo, descripcion, lugar, direccion, imagen_url, fecha_evento }
  return Supabase.from('eventos').insert(evento).select().single()
}

export async function actualizarEvento(id, cambios) {
  return Supabase.from('eventos').update(cambios).eq('id', id).select().single()
}

// Soft delete: se desactiva en vez de borrar, para no perder el historial
export async function desactivarEvento(id) {
  return Supabase.from('eventos').update({ activo: false }).eq('id', id)
}