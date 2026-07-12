import { Supabase } from '../services/supabase'

export async function obtenerRefugios() {
  return Supabase
    .from('refugios')
    .select('id, nombre, foto_url')
}

export async function obtenerRefugioPorMascota(mascotaId) {
  if (!mascotaId) {
    return { data: null, error: { message: 'mascotaId faltante' } }
  }

  const mascotaRes = await Supabase
    .from('mascotas')
    .select('refugio_id')
    .eq('id', mascotaId)
    .maybeSingle()

  if (mascotaRes.error || !mascotaRes.data) {
    return mascotaRes
  }

  const usuarioRes = await Supabase
    .from('usuarios')
    .select('id, nombre, foto_url')
    .eq('id', mascotaRes.data.refugio_id)
    .maybeSingle()

  if (usuarioRes.data) {
    return usuarioRes
  }

  return Supabase
    .from('refugios')
    .select('id, nombre')
    .eq('id', mascotaRes.data.refugio_id)
    .maybeSingle()
}
