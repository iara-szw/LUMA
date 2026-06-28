import { Supabase } from '../services/supabase'

export async function obtenerEventosProximos() {
  const { data, error } = await Supabase
    .from('eventos')
    .select('id, titulo, lugar, fecha_evento')
    .eq('activo', true)
    .order('fecha_evento', { ascending: true })
    .limit(5)

  if (data) {
    const mapped = data.map(e => {
      const dt = new Date(e.fecha_evento)
      return {
        id: e.id,
        nombre: e.titulo,
        lugar: e.lugar,
        fecha: dt.toLocaleDateString('es-AR'),
        hora: dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      }
    })
    return { data: mapped, error }
  }
  return { data, error }
}
