import { Supabase } from '../services/supabase'

export async function descargarAvatar(path) {
  return Supabase.storage.from('avatars').download(path)
}

export async function subirAvatar(filePath, file) {
  return Supabase.storage.from('avatars').upload(filePath, file)
}
