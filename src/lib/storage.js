import { supabase } from './supabase'

export async function uploadAvatar(file, userId) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  return publicUrl
}

export async function uploadCover(file, userId) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/cover.${ext}`
  const { error } = await supabase.storage.from('covers').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(path)
  return publicUrl
}

export async function uploadPostMedia(file, userId) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('posts').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path)
  return publicUrl
}
