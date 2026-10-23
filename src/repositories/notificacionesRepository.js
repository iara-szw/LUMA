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

export const marcarTodasComoLeidas = (usuarioId) =>
  Supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('usuario_id', usuarioId)
    .eq('leida', false)

export async function obtenerCantidadNoLeidas(usuarioId) {
  // usa el count exacto de supabase cuando está disponible
  const query = await Supabase
    .from('notificaciones')
    .select('id', { count: 'exact' })
    .eq('usuario_id', usuarioId)
    .eq('leida', false)

  return query
}

export async function crearNotificacion({
  usuarioId,
  titulo,
  mensaje,
  leida = false
}) {
  const { data: { user }, error: authError } = await Supabase.auth.getUser()

  if (authError || !user?.id) {
    return { data: null, error: { message: 'No hay sesión activa' } }
  }

  const payload = {
    usuario_id: usuarioId,
    emisor_id: user.id,
    titulo,
    mensaje,
    leida
  }

  const { error } = await Supabase
    .from('notificaciones')
    .insert(payload)

  if (error) return { data: null, error }

  return { data: { ok: true }, error: null }
}