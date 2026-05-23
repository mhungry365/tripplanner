import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const PROFILE_COLS = 'id,full_name,email,role,avatar_url,bio,location,created_at'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    // Hard timeout — app never stays stuck on the loading screen.
    const failsafe = setTimeout(() => {
      if (!get().initialized) {
        set({ loading: false, initialized: true })
      }
    }, 5000)

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user })
        try {
          await get().fetchProfile(session.user.id)
        } catch {
          // fetchProfile failed — unblock the app anyway
        }
      } else {
        set({ user: null, profile: null })
      }
      if (!get().initialized) {
        clearTimeout(failsafe)
        set({ loading: false, initialized: true })
      }
    })
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLS)
      .eq('id', userId)
      .single()

    if (data) {
      set({ user: data, profile: data })
      return
    }

    // No profile row — create one now (trigger may have failed for OAuth users).
    if (error?.code !== 'PGRST116') return // only handle "row not found"

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
      .select(PROFILE_COLS)
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
      .select(PROFILE_COLS)
      .single()
    if (data) set({ profile: data, user: data })
    return { data, error }
  },

  isAdmin: () => get().profile?.role === 'admin' || get().profile?.role === 'super_admin',
  isSuperAdmin: () => get().profile?.role === 'super_admin',
}))
