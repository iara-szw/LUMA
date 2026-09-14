import { Supabase } from '../services/supabase'

/**
 * Busca una conversación existente entre refugio-adoptante-mascota,
 * o la crea si no existe. Usa upsert sobre el constraint UNIQUE
 * (refugio_id, adoptante_id, mascota_id) para evitar condiciones de carrera
 * si el usuario hace doble click o abre el chat desde dos lugares a la vez.
 * Si la conversación ya existía y estaba archivada u oculta, la reabre.
 */
export async function obtenerOCrearConversacion(refugioId, adoptanteId, mascotaId = null, solicitudId = null) {
  if (!refugioId) return { data: null, error: { message: 'refugio_id faltante' } }
  if (!adoptanteId) return { data: null, error: { message: 'adoptante_id faltante' } }

  const payload = {
    refugio_id: refugioId,
    adoptante_id: adoptanteId,
    mascota_id: mascotaId,
    ...(solicitudId ? { solicitud_id: solicitudId } : {}),
    archivada: false,
    eliminado_adoptante: false,
    eliminado_refugio: false,
  }

  try {
    let query = Supabase
      .from('conversaciones')
      .select('id')
      .eq('refugio_id', refugioId)
      .eq('adoptante_id', adoptanteId)

    if (mascotaId !== null && mascotaId !== undefined) {
      query = query.eq('mascota_id', mascotaId)
    } else {
      query = query.is('mascota_id', null)
    }

    if (solicitudId) {
      query = query.eq('solicitud_id', solicitudId)
    }

    const existente = await query.maybeSingle()

    if (existente.error && existente.error.code !== 'PGRST116') {
      console.error('obtenerOCrearConversacion select error:', existente.error)
      return existente
    }

    if (existente.data) {
      return { data: existente.data, error: null }
    }

    const insertado = await Supabase
      .from('conversaciones')
      .insert(payload)
      .select()
      .single()

    if (insertado.error) {
      const esDuplicado = insertado.error.code === '23505' || /duplicate|already exists/i.test(insertado.error.message || '')

      if (esDuplicado) {
        const reintento = await Supabase
          .from('conversaciones')
          .select('id')
          .eq('refugio_id', refugioId)
          .eq('adoptante_id', adoptanteId)

        if (mascotaId !== null && mascotaId !== undefined) {
          reintento.eq('mascota_id', mascotaId)
        } else {
          reintento.is('mascota_id', null)
        }

        if (solicitudId) {
          reintento.eq('solicitud_id', solicitudId)
        }

        const conversacionExistente = await reintento.maybeSingle()

        if (!conversacionExistente.error || conversacionExistente.error.code === 'PGRST116') {
          if (conversacionExistente.data) {
            return { data: conversacionExistente.data, error: null }
          }
        }
      }

      console.error('Supabase insert error:', insertado.error, 'payload:', payload)
      return insertado
    }

    return insertado
  } catch (err) {
    console.error('obtenerOCrearConversacion exception:', err)
    return { data: null, error: err }
  }
}

/**
 * Lista las conversaciones de un usuario (adoptante o refugio), ordenadas
 * por actividad reciente. Filtra las que el propio usuario ocultó (soft delete).
 */
export async function obtenerConversaciones(usuarioId, esRefugio) {
  if (!usuarioId) return { data: null, error: { message: 'usuario_id faltante' } }

  try {
    let query = Supabase
      .from('conversaciones')
      .select(`
        id,
        refugio_id,
        adoptante_id,
        mascota_id,
        solicitud_id,
        archivada,
        ultimo_mensaje_fecha,
        mascotas ( nombre, foto_url ),
        refugios:refugio_id ( nombre, logo_url ),
        adoptantes:adoptante_id ( nombre, apellido, foto_url ),
        solicitudes ( estado )
      `)
      .order('ultimo_mensaje_fecha', { ascending: false })

    query = esRefugio
      ? query.eq('refugio_id', usuarioId).eq('eliminado_refugio', false)
      : query.eq('adoptante_id', usuarioId).eq('eliminado_adoptante', false)

    const res = await query
    if (res.error) {
      console.error('obtenerConversaciones error:', res.error)
      return res
    }

    return res
  } catch (err) {
    console.error('obtenerConversaciones exception:', err)
    return { data: null, error: err }
  }
}

/**
 * Trae el historial de mensajes de una conversación (excluye eliminados),
 * ordenado cronológicamente.
 */
export async function obtenerMensajes(conversacionId) {
  if (!conversacionId) return { data: null, error: { message: 'conversacion_id faltante' } }

  try {
    const res = await Supabase
      .from('mensajes')
      .select('id, conversacion_id, emisor_id, contenido, leido, fecha')
      .eq('conversacion_id', conversacionId)
      .eq('eliminado', false)
      .order('fecha', { ascending: true })

    if (res.error) {
      console.error('obtenerMensajes error:', res.error)
      return res
    }

    return res
  } catch (err) {
    console.error('obtenerMensajes exception:', err)
    return { data: null, error: err }
  }
}

/**
 * Envía un mensaje. El trigger de la base de datos se encarga de actualizar
 * conversaciones.ultimo_mensaje_fecha y de crear la notificación.
 */
