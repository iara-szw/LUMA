import { Supabase } from './supabase'
import { crearNotificacion } from '../repositories/notificacionesRepository'

const STORAGE_KEY = 'luma:recordatorios'
const timers = new Map()

function normalizarFecha(fecha) {
  if (!fecha) return null
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function hacerClave({ usuarioId, tipo, itemId }) {
  return `${String(usuarioId || '')}:${String(tipo || '')}:${String(itemId || '')}`
}

function normalizarRecordatorio(recordatorio) {
  if (!recordatorio) return null

  return {
    usuarioId: String(recordatorio.usuarioId),
    tipo: String(recordatorio.tipo),
    itemId: String(recordatorio.itemId),
    titulo: recordatorio.titulo || null,
    fecha: normalizarFecha(recordatorio.fecha),
    link: recordatorio.link || null,
  }
}

function leerRecordatorios() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(normalizarRecordatorio).filter(Boolean) : []
  } catch {
    return []
  }
}

function guardarRecordatorios(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(items) ? items : []))
  } catch {
    // noop
  }
}

async function guardarEnSupabase(recordatorio) {
  if (!recordatorio?.usuarioId || !recordatorio?.tipo || !recordatorio?.itemId || !recordatorio?.fecha) return false

  const payload = {
    usuario_id: recordatorio.usuarioId,
    tipo: recordatorio.tipo,
    item_id: recordatorio.itemId,
    titulo: recordatorio.titulo || null,
    fecha_recordatorio: recordatorio.fecha,
    link: recordatorio.link || null,
    activo: true,
  }

  try {
    const { error } = await Supabase
      .from('recordatorios')
      .upsert(payload, { onConflict: 'usuario_id,tipo,item_id' })
      .select()

    if (error) {
      console.error('Error guardando recordatorio en Supabase:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error guardando recordatorio en Supabase:', error)
    return false
  }
}

async function eliminarEnSupabase({ usuarioId, tipo, itemId }) {
  if (!usuarioId || !tipo || !itemId) return false

  try {
    const { error } = await Supabase
      .from('recordatorios')
      .delete()
      .eq('usuario_id', String(usuarioId))
      .eq('tipo', String(tipo))
      .eq('item_id', String(itemId))

    if (error) {
      console.error('Error eliminando recordatorio en Supabase:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error eliminando recordatorio en Supabase:', error)
    return false
  }
}

async function dispararRecordatorio(recordatorio) {
  if (!recordatorio?.usuarioId || !recordatorio?.titulo) return

  const mensaje = `Falta menos de un día para el evento: ${recordatorio.tipo}: ${recordatorio.titulo}`

  try {
    await crearNotificacion({
      usuarioId: recordatorio.usuarioId,
      titulo: 'Recordatorio',
      mensaje,
      link: recordatorio.link || null,
      leida: false,
    })
  } catch (error) {
    console.error('Error enviando recordatorio:', error)
  }

  quitarRecordatorio({
    usuarioId: recordatorio.usuarioId,
    tipo: recordatorio.tipo,
    itemId: recordatorio.itemId,
  })
}

export function estaRecordado({ usuarioId, tipo, itemId }) {
  if (!usuarioId || !tipo || !itemId) return false

  const recordatorios = leerRecordatorios()
  return recordatorios.some(r => {
    if (!r) return false
    return r.usuarioId === String(usuarioId) && r.tipo === String(tipo) && r.itemId === String(itemId)
  })
}

export async function registrarRecordatorio({ usuarioId, tipo, itemId, titulo, fecha, link }) {
  if (!usuarioId || !tipo || !itemId || !fecha) return false

  const recordatorio = normalizarRecordatorio({
    usuarioId,
    tipo,
    itemId,
    titulo,
    fecha,
    link: link || null,
  })

  if (!recordatorio || !recordatorio.fecha) return false

  const lista = leerRecordatorios().filter(r => hacerClave(r) !== hacerClave(recordatorio))
  lista.push(recordatorio)
  guardarRecordatorios(lista)

  await guardarEnSupabase(recordatorio)

  const clave = hacerClave(recordatorio)
  if (timers.has(clave)) clearTimeout(timers.get(clave))

  const fechaEvento = new Date(recordatorio.fecha)
  const fechaAviso = new Date(fechaEvento.getTime() - (24 * 60 * 60 * 1000))
  const diffMs = fechaAviso.getTime() - Date.now()

  if (diffMs <= 0) {
    await dispararRecordatorio(recordatorio)
    return true
  }

  const timer = setTimeout(() => {
    dispararRecordatorio(recordatorio)
  }, diffMs)
  timers.set(clave, timer)

  return true
}

export async function quitarRecordatorio({ usuarioId, tipo, itemId }) {
  if (!usuarioId || !tipo || !itemId) return false

  const clave = hacerClave({ usuarioId, tipo, itemId })
  if (timers.has(clave)) {
    clearTimeout(timers.get(clave))
    timers.delete(clave)
  }

  const lista = leerRecordatorios().filter(r => hacerClave(r) !== clave)
  guardarRecordatorios(lista)

  await eliminarEnSupabase({ usuarioId, tipo, itemId })
  return true
}

export function iniciarRecordatoriosPendientes() {
  const recordatorios = leerRecordatorios()
  recordatorios.forEach(recordatorio => {
    const clave = hacerClave(recordatorio)
    if (timers.has(clave)) return

    const fechaEvento = new Date(recordatorio.fecha)
    const fechaAviso = new Date(fechaEvento.getTime() - 24 * 60 * 60 * 1000)
    const diffMs = fechaAviso.getTime() - Date.now()

    if (diffMs <= 0) {
      dispararRecordatorio(recordatorio)
      return
    }

    const timer = setTimeout(() => {
      dispararRecordatorio(recordatorio)
    }, diffMs)
    timers.set(clave, timer)
  })
}
