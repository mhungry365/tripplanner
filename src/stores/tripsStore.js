import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useTripsStore = create((set, get) => ({
  trips: [],
  currentTrip: null,
  itinerary: [],
  loading: false,
  error: null,

  fetchTrips: async (userId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('trips')
      .select(`*, trip_destinations(count), activities(count), accommodations(count)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    set({ trips: data || [], loading: false, error })
  },

  fetchTrip: async (tripId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        trip_destinations(*),
        itinerary_days(*, activities(*), transport_legs(*)),
        accommodations(*),
        transport_legs(*)
      `)
      .eq('id', tripId)
      .single()
    set({ currentTrip: data, loading: false, error })
    return data
  },

  createTrip: async (tripData) => {
    const { data, error } = await supabase
      .from('trips')
      .insert(tripData)
      .select()
      .single()
    if (data) set(state => ({ trips: [data, ...state.trips] }))
    return { data, error }
  },

  updateTrip: async (tripId, updates) => {
    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .select()
      .single()
    if (data) {
      set(state => ({
        trips: state.trips.map(t => t.id === tripId ? data : t),
        currentTrip: state.currentTrip?.id === tripId ? { ...state.currentTrip, ...data } : state.currentTrip
      }))
    }
    return { data, error }
  },

  deleteTrip: async (tripId) => {
    const { error } = await supabase.from('trips').delete().eq('id', tripId)
    if (!error) set(state => ({ trips: state.trips.filter(t => t.id !== tripId) }))
    return { error }
  },

  addActivity: async (activityData) => {
    const { data, error } = await supabase
      .from('activities')
      .insert(activityData)
      .select()
      .single()
    return { data, error }
  },

  addTransportLeg: async (transportData) => {
    const { data, error } = await supabase
      .from('transport_legs')
      .insert(transportData)
      .select()
      .single()
    return { data, error }
  },

  addAccommodation: async (accomData) => {
    const { data, error } = await supabase
      .from('accommodations')
      .insert(accomData)
      .select()
      .single()
    return { data, error }
  },
}))
