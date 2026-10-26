import { Supabase } from '../services/supabase'


export const obtenerNotisPorUsur = (usuarioId) =>
  Supabase
    .from('notificaciones')
    .select(`
      id, titulo, mensaje, leida, fecha, conversacion_id, link,
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
  link = null,
  leida = false
}) {
  let sessionUser = null

  try {
    const { data: sessionData, error: sessionError } = await Supabase.auth.getSession()
    if (!sessionError && sessionData?.session?.user) {
      sessionUser = sessionData.session.user
    }
  } catch {
    sessionUser = null
  }

  if (!sessionUser) {
    const { data: userData, error: userError } = await Supabase.auth.getUser()
    if (!userError && userData?.user) {
      sessionUser = userData.user
    }
  }

  if (!sessionUser?.id) {
    return { data: null, error: { message: 'No hay sesión activa' } }
  }

  const payload = {
    usuario_id: usuarioId,
    emisor_id: sessionUser.id,
    titulo,
    mensaje,
    link,
    leida
  }

  const { data, error } = await Supabase
    .from('notificaciones')
    .insert(payload)

  if (error) return { data: null, error }

  return { data, error: null }
}

export async function eliminarNotificacion(id) {
  if (!id) return { data: null, error: { message: 'id faltante' } }

  return Supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', id)
    .select()
    .single()
}

export const borrarNotificacion = eliminarNotificacion

export async function limpiarNotificacionesUsuario(usuarioId) {
  if (!usuarioId) return { data: null, error: { message: 'usuarioId faltante' } }

  return Supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('usuario_id', usuarioId)
    .select()
}