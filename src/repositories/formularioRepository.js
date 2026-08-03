import { Supabase } from '../services/supabase'

export const FORMULARIO_DEFAULT = [
 
  {
    id: 'seccion_disponibilidad',
    titulo: 'Disponibilidad',
    preguntas: [
      {
        id: 'tiempo',
        titulo: '¿Cuánto tiempo podés dedicarle?',
        tipo: 'text',
        placeholder: 'Ej: 2 horas por día',
        obligatorio: true,
      },{
        id: 'tiempoDisponible',
        titulo: '¿Cuánto tiempo podés dedicarle?',
        tipo: 'text',
        placeholder: 'Ej: 2 horas por día',
        obligatorio: true,
      }
    ],
  }, {
    id: 'a',
    titulo: 'a',
    preguntas: [
      {
        id: 'a',
        titulo: '¿Cuánto tiempo podés dedicarle?',
        tipo: 'text',
        placeholder: 'Ej: 2 horas por día',
        obligatorio: true,
      },{
        id: 'a',
        titulo: '¿Cuánto tiempo podés dedicarle?',
        tipo: 'text',
        placeholder: 'Ej: 2 horas por día',
        obligatorio: true,
      }
    ],
  }
]

function normalizarBloques(valor) {
  if (!valor) return FORMULARIO_DEFAULT

  try {
    const parsed = JSON.parse(valor)
    if (!Array.isArray(parsed) || parsed.length === 0) return FORMULARIO_DEFAULT

    // Formato nuevo: ya viene como secciones con .preguntas
    if (parsed[0]?.preguntas) return parsed

    // Formato viejo: array plano de preguntas -> migramos a una sola sección
    return [{ id: 'seccion_1', titulo: 'Preguntas', preguntas: parsed }]
  } catch {
    return FORMULARIO_DEFAULT
  }
}

function normalizarRespuestas(valor) {
  if (!valor) return {}
  if (typeof valor === 'object') return valor

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
  const { data, error } = await Supabase
    .from('solicitudes')
    .upsert(
      {
        adoptante_id: adoptanteId,
        mascota_id: mascotaId,
        estado,
        info: info || {},
      },
      { onConflict: 'mascota_id,adoptante_id' }
    )
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
    .select('id, estado, info, fecha_solicitud,info, usuarios:adoptante_id(id, nombre, foto_url), mascotas(id, nombre, foto_url)')
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