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

export async function obtenerPerfilAdoptantePorSolicitud(solicitudId) {
  const { data, error } = await Supabase
    .from('solicitudes')
    .select(`
      id,
      estado,
      fecha_solicitud,
      mascotas(id, nombre),
      usuarios:adoptante_id(
        id,
        nombre,
        apellido,
        email,
        telefono,
        ciudad,
        provincia,
        biografia,
        foto_url
      )
    `)
    .eq('id', solicitudId)
    .maybeSingle()

  if (error) return { data: null, error }
  if (!data) return { data: null, error: null }

  return {
    data: {
      id: data.id,
      estado: data.estado,
      fecha_solicitud: data.fecha_solicitud,
      mascota: data.mascotas,
      usuario: data.usuarios,
    },
    error: null,
  }
}

export async function obtenerRefugio(refugioId) {
  const result = await Supabase
    .from('refugios')
    .select('*')
    .eq('id', refugioId)
    .maybeSingle()

  if (result.data) return result

  if (!result.error) {
    const usuarioRes = await Supabase
      .from('usuarios')
      .select('*')
      .eq('id', refugioId)
      .maybeSingle()

    if (usuarioRes.error) return usuarioRes

    if (!usuarioRes.data) {
      const insertRes = await Supabase
        .from('refugios')
        .insert({ id: refugioId })
        .select()
        .single()
      return insertRes
    }

    return {
      data: {
        ...usuarioRes.data,
        id: usuarioRes.data.id,
        nombre: usuarioRes.data.nombre || 'Refugio',
        descripcion: usuarioRes.data.descripcion || usuarioRes.data.biografia || '',
        direccion: usuarioRes.data.direccion || [usuarioRes.data.ciudad, usuarioRes.data.provincia].filter(Boolean).join(', '),
        logo_url: usuarioRes.data.logo_url || usuarioRes.data.foto_url || usuarioRes.data.foto_perfil || '/assets/img/perfil_default.jpg',
        portada_url: usuarioRes.data.portada_url || usuarioRes.data.foto_portada_url || '/assets/img/refugio_default.jpg',
      },
      error: null,
    }
  }

  return result
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
