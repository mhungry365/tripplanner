import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTripsStore } from '../stores/tripsStore'
import { Map, Globe, Calendar, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { TRIP_STATUSES } from '../lib/constants'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { profile } = useAuthStore()
  const { trips, fetchTrips } = useTripsStore()

  useEffect(() => {
    if (profile?.id) fetchTrips(profile.id)
  }, [profile?.id])

  const activeTrips = trips.filter(t => ['planning','confirmed','ongoing'].includes(t.status))
  const completedTrips = trips.filter(t => t.status === 'completed')
  const upcomingTrip = trips.find(t => t.status === 'confirmed' || t.status === 'planning')

  const stats = [
    { label: 'Total Trips', value: trips.length, icon: Map, color: 'from-sky-400 to-sky-600', bg: 'bg-sky-50', text: 'text-sky-600' },
    { label: 'Completed', value: completedTrips.length, icon: Globe, color: 'from-emerald-400 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Active Plans', value: activeTrips.length, icon: Calendar, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Countries', value: profile?.total_countries || 0, icon: TrendingUp, color: 'from-indigo-400 to-violet-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-700 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute right-6 top-4 text-6xl opacity-20 animate-float">🌍</div>
        <div className="relative">
          <p className="text-white/70 text-sm font-medium mb-1">{greeting} 👋</p>
          <h1 className="text-3xl font-bold font-display mb-2">{profile?.full_name?.split(' ')[0] || 'Traveller'}!</h1>
          <p className="text-white/60 text-sm mb-5">
            {trips.length === 0
              ? "You haven't planned any trips yet. Let's change that!"
              : `You have ${activeTrips.length} active trip${activeTrips.length !== 1 ? 's' : ''} in progress.`
            }
          </p>
          <Link to="/trips/new" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white/90 transition-all shadow">
            <Plus size={16} /> Plan new trip
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon size={18} className={s.text} />
                </div>
              </div>
              <div className="text-3xl font-bold font-display text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Upcoming trip */}
      {upcomingTrip && (
        <div>
          <h2 className="section-title mb-4">Upcoming Trip</h2>
          <Link to={`/trips/${upcomingTrip.id}`}
            className="card-hover block p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-bold font-display text-slate-900 mb-1">{upcomingTrip.title}</div>
                <div className="text-sm text-slate-500 mb-3">
                  {format(new Date(upcomingTrip.start_date), 'MMM d')} – {format(new Date(upcomingTrip.end_date), 'MMM d, yyyy')} · {upcomingTrip.total_days} days
                </div>
                <span className={`badge ${TRIP_STATUSES[upcomingTrip.status]?.color}`}>
                  {TRIP_STATUSES[upcomingTrip.status]?.label}
                </span>
              </div>
              <ArrowRight size={20} className="text-slate-400 mt-1" />
            </div>
            {upcomingTrip.budget_total > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Budget</span>
                  <span className="font-semibold text-slate-800">
                    {upcomingTrip.budget_currency} {upcomingTrip.budget_total?.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (upcomingTrip.budget_spent / upcomingTrip.budget_total) * 100)}%` }} />
                </div>
              </div>
            )}
          </Link>
        </div>
      )}

      {/* Recent trips */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Trips</h2>
          <Link to="/trips" className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {trips.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">🗺️</div>
            <h3 className="font-bold text-slate-800 mb-2">No trips yet</h3>
            <p className="text-slate-500 text-sm mb-5">Start planning your first adventure!</p>
            <Link to="/trips/new" className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Create first trip
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.slice(0, 6).map(trip => (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-slate-800 font-display leading-tight">{trip.title}</h3>
                  <span className={`badge ml-2 flex-shrink-0 ${TRIP_STATUSES[trip.status]?.color}`}>
                    {TRIP_STATUSES[trip.status]?.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  {format(new Date(trip.start_date), 'MMM d')} – {format(new Date(trip.end_date), 'MMM d, yyyy')}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{trip.total_days} days</span>
                  {trip.budget_total > 0 && (
                    <span className="font-semibold text-slate-600">
                      {trip.budget_currency} {trip.budget_total?.toLocaleString()}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
