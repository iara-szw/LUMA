import { Supabase } from '../services/supabase'

// Descarga un archivo desde el bucket `avatars` (usado por `Avatar.jsx`).
export async function descargarAvatar(path) {
  return Supabase.storage.from('avatars').download(path)
}

// Sube un archivo al bucket `avatars` (usado por `Avatar.jsx`).
export async function subirAvatar(filePath, file) {
  return Supabase.storage.from('avatars').upload(filePath, file, { cacheControl: '3600', upsert: false })
}

// Sube una foto de mascota al bucket `mascotas` y devuelve una URL pública
export async function subirFotoMascota(refugioId, file) {
  try {
    const fileExt = file.name ? file.name.split('.').pop() : 'jpg'
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
    const fileName = `${uuid}.${fileExt}`
    const filePath = `${refugioId}/${fileName}`

    const bucketName = 'avatars'
    const { data: uploadData, error: uploadError } = await Supabase.storage
      .from(bucketName)
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) return { url: null, error: uploadError }

    const { data: publicData, error: publicError } = await Supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    if (publicError) return { url: null, error: publicError }

    const publicUrl = publicData?.publicUrl || publicData?.publicURL || null
    return { url: publicUrl, error: null }
  } catch (err) {
    return { url: null, error: err }
  }
}
