import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    // Use onAuthStateChange as the sole source of truth.
    // INITIAL_SESSION fires once immediately (with session or null), which avoids
    // the race where getSession() returns null before detectSessionInUrl finishes
    // processing OAuth tokens from the URL after redirect.
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user })
        await get().fetchProfile(session.user.id)
      } else {
        set({ user: null, profile: null })
      }
      if (!get().initialized) {
        set({ loading: false, initialized: true })
      }
    })
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      set({ user: data, profile: data })
      return
    }

    // Profile missing — trigger failed for this OAuth user. Create it now.
    const { data: authData } = await supabase.auth.getUser()
    const authUser = authData?.user
    if (!authUser) return

    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
        avatar_url: authUser.user_metadata?.avatar_url || null,
      }, { onConflict: 'id' })
      .select()
      .single()

    if (newProfile) set({ user: newProfile, profile: newProfile })
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
    return get().profile?.role === 'admin' || get().profile?.role === 'super_admin'
  },

  isSuperAdmin: () => {
    return get().profile?.role === 'super_admin'
  },
}))
