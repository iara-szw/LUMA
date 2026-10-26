import { Supabase } from './supabase'
import { crearNotificacion } from '../repositories/notificacionesRepository'

const STORAGE_KEY = 'luma:recordatorios'
const timers = new Map()

function leerRecordatorios() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function guardarRecordatorios(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function payloadRecordatorio({ usuarioId, tipo, itemId, titulo, fecha, link }) {
  return {
    usuarioId,
    tipo,
    itemId: String(itemId),
    titulo,
    fecha,
    link,
    creadoEn: new Date().toISOString(),
  }
}

export function estaRecordado({ usuarioId, tipo, itemId }) {
  if (!usuarioId || !tipo || !itemId) return false
  const recordatorios = leerRecordatorios()
  return recordatorios.some(
    r => r.usuarioId === usuarioId && r.tipo === tipo && String(r.itemId) === String(itemId)
  )
}

function limpiarRecordatorio({ usuarioId, tipo, itemId }) {
  const recordatorios = leerRecordatorios().filter(
    r => !(r.usuarioId === usuarioId && r.tipo === tipo && String(r.itemId) === String(itemId))
  )
  guardarRecordatorios(recordatorios)

  const clave = `${usuarioId}:${tipo}:${itemId}`
  if (timers.has(clave)) {
    clearTimeout(timers.get(clave))
    timers.delete(clave)
  }
}

async function marcarRecordatorioEnSupabase({ usuarioId, tipo, itemId, notificado = true }) {
  try {
    await Supabase
      .from('recordatorios')
      .update({ activo: !notificado, notificado })
      .eq('usuario_id', usuarioId)
      .eq('tipo', tipo)
      .eq('item_id', String(itemId))
  } catch {
    // ignore: la tabla puede no existir o no estar habilitada
  }
}

function dispararRecordatorio(recordatorio) {
  const { usuarioId, tipo, itemId, titulo, fecha, link } = recordatorio
  const clave = `${usuarioId}:${tipo}:${itemId}`

  if (!usuarioId || !fecha) {
    limpiarRecordatorio({ usuarioId, tipo, itemId })
    return
  }

  const timeoutMs = new Date(fecha).getTime() - Date.now()

  if (timeoutMs <= 0) {
    crearNotificacion({
      usuarioId,
      titulo: 'Recordatorio',
      mensaje: `Falta 1 día para ${tipo === 'evento' ? 'el evento' : 'la entrevista'}: ${titulo}.`,
      link,
    })
      .then(() => marcarRecordatorioEnSupabase({ usuarioId, tipo, itemId, notificado: true }))
      .catch(() => {})
    limpiarRecordatorio({ usuarioId, tipo, itemId })
    return
  }

  const timer = setTimeout(async () => {
    await crearNotificacion({
      usuarioId,
      titulo: 'Recordatorio',
      mensaje: `Falta 1 día para ${tipo === 'evento' ? 'el evento' : 'la entrevista'}: ${titulo}.`,
      link,
    })
    await marcarRecordatorioEnSupabase({ usuarioId, tipo, itemId, notificado: true })
    limpiarRecordatorio({ usuarioId, tipo, itemId })
  }, timeoutMs)

  timers.set(clave, timer)
}

export async function registrarRecordatorio({ usuarioId, tipo, itemId, titulo, fecha, link }) {
  if (!usuarioId || !tipo || !itemId || !fecha) return false

  const recordatorio = payloadRecordatorio({ usuarioId, tipo, itemId, titulo, fecha, link })
  const lista = leerRecordatorios().filter(
    r => !(r.usuarioId === usuarioId && r.tipo === tipo && String(r.itemId) === String(itemId))
  )

  lista.push(recordatorio)
  guardarRecordatorios(lista)

  try {
    await Supabase
      .from('recordatorios')
      .upsert({
        usuario_id: usuarioId,
        tipo,
        item_id: String(itemId),
        titulo,
        fecha_recordatorio: new Date(fecha).toISOString(),
        link: link || null,
        activo: true,
        notificado: false,
      }, { onConflict: 'usuario_id,tipo,item_id' })
  } catch {
    // fallback local si la tabla no existe
  }

  dispararRecordatorio(recordatorio)
  return true
}

export function quitarRecordatorio({ usuarioId, tipo, itemId }) {
  if (!usuarioId || !tipo || !itemId) return false

  limpiarRecordatorio({ usuarioId, tipo, itemId })

  try {
    Supabase
      .from('recordatorios')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('tipo', tipo)
      .eq('item_id', String(itemId))
  } catch {
    // ignore, fallback local
  }

  return true
}

export async function iniciarRecordatoriosPendientes() {
  const recordatorios = leerRecordatorios()
  recordatorios.forEach(recordatorio => {
    const clave = `${recordatorio.usuarioId}:${recordatorio.tipo}:${recordatorio.itemId}`
    if (!timers.has(clave)) {
      dispararRecordatorio(recordatorio)
    }
  })

  try {
    const { data: { user } } = await Supabase.auth.getUser()
    if (!user?.id) return

    const { data: pendientes, error } = await Supabase
      .from('recordatorios')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('activo', true)
      .eq('notificado', false)

    if (error || !pendientes) return

    pendientes.forEach(item => {
      const recordatorio = {
        usuarioId: item.usuario_id,
        tipo: item.tipo,
        itemId: item.item_id,
        titulo: item.titulo,
        fecha: item.fecha_recordatorio,
        link: item.link,
      }
      const clave = `${recordatorio.usuarioId}:${recordatorio.tipo}:${recordatorio.itemId}`
      if (!timers.has(clave)) {
        dispararRecordatorio(recordatorio)
      }
    })
  } catch {
    // fall back silently
  }
}
