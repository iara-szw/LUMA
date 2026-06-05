import { Supabase } from '../services/supabase'

export async function obtenerEventosProximos() {
  return Supabase
    .from('eventos')
    .select('id, nombre, lugar, fecha, hora')
    .order('fecha', { ascending: true })
    .limit(5)
}
