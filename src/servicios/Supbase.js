
// servicios/supbase.js
// Instancia única — importar desde acá siempre
// ─────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'
export const supbase = createClient( 
  import.meta.env.VITE_SUPBASE_URL,
  import.meta.env.VITE_SUPBASE_ANON_KEY
)

export const registrar = async (email, password, nombre, rol) => {
  const { data, error } = await supbase.auth.signUp({ email, password })
  if (error) throw error

  const { error: perfilError } = await supbase
    .from('usuarios')
    .insert({ id: data.user.id, nombre, rol })
  if (perfilError) throw perfilError

  return data.user
}

export const iniciarSesion = async (email, password) => {
  const { data, error } = await supbase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export const cerrarSesion = async () => {
  const { error } = await supbase.auth.signOut()
  if (error) throw error
}

export const obtenerUsuarioActual = async () => {
  const { data: { user } } = await supbase.auth.getUser()
  if (!user) return null

  const { data: perfil, error } = await supbase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error) throw error

  return perfil
}


// ─────────────────────────────────────────────
// servicios/mascotas.servicio.js
// ─────────────────────────────────────────────


export const obtenerMascotas = async ({ estado, refugioId, limite } = {}) => {
  let query = supbase
    .from('mascotas')
    .select('id, nombre, foto_url, urgente, edad, estado, refugio_id')
    .order('creado_en', { ascending: false })

  if (estado)    query = query.eq('estado', estado)
  if (refugioId) query = query.eq('refugio_id', refugioId)
  if (limite)    query = query.limit(limite)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const obtenerMascotaPorId = async (id) => {
  const { data, error } = await supbase
    .from('mascotas')
    .select('*, refugios(nombre, direccion)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const crearMascota = async (mascota) => {
  const { data, error } = await supbase
    .from('mascotas')
    .insert(mascota)
    .select()
    .single()
  if (error) throw error
  return data
}

export const actualizarMascota = async (id, cambios) => {
  const { data, error } = await supbase
    .from('mascotas')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const eliminarMascota = async (id) => {
  const { error } = await supbase
    .from('mascotas')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export const subirFotoMascota = async (id, archivo) => {
  const ruta = `mascotas/${id}/${archivo.name}`
  const { error: uploadError } = await supbase.storage
    .from('fotos')
    .upload(ruta, archivo, { upsert: true })
  if (uploadError) throw uploadError

  const { data } = supbase.storage.from('fotos').getPublicUrl(ruta)
  return data.publicUrl
}


// ─────────────────────────────────────────────
// servicios/solicitudes.servicio.js
// ────────────────────────────────────────────

export const obtenerSolicitudesPorRefugio = async (refugioId, estado = null) => {
  let query = supbase
    .from('solicitudes')
    .select(`
      id, estado, creado_en, respuestas,
      usuarios(id, nombre, avatar_url),
      mascotas(id, nombre, foto_url)
    `)
    .eq('mascotas.refugio_id', refugioId)
    .order('creado_en', { ascending: false })

  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const obtenerSolicitudesPorAdoptante = async (adoptanteId) => {
  const { data, error } = await supbase
    .from('solicitudes')
    .select(`
      id, estado, creado_en,
      mascotas(id, nombre, foto_url)
    `)
    .eq('adoptante_id', adoptanteId)
    .order('creado_en', { ascending: false })
  if (error) throw error
  return data
}

export const crearSolicitud = async ({ adoptanteId, mascotaId, formularioId, respuestas }) => {
  const { data, error } = await supbase
    .from('solicitudes')
    .insert({
      adoptante_id: adoptanteId,
      mascota_id: mascotaId,
      formulario_id: formularioId,
      respuestas,
      estado: 'en_revision'
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export const actualizarEstadoSolicitud = async (id, estado) => {
  const { data, error } = await supbase
    .from('solicitudes')
    .update({ estado })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}


// ─────────────────────────────────────────────
// servicios/refugios.servicio.js
// ─────────────────────────────────────────────


export const obtenerRefugioPorPerfil = async (perfilId) => {
  const { data, error } = await supbase
    .from('refugios')
    .select('*')
    .eq('perfil_id', perfilId)
    .single()
  if (error) throw error
  return data
}

export const obtenerRefugioPorId = async (id) => {
  const { data, error } = await supbase
    .from('refugios')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const actualizarRefugio = async (id, cambios) => {
  const { data, error } = await supbase
    .from('refugios')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}


// ─────────────────────────────────────────────
// servicios/formularios.servicio.js
// ─────────────────────────────────────────────


export const obtenerFormularioPorMascota = async (mascotaId) => {
  const { data, error } = await supbase
    .from('formularios')
    .select('*')
    .eq('mascota_id', mascotaId)
    .single()
  if (error) throw error
  return data
}

export const guardarFormulario = async ({ refugioId, mascotaId, preguntas }) => {
  // upsert: actualiza si ya existe, crea si no
  const { data, error } = await supbase
    .from('formularios')
    .upsert({ refugio_id: refugioId, mascota_id: mascotaId, preguntas })
    .select()
    .single()
  if (error) throw error
  return data
}


// ─────────────────────────────────────────────
// servicios/eventos.servicio.js
// ─────────────────────────────────────────────


export const obtenerEventos = async ({ refugioId, limite } = {}) => {
  let query = supbase
    .from('eventos')
    .select('id, nombre, lugar, fecha, hora, refugio_id')
    .order('fecha', { ascending: true })

  if (refugioId) query = query.eq('refugio_id', refugioId)
  if (limite)    query = query.limit(limite)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const crearEvento = async (evento) => {
  const { data, error } = await supbase
    .from('eventos')
    .insert(evento)
    .select()
    .single()
  if (error) throw error
  return data
}

export const eliminarEvento = async (id) => {
  const { error } = await supbase.from('eventos').delete().eq('id', id)
  if (error) throw error
}