import { Supabase } from '../services/supabase'

const ESPECIE_PERRO = '67fdca6b-e83d-4b2f-a374-b777a1e70037'
const ESPECIE_GATO  = '64c51957-d60e-4f24-be64-f6830572cb95'

const aplicarLimite = (query, cantidad) => {
  return cantidad && cantidad > 0 ? query.limit(cantidad) : query
}

export async function obtenerMascotasRecientes(cantidad) {
  const query = Supabase
    .from('mascotas')
    .select('id, nombre, foto_url, urgente, edad')
    .eq('estado', 1)
    .order('creado_en', { ascending: false })

  return aplicarLimite(query, cantidad)
}

export async function obtenerPerros(cantidad) {
  const query = Supabase
    .from('mascotas')
    .select('id, nombre, tipo, edad, foto_url, urgente')
    .eq('especie', ESPECIE_PERRO)
    .eq('estado', 1)

  return aplicarLimite(query, cantidad)
}

export async function obtenerGatos(cantidad) {
  const query = Supabase
    .from('mascotas')
    .select('id, nombre, tipo, edad, foto_url, urgente')
    .eq('especie', ESPECIE_GATO)
    .eq('estado', 1)

  return aplicarLimite(query, cantidad)
}

export async function obtenerMascotasRefugio(refugioId, cantidad) {
  const query = Supabase
    .from('mascotas')
    .select('id, nombre, especie, tipo, edad, foto_url, urgente')
    .eq('refugio_id', refugioId)
    .eq('estado', 1)
    .order('creado_en', { ascending: false })

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
    estado_id: datos.estado_id || null,
    edad: datos.edad || null,
    sexo: datos.sexo || null,
    tamaño: datos.tamaño || null,
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
