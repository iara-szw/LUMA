import { Supabase } from '../services/supabase'

const ESPECIE_PERRO = '67fdca6b-e83d-4b2f-a374-b777a1e70037'
const ESPECIE_GATO  = '64c51957-d60e-4f24-be64-f6830572cb95'

export async function obtenerMascotasRecientes() {
  return Supabase
    .from('mascotas')
    .select('id, nombre, foto_url, urgente, edad')
    .eq('estado', 'activa')
    .order('creado_en', { ascending: false })
    .limit(10)
}

export async function obtenerPerros() {
  return Supabase
    .from('mascotas')
    .select('id, nombre, tipo, edad, foto_url, urgente')
    .eq('especie', ESPECIE_PERRO)
    .eq('estado', 1)
}

export async function obtenerGatos() {
  return Supabase
    .from('mascotas')
    .select('id, nombre, tipo, edad, foto_url, urgente')
    .eq('especie', ESPECIE_GATO)
    .eq('estado', 1)
}
