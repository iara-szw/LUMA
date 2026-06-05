import { Supabase } from '../services/supabase'

export async function obtenerRefugios() {
  return Supabase
    .from('refugios')
    .select('id, nombre, foto_url')
}
