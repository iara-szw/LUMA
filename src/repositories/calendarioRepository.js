import { obtenerEventosProximos, obtenerEventosRefugio } from './eventoRepository'
import { obtenerEntrevistasAdoptante, obtenerEntrevistasRefugio } from './entrevistaRepository'
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

export async function obtenerCalendarioRefugio(refugioId) {
  const [{ data: eventos, error: errEventos }, { data: entrevistas, error: errEntrevistas }] =
    await Promise.all([
      obtenerEventosRefugio(refugioId),
      obtenerEntrevistasRefugio(refugioId),
    ])

  if (errEventos || errEntrevistas) {
    return { data: null, error: errEventos || errEntrevistas }
  }

  const itemsEventos = (eventos || []).map(e => ({
    tipo: 'evento',
    id: e.id,
    fecha: e.fecha_evento || e.fecha,
    titulo: e.titulo,
    lugar: e.lugar,
    modalidad: e.modalidad,
    refugio: e.refugios?.nombre || 'Mi refugio',
  }))

  const itemsEntrevistas = (entrevistas || []).map(en => ({
    tipo: 'entrevista',
    id: en.id,
    fecha: en.fecha,
    titulo: `Entrevista · ${en.solicitudes?.mascotas?.nombre ?? 'solicitud'}`,
    lugar: en.lugar,
    modalidad: en.modalidad,
    refugio: 'Mi refugio',
    resultado: en.estado_confirmacion,
  }))

  return {
    data: [...itemsEventos, ...itemsEntrevistas].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
    error: null,
  }
}