import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTripsStore } from '../stores/tripsStore'
import { Plus, Search, Filter, Map, Calendar, DollarSign } from 'lucide-react'
import { TRIP_STATUSES } from '../lib/constants'
import { format } from 'date-fns'

export default function TripsPage() {
  const { profile } = useAuthStore()
  const { trips, fetchTrips, loading } = useTripsStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (profile?.id) fetchTrips(profile.id)
  }, [profile?.id])

  const filtered = trips.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">My Trips</h1>
          <p className="text-slate-500 text-sm mt-1">{trips.length} trip{trips.length !== 1 ? 's' : ''} planned</p>
        </div>
        <Link to="/trips/new" className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} /> New Trip
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search trips..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(TRIP_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card h-40 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🗺️</div>
          <h3 className="font-bold text-slate-800 mb-2">
            {search || statusFilter !== 'all' ? 'No trips match your filters' : 'No trips yet'}
          </h3>
          <p className="text-slate-500 text-sm mb-5">
            {search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Create your first adventure!'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link to="/trips/new" className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Create Trip
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(trip => (
            <Link key={trip.id} to={`/trips/${trip.id}`}
              className="card-hover p-6 flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-800 font-display text-lg leading-tight flex-1 mr-2">{trip.title}</h3>
                  <span className={`badge flex-shrink-0 ${TRIP_STATUSES[trip.status]?.color}`}>
                    {TRIP_STATUSES[trip.status]?.label}
                  </span>
                </div>
                {trip.description && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{trip.description}</p>}
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar size={13} />
                  {format(new Date(trip.start_date), 'MMM d')} – {format(new Date(trip.end_date), 'MMM d, yyyy')} · {trip.total_days} days
                </div>
                {trip.budget_total > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <DollarSign size={13} />
                    Budget: {trip.budget_currency} {trip.budget_total?.toLocaleString()}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