export async function enviarMensaje(conversacionId, emisorId, contenido) {
  if (!conversacionId) return { data: null, error: { message: 'conversacion_id faltante' } }
  if (!emisorId) return { data: null, error: { message: 'emisor_id faltante' } }

  const texto = contenido?.trim()
  if (!texto) return { data: null, error: { message: 'El mensaje no puede estar vacío' } }

  try {
    const res = await Supabase
      .from('mensajes')
      .insert({ conversacion_id: conversacionId, emisor_id: emisorId, contenido: texto })
      .select()
      .single()

    if (res.error) {
      console.error('enviarMensaje error:', res.error)
      return res
    }

    return res
  } catch (err) {
    console.error('enviarMensaje exception:', err)
    return { data: null, error: err }
  }
}

/**
 * Marca como leídos todos los mensajes de una conversación que no fueron
 * enviados por el usuario actual.
 */
export async function marcarComoLeidos(conversacionId, usuarioId) {
  if (!conversacionId) return { data: null, error: { message: 'conversacion_id faltante' } }
  if (!usuarioId) return { data: null, error: { message: 'usuario_id faltante' } }

  try {
    const res = await Supabase
      .from('mensajes')
      .update({ leido: true })
      .eq('conversacion_id', conversacionId)
      .eq('leido', false)
      .neq('emisor_id', usuarioId)
      .select()

    if (res.error) {
      console.error('marcarComoLeidos error:', res.error)
      return res
    }

    return res
  } catch (err) {
    console.error('marcarComoLeidos exception:', err)
    return { data: null, error: err }
  }
}

/**
 * Oculta una conversación del lado del usuario actual (soft delete).
 * No borra la fila ni afecta lo que ve la otra parte.
 */
export async function ocultarConversacion(conversacionId, esRefugio) {
  if (!conversacionId) return { data: null, error: { message: 'conversacion_id faltante' } }

  const campo = esRefugio ? 'eliminado_refugio' : 'eliminado_adoptante'

  try {
    const res = await Supabase
      .from('conversaciones')
      .update({ [campo]: true })
      .eq('id', conversacionId)
      .select()
      .single()

    if (res.error) {
      console.error('ocultarConversacion error:', res.error)
      return res
    }

    return res
  } catch (err) {
    console.error('ocultarConversacion exception:', err)
    return { data: null, error: err }
  }
}

/**
 * Cuenta el total de mensajes no leídos del usuario across todas sus
 * conversaciones (para el badge del header). Trae solo el count, no las filas.
 */
export async function contarMensajesNoLeidos(usuarioId, esRefugio) {
  if (!usuarioId) return { count: 0, error: { message: 'usuario_id faltante' } }

  const campoConversacion = esRefugio ? 'refugio_id' : 'adoptante_id'

  try {
    const res = await Supabase
      .from('mensajes')
      .select('id, conversaciones!inner(*)', { count: 'exact', head: true })
      .eq('leido', false)
      .neq('emisor_id', usuarioId)
      .eq(`conversaciones.${campoConversacion}`, usuarioId)

    if (res.error) {
      console.error('contarMensajesNoLeidos error:', res.error)
      return { count: 0, error: res.error }
    }

    return { count: res.count ?? 0, error: null }
  } catch (err) {
    console.error('contarMensajesNoLeidos exception:', err)
    return { count: 0, error: err }
  }
}

/**
 * Se suscribe en tiempo real a los mensajes nuevos de una conversación puntual.
 * Devuelve el channel para que el componente lo desuscriba en el cleanup del
 * useEffect (ver desuscribirse).
 */
export function suscribirseAMensajes(conversacionId, onNuevoMensaje) {
  const channel = Supabase
    .channel(`mensajes:${conversacionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `conversacion_id=eq.${conversacionId}`,
      },
      (payload) => onNuevoMensaje(payload.new)
    )
    .subscribe()

  return channel
}

/**
 * Se suscribe en tiempo real a mensajes nuevos dirigidos al usuario en
 * cualquiera de sus conversaciones, para actualizar el contador global
 * del header sin hacer polling. Filtra del lado del cliente porque
 * Realtime no permite filtrar por una columna de otra tabla.
 */
export function suscribirseANoLeidosGlobal(usuarioId, onNuevoMensaje) {
  const channel = Supabase
    .channel(`no-leidos:${usuarioId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'mensajes' },
      (payload) => {
        if (payload.new.emisor_id !== usuarioId) onNuevoMensaje(payload.new)
      }
    )
    .subscribe()

  return channel
}

export function desuscribirse(channel) {
  if (channel) Supabase.removeChannel(channel)
}

/**
 * Obtiene una conversación por su ID, incluyendo datos de la mascota,
 * refugio y adoptante, para mostrar en la tarjeta del chat.
 */
export async function obtenerConversacionPorId(conversacionId) {
  if (!conversacionId) return { data: null, error: { message: 'conversacion_id faltante' } }

  try {
    const res = await Supabase
      .from('conversaciones')
      .select(`
        id,
        refugio_id,
        adoptante_id,
        mascota_id,
        solicitud_id,
        ultimo_mensaje_fecha,
        mascotas ( id, nombre, foto_url, edad, sexo, urgente ),
        refugios:refugio_id ( id, nombre, logo_url ),
        adoptantes:adoptante_id ( id, nombre, apellido, foto_url )
      `)
      .eq('id', conversacionId)
      .maybeSingle()

    if (res.error) {
      console.error('obtenerConversacionPorId error:', res.error)
      return res
    }

    return res
  } catch (err) {
    console.error('obtenerConversacionPorId exception:', err)
    return { data: null, error: err }
  }
}