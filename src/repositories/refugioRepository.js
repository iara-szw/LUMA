import { Supabase } from '../services/supabase'

export async function obtenerRefugios() {
  return Supabase
    .from('refugios')
    .select('id, nombre, foto_url')
}

export async function insertarRefugio(usuarioId, { nombre, descripcion, telefono_responsable, direccion }) {
  return Supabase
    .from('refugios')
    .insert({ usuario_id: usuarioId, nombre, descripcion, telefono_responsable, direccion })
}
