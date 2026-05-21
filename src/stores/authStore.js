import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await get().fetchProfile(session.user.id)
    }
    set({ loading: false, initialized: true })

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await get().fetchProfile(session.user.id)
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) set({ user: data, profile: data })
  },

  signUp: async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    return { data, error }
  },

  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  },

  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
    return { data, error }
  },

  signInWithFacebook: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
    return { data, error }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  updateProfile: async (updates) => {
    const { profile } = get()
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
      .single()
    if (data) set({ profile: data, user: data })
    return { data, error }
  },

  isAdmin: () => {
    const { profile } = get()
    return profile?.role === 'admin' || profile?.role === 'super_admin'
  },

  isSuperAdmin: () => {
    const { profile } = get()
    return profile?.role === 'super_admin'
  },
}))
