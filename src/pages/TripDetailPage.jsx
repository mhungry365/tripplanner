import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTripsStore } from '../stores/tripsStore'
import { ArrowLeft, Calendar, MapPin, DollarSign, Plane, Hotel, Activity } from 'lucide-react'
import { TRIP_STATUSES } from '../lib/constants'
import { format } from 'date-fns'

export default function TripDetailPage() {
  const { id } = useParams()
  const { currentTrip, fetchTrip, loading } = useTripsStore()

  useEffect(() => { fetchTrip(id) }, [id])

  if (loading || !currentTrip) return (
    <div className="space-y-4 animate-fade-in">
      <div className="h-10 w-48 shimmer rounded-xl" />
      <div className="h-40 shimmer rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-24 shimmer rounded-2xl" />)}
      </div>
    </div>
  )

  const trip = currentTrip
  const budgetPct = trip.budget_total > 0 ? Math.min(100, (trip.budget_spent / trip.budget_total) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/trips" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 mt-1 flex-shrink-0">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="section-title">{trip.title}</h1>
            <span className={`badge ${TRIP_STATUSES[trip.status]?.color}`}>{TRIP_STATUSES[trip.status]?.label}</span>
          </div>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <Calendar size={14} />
            {format(new Date(trip.start_date), 'MMM d')} – {format(new Date(trip.end_date), 'MMM d, yyyy')} · {trip.total_days} days
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Days', value: trip.total_days, icon: Calendar, color: 'text-sky-600 bg-sky-50' },
          { label: 'Destinations', value: trip.trip_destinations?.length || 0, icon: MapPin, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Activities', value: trip.activities?.length || 0, icon: Activity, color: 'text-amber-600 bg-amber-50' },
          { label: 'Hotels', value: trip.accommodations?.length || 0, icon: Hotel, color: 'text-emerald-600 bg-emerald-50' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <Icon size={18} />
              </div>
              <div>
                <div className="text-2xl font-bold font-display text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Budget */}
      {trip.budget_total > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 font-display">Budget Overview</h3>
            <span className="text-sm font-semibold text-slate-600">
              {trip.budget_currency} {trip.budget_spent?.toLocaleString() || 0} / {trip.budget_total?.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
            <div className={`h-full rounded-full transition-all duration-700 ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-sky-500 to-indigo-600'}`}
              style={{ width: `${budgetPct}%` }} />
          </div>
          <p className="text-xs text-slate-400">{budgetPct.toFixed(0)}% of budget used</p>
        </div>
      )}

      {/* Itinerary */}
      <div>
        <h3 className="section-title mb-4">Itinerary</h3>
        {trip.itinerary_days?.length > 0 ? (
          <div className="space-y-3">
            {trip.itinerary_days.map(day => (
              <div key={day.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {day.day_number}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{day.title || `Day ${day.day_number}`}</div>
                    <div className="text-xs text-slate-500">{day.city} · {format(new Date(day.date), 'EEEE, MMM d')}</div>
                  </div>
                </div>
                {day.activities?.length > 0 && (
                  <div className="space-y-2 pl-13">
                    {day.activities.map(a => (
                      <div key={a.id} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                        {a.title}
                        {a.cost_eur > 0 && <span className="text-slate-400 text-xs ml-auto">€{a.cost_eur}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-10">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-slate-500 text-sm">No itinerary days yet. Add activities to get started.</p>
          </div>
        )}
      </div>

      {/* Accommodations */}
      {trip.accommodations?.length > 0 && (
        <div>
          <h3 className="section-title mb-4">Accommodations</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {trip.accommodations.map(a => (
              <div key={a.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl flex-shrink-0">🏨</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 truncate">{a.name}</div>
                    <div className="text-sm text-slate-500">{a.city}</div>
                    {a.check_in_date && (
                      <div className="text-xs text-slate-400 mt-1">
                        {format(new Date(a.check_in_date), 'MMM d')} – {format(new Date(a.check_out_date), 'MMM d')} · {a.nights} nights
                      </div>
                    )}
                    {a.total_cost_eur > 0 && (
                      <div className="text-sm font-semibold text-slate-700 mt-1">€{a.total_cost_eur?.toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
