import { Supabase } from '../services/supabase'

export const FORMULARIO_DEFAULT = [
  {
    id: 'foto_hogar',
    titulo: 'Foto del hogar',
    tipo: 'photo',
    placeholder: 'Subí una foto del espacio donde viviría la mascota',
    obligatorio: true,
  },
  {
    id: 'tipo_vivienda',
    titulo: '¿Qué tipo de vivienda tenés?',
    tipo: 'textarea',
    placeholder: 'Contanos si es casa, departamento, jardín, etc.',
    obligatorio: true,
  },
  {
    id: 'tiempo',
    titulo: '¿Cuánto tiempo podés dedicarle?',
    tipo: 'text',
    placeholder: 'Ej: 2 horas por día',
    obligatorio: true,
  },
]

function normalizarBloques(valor) {
  if (!valor) return FORMULARIO_DEFAULT

  try {
    const parsed = JSON.parse(valor)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch {
    // si viene texto libre, se cae al default
  }

  return FORMULARIO_DEFAULT
}

function normalizarRespuestas(valor) {
  if (!valor) return {}

  try {
    const parsed = JSON.parse(valor)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export async function obtenerFormularioMascota(mascotaId) {
  const { data, error } = await Supabase
    .from('mascotas')
    .select('id, requisitos')
    .eq('id', mascotaId)
    .limit(1)

  if (error) return { data: null, error }

  const fila = Array.isArray(data) ? data[0] || null : data

  return {
    data: {
      mascotaId,
      bloques: normalizarBloques(fila?.requisitos),
    },
    error: null,
  }
}

export async function guardarFormularioMascota(mascotaId, bloques) {
  const payload = JSON.stringify(Array.isArray(bloques) && bloques.length > 0 ? bloques : FORMULARIO_DEFAULT)

  const { data, error } = await Supabase
    .from('mascotas')
    .update({ requisitos: payload })
    .eq('id', mascotaId)
    .select()

  if (error) return { data: null, error }

  return {
    data: Array.isArray(data) ? data[0] || null : data,
    error: null,
  }
}

export async function obtenerSolicitudFormularioPorMascotaYAdoptante(mascotaId, adoptanteId) {
  const { data, error } = await Supabase
    .from('solicitudes')
    .select('id, estado, info, fecha_solicitud')
    .eq('mascota_id', mascotaId)
    .eq('adoptante_id', adoptanteId)
    .order('fecha_solicitud', { ascending: false })
    .limit(1)

  if (error) return { data: null, error }

  const fila = Array.isArray(data) ? data[0] || null : data

  return {
    data: {
      id: fila?.id || null,
      estado: fila?.estado || 'Pendiente',
      info: normalizarRespuestas(fila?.info),
      fecha_solicitud: fila?.fecha_solicitud || null,
    },
    error: null,
  }
}

export async function guardarProgresoSolicitud({ mascotaId, adoptanteId, info, estado = 'Pendiente' }) {
  const registro = await obtenerSolicitudFormularioPorMascotaYAdoptante(mascotaId, adoptanteId)

  const payload = {
    estado,
    info: JSON.stringify(info || {}),
  }

  if (registro.data?.id) {
    const { data, error } = await Supabase
      .from('solicitudes')
      .update(payload)
      .eq('id', registro.data.id)
      .select()

    if (error) return { data: null, error }

    return {
      data: Array.isArray(data) ? data[0] || null : data,
      error: null,
    }
  }

  const { data, error } = await Supabase
    .from('solicitudes')
    .insert({
      adoptante_id: adoptanteId,
      mascota_id: mascotaId,
      estado,
      fecha_solicitud: new Date().toISOString(),
      info: JSON.stringify(info || {}),
    })
    .select()

  if (error) return { data: null, error }

  return {
    data: Array.isArray(data) ? data[0] || null : data,
    error: null,
  }
}

export async function obtenerSolicitudFormularioPorId(solicitudId) {
  const { data, error } = await Supabase
    .from('solicitudes')
    .select('id, estado, fecha_solicitud, info:  info->info, usuarios:adoptante_id(id, nombre, foto_url), mascotas(id, nombre, foto_url)')
    .eq('id', solicitudId)
    .limit(1)

  if (error) return { data: null, error }

  const fila = Array.isArray(data) ? data[0] || null : data

  return {
    data: {
      id: fila?.id,
      estado: fila?.estado,
      fecha_solicitud: fila?.fecha_solicitud,
      info: normalizarRespuestas(fila?.info),
      usuarios: fila?.usuarios,
      mascotas: fila?.mascotas,
    },
    error: null,
  }
}

export async function obtenerInfo(){
  const{data,error}=await Supabase
  .from('solicitudes')
  .select('infos:  metadata->info')
    if (error) return { data: null, error }

    return data
}