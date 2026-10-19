import { Supabase } from '../services/supabase'


export const obtenerNotisPorUsur = (usuarioId) =>
  Supabase
    .from('notificaciones')
    .select(`
      id, titulo, mensaje, leida, fecha, conversacion_id,
      emisor:usuarios!notificaciones_emisor_id_fkey (
        nombre, apellido, foto_url,
        refugios ( nombre, logo_url )
      )
    `)
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })

    export const marcarNotiLeida = (id) =>
        
    Supabase.from('notificaciones').update({ leida: true }).eq('id', id)

export async function obtenerCantidadNoLeidas(usuarioId) {
  // usa el count exacto de supabase cuando está disponible
  const query = await Supabase
    .from('notificaciones')
    .select('id', { count: 'exact' })
    .eq('usuario_id', usuarioId)
    .eq('leida', false)

  return query
}

export async function crearNotificacion({ usuarioId, titulo, mensaje, leida = false }) {
  if (!usuarioId) return { data: null, error: { message: 'usuarioId faltante' } }
  try {
    const res = await Supabase
      .from('notificaciones')
      .insert({ usuario_id: usuarioId, titulo, mensaje, leida })
      .select()
      .maybeSingle()

    if (res.error) {
      console.error('crearNotificacion error:', res.error)
      return res
    }

    return res
  } catch (err) {
    console.error('crearNotificacion exception:', err)
    return { data: null, error: err }
  }
}   
