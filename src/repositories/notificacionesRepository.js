import { Supabase } from '../services/supabase'


export async function obtenerNotisPorUsur(usuarioId) {
  let query = Supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })

  return query
}

export async function obtenerCantidadNoLeidas(usuarioId) {
  // usa el count exacto de supabase cuando está disponible
  const query = await Supabase
    .from('notificaciones')
    .select('id', { count: 'exact' })
    .eq('usuario_id', usuarioId)
    .eq('leida', false)

  return query
}

export async function actualizarTituloPorContenido(usuarioId, contenidoNeedle, nuevoTitulo) {
  if (!usuarioId || !contenidoNeedle) return { data: null, error: { message: 'parametros faltantes' } }

  try {
    // Buscar la notificación más reciente que contenga el snippet en el mensaje
    const busqueda = await Supabase
      .from('notificaciones')
      .select('id')
      .eq('usuario_id', usuarioId)
      .ilike('mensaje', `%${contenidoNeedle}%`)
      .order('fecha', { ascending: false })
      .limit(1)

    if (busqueda.error) {
      console.error('actualizarTituloPorContenido select error:', busqueda.error)
      return { data: null, error: busqueda.error }
    }

    const fila = (busqueda.data && busqueda.data.length) ? busqueda.data[0] : null
    if (!fila) return { data: null, error: { message: 'notificacion no encontrada' } }

    const res = await Supabase
      .from('notificaciones')
      .update({ titulo: nuevoTitulo })
      .eq('id', fila.id)
      .select()
      .maybeSingle()

    if (res.error) {
      console.error('actualizarTituloPorContenido update error:', res.error)
      return res
    }

    return res
  } catch (err) {
    console.error('actualizarTituloPorContenido exception:', err)
    return { data: null, error: err }
  }
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

export async function borrarNotificacionPorContenido(usuarioId, contenidoNeedle) {
  if (!usuarioId || !contenidoNeedle) return { data: null, error: { message: 'parametros faltantes' } }
  try {
    const res = await Supabase
      .from('notificaciones')
      .delete()
      .eq('usuario_id', usuarioId)
      .ilike('mensaje', `%${contenidoNeedle}%`)
      .limit(10)

    if (res.error) {
      console.error('borrarNotificacionPorContenido error:', res.error)
      return res
    }

    return res
  } catch (err) {
    console.error('borrarNotificacionPorContenido exception:', err)
    return { data: null, error: err }
  }
}