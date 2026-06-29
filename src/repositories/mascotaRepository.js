import { Supabase } from '../services/supabase'
import {ESTADOS} from '../services/authService'
const ESPECIE_PERRO = '67fdca6b-e83d-4b2f-a374-b777a1e70037'
const ESPECIE_GATO  = '64c51957-d60e-4f24-be64-f6830572cb95'


const aplicarLimite = (query, cantidad) => {
  return cantidad && cantidad > 0 ? query.limit(cantidad) : query
}

export async function obtenerMascotasRecientes(cantidad) {
  const query = Supabase
    .from('mascotas')
    .select('id, nombre, foto_url, urgente, edad')
    .eq('estado_id', ESTADOS.publicada)
    .order('fecha_publicacion', { ascending: false })

  return aplicarLimite(query, cantidad)
}

export async function obtenerPerros(cantidad) {
  const query = Supabase
    .from('mascotas')
    .select('id, nombre, edad, foto_url, urgente')
    .eq('especie_id', ESPECIE_PERRO)
    .eq('estado_id', ESTADOS.publicada)

  return aplicarLimite(query, cantidad)
}

export async function obtenerGatos(cantidad) {
  const query = Supabase
    .from('mascotas')
    .select('id, nombre, edad, foto_url, urgente')
    .eq('especie_id', ESPECIE_GATO)
    .eq('estado_id', ESTADOS.publicada)

  return aplicarLimite(query, cantidad)
}

export async function obtenerMascotasRefugio(refugioId, cantidad) {
  const query = Supabase
    .from('mascotas')
    .select('id, nombre, edad, urgente, foto_url, especie_id')
    .eq('refugio_id', refugioId)
    .eq('estado_id', ESTADOS.publicada)
    
  return aplicarLimite(query, cantidad)
}

export function idEspeciePorNombre(nombre) {
  if (!nombre) return null
  const n = String(nombre).toLowerCase()
  if (n === 'perro' || n === 'dog') return ESPECIE_PERRO
  if (n === 'gato' || n === 'cat') return ESPECIE_GATO
  return null
}

export async function crearMascotaRefugio(refugioId, datos) {
  // Map incoming data to DB schema `public.mascotas`
  const payload = {
    refugio_id: refugioId,
    nombre: datos.nombre || null,
    especie_id: datos.especie || null,
    estado_id: datos.estado_id || ESTADOS.publicada,
    edad: datos.edad || null,
    sexo: datos.sexo || null,
    tamaño: datos.tamaño || null,
    foto_url: datos.foto_url || null,
    descripcion: datos.tipo ? String(datos.tipo) : datos.descripcion || null,
    vacunado: datos.vacunado || false,
    castrado: datos.castrado || false,
    desparasitado: datos.desparasitado || false,
    problemas_salud: datos.problemas_salud || false,
    detalle_salud: datos.detalle_salud || null,
    urgente: datos.urgente ? true : false,
    publicado: typeof datos.publicado === 'boolean' ? datos.publicado : true,
    fecha_rescate: datos.fecha_rescate || null,
    fecha_adopcion: datos.fecha_adopcion || null,
  }

  // Basic validation before sending to Supabase (match DB required columns)
  if (!refugioId) return { data: null, error: { message: 'refugio_id faltante' } }
  if (!payload.nombre) return { data: null, error: { message: 'nombre faltante' } }
  if (!payload.especie_id) return { data: null, error: { message: 'especie_id faltante' } }

  try {
    const res = await Supabase
      .from('mascotas')
      .insert(payload)
      .select()

    if (res.error) {
      console.error('Supabase insert error:', res.error, 'payload:', payload)
      return res
    }

    return res
  } catch (err) {
    console.error('Insert exception:', err)
    return { data: null, error: err }
  }
}

export async function obtenerMascotaPorId(id) {
  if (!id) return { data: null, error: { message: 'id faltante' } }
  try {
    // Include related refugio (shelter) data via relationship
    const res = await Supabase
      .from('mascotas')
      .select('*, refugios(*)')
      .eq('id', id)
      .single()

    if (res.error) return res
    return res
  } catch (err) {
    console.error('obtenerMascotaPorId exception:', err)
    return { data: null, error: err }
  }
}

export async function obtenerOtrasMascotas(excluirId, refugioId, cantidad = 6) {
  if (!refugioId) return { data: [], error: null }
  try {
    let query = Supabase
      .from('mascotas')
      .select('id, nombre, edad, foto_url, urgente, especie_id')
      .eq('refugio_id', refugioId)
      .neq('id', excluirId)
      .eq('estado_id', ESTADOS.publicada)
      .order('fecha_publicacion', { ascending: false })

    query = aplicarLimite(query, cantidad)

    const res = await query
    if (res.error) return res
    return res
  } catch (err) {
    console.error('obtenerOtrasMascotas exception:', err)
    return { data: null, error: err }
  }
}

export async function actualizarMascota(id, datos) {
  if (!id) {
    return {
      data: null,
      error: { message: 'Id faltante' }
    }
  }

  const payload = {
    nombre: datos.nombre,
    edad: datos.edad,
    sexo: datos.sexo,
    tamaño: datos.tamaño,
    descripcion: datos.descripcion,
    vacunado: datos.vacunado,
    castrado: datos.castrado,
    desparasitado: datos.desparasitado,
    problemas_salud: datos.problemas_salud,
    detalle_salud: datos.detalle_salud,
    urgente: datos.urgente,
    publicado: datos.publicado,
    fecha_rescate: datos.fecha_rescate,
    fecha_adopcion: datos.fecha_adopcion,
    requisitos: datos.requisitos,
    foto_url: datos.foto_url
  }

  return Supabase
    .from('mascotas')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
}