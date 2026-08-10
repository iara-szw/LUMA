import { Supabase } from '../services/supabase'
import { ESTADOS } from '../services/authService'

export async function obtenerMascotasDeRefugio(refugioId) {
  return Supabase
    .from('mascotas')
    .select('id, nombre, edad, foto_url, urgente, especie_id, especies(nombre)')
    .eq('refugio_id', refugioId)
    .eq('estado_id', ESTADOS.publicada)
    .order('fecha_publicacion', { ascending: false })
}

export async function obtenerSolicitudesDeRefugio(refugioId) {
  const { data, error } = await Supabase
    .from('solicitudes')
    .select(
      'id, estado, fecha_solicitud, info, usuarios:adoptante_id(id, nombre, foto_url), mascotas!inner(id, nombre, foto_url, refugio_id)'
    )
    .eq('mascotas.refugio_id', refugioId)
    .order('fecha_solicitud', { ascending: false })
  if (data) {
    const mapped = data.map(s => {
      let info = {}
      try {
        if (s.info && typeof s.info === 'string') info = JSON.parse(s.info)
        else if (s.info && typeof s.info === 'object') info = s.info
      } catch (e) {
        info = {}
      }

      return {
        id: s.id,
        estado: s.estado === 'Pendiente' ? 'en_revision' : s.estado.toLowerCase(),
        creado_en: s.fecha_solicitud,
        es_nueva: s.estado === 'Pendiente',
        paso_actual: s.estado === 'Pendiente' ? 'formulario_completo' : s.estado === 'Aprobada' ? 'entrevista_sugerida' : 'en_revision',
        usuarios: s.usuarios,
        mascotas: s.mascotas,
        info,
      }
    })
    return { data: mapped, error }
  }

  return { data, error }
}

export async function obtenerEstadisticasDeRefugio(refugioId) {
  const [mascotasRes, solicitudesRes,voluntariosRes, eventosRes] = await Promise.all([
    Supabase
      .from('mascotas')
      .select('id', { count: 'exact', head: true })
      .eq('refugio_id', refugioId),
    Supabase
      .from('solicitudes')
      .select('id, mascotas!inner(refugio_id)', { count: 'exact', head: true })
      .eq('estado', 'Adopcion')
      .eq('mascotas.refugio_id', refugioId),
       Supabase
      .from('refugios')
      .select('cantidad_voluntarios')
      .eq('id', refugioId),
    Supabase
      .from('eventos')
      .select('id', { count: 'exact', head: true })
      .eq('refugio_id', refugioId),
  ])

  return {
    data: {
      mascotas: mascotasRes.count || 0,
      cantidad_voluntarios: voluntariosRes.count || 1,
      adopciones: solicitudesRes.count || 0,
      eventos: eventosRes.count || 0,
    },
  }
}

export async function actualizarRefugio(refugioId, {
  nombre,
  descripcion,
  telefono,
  direccion,
  ciudad,
  provincia,
  instagram,
  logo_url,
  portada_url,
} = {}) {
  const payload = {}
  if (typeof nombre !== 'undefined') payload.nombre = nombre
  if (typeof descripcion !== 'undefined') payload.descripcion = descripcion
  if (typeof telefono !== 'undefined') payload.telefono = telefono
  if (typeof direccion !== 'undefined') payload.direccion = direccion
  if (typeof ciudad !== 'undefined') payload.ciudad = ciudad
  if (typeof provincia !== 'undefined') payload.provincia = provincia
  if (typeof instagram !== 'undefined') payload.instagram = instagram
  if (typeof logo_url !== 'undefined') payload.logo_url = logo_url
  if (typeof portada_url !== 'undefined') payload.portada_url = portada_url

  // Actualizamos la tabla `refugios` para mantener compatibilidad con el perfil en sesión
  return Supabase
    .from('refugios')
    .update(payload)
    .eq('id', refugioId)
}

export async function obtenerRefugio(refugioId) {
  const result = await Supabase
    .from('refugios')
    .select('*')
    .eq('id', refugioId)
    .maybeSingle()

  // Si no existe fila en refugios, crearla vacía
  if (!result.data && !result.error) {
    const insertRes = await Supabase
      .from('refugios')
      .insert({ id: refugioId })
      .select()
      .single()
    return insertRes
  }

  return result
}
