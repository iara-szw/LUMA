import { obtenerEventosProximos } from './eventoRepository'
import { obtenerEntrevistasAdoptante } from './entrevistaRepository'
import { Supabase } from '../services/supabase'

// Une eventos públicos + entrevistas propias del adoptante en un mismo formato,
// ordenado por fecha, listo para pintar en un componente de calendario.
export async function obtenerCalendarioAdoptante(usuarioId) {
  const [{ data: eventos, error: errEventos }, { data: entrevistas, error: errEntrevistas }] =
    await Promise.all([
      obtenerEventosProximos(),
      obtenerEntrevistasAdoptante(usuarioId),
    ])

  if (errEventos || errEntrevistas) {
    return { data: null, error: errEventos || errEntrevistas }
  }

  const itemsEventos = (eventos || []).map(e => ({
    tipo: 'evento',
    id: e.id,
    fecha: e.fecha_evento,
    titulo: e.titulo,
    lugar: e.lugar,
    refugio: e.refugios?.nombre,
    imagen_url: e.imagen_url,
  }))

  const itemsEntrevistas = (entrevistas || []).map(en => ({
    tipo: 'entrevista',
    id: en.id,
    fecha: en.fecha,
    titulo: `Entrevista · ${en.solicitudes?.mascotas?.nombre ?? ''}`,
    modalidad: en.modalidad,
    resultado: en.resultado,
    refugio: en.solicitudes?.mascotas?.refugios?.nombre,
  }))

  const items = [...itemsEventos, ...itemsEntrevistas].sort(
    (a, b) => new Date(a.fecha) - new Date(b.fecha)
  )

  return { data: items, error: null }
}