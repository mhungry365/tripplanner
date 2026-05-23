import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const PROFILE_COLS = 'id,full_name,email,role,avatar_url,bio,location,created_at'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    // getSession() first — waits for Supabase to fully parse the OAuth URL hash
    // before we make any routing decisions. This fixes the Safari loop where
    // onAuthStateChange fires INITIAL_SESSION(null) before the hash is processed.
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        set({ user: session.user })
        try { await get().fetchProfile(session.user.id) } catch { /* ignore */ }
      }
    } catch { /* network error — still unblock */ }

    set({ loading: false, initialized: true })

    // onAuthStateChange handles live updates only: sign-in, sign-out, token refresh.
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null })
        return
      }
      if (session?.user && session.user.id !== get().user?.id) {
        set({ user: session.user })
        try { await get().fetchProfile(session.user.id) } catch { /* ignore */ }
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
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      }
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
