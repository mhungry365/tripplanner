import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTripsStore } from '../stores/tripsStore'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Plus, X, MapPin, Clock, ExternalLink,
  Share2, DollarSign, ChevronRight, Plane
} from 'lucide-react'
import { TRIP_STATUSES, CURRENCIES } from '../lib/constants'
import { format, eachDayOfInterval, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'itinerary',  label: 'Itinerary',  emoji: '📅' },
  { id: 'hotels',     label: 'Hotels',     emoji: '🏨' },
  { id: 'transport',  label: 'Transport',  emoji: '🚄' },
  { id: 'activities', label: 'Activities', emoji: '📍' },
  { id: 'budget',     label: 'Budget',     emoji: '💰' },
]

const CAT = {
  sightseeing:   { emoji: '🏛️', label: 'Sightseeing', color: 'bg-blue-50 text-blue-700' },
  food:          { emoji: '🍜', label: 'Food',         color: 'bg-orange-50 text-orange-700' },
  transport:     { emoji: '🚄', label: 'Transport',    color: 'bg-sky-50 text-sky-700' },
  accommodation: { emoji: '🏨', label: 'Stay',         color: 'bg-purple-50 text-purple-700' },
  shopping:      { emoji: '🛍️', label: 'Shopping',     color: 'bg-pink-50 text-pink-700' },
  nature:        { emoji: '🌿', label: 'Nature',       color: 'bg-green-50 text-green-700' },
  culture:       { emoji: '🎭', label: 'Culture',      color: 'bg-yellow-50 text-yellow-700' },
  adventure:     { emoji: '🧗', label: 'Adventure',    color: 'bg-red-50 text-red-700' },
  nightlife:     { emoji: '🌙', label: 'Nightlife',    color: 'bg-indigo-50 text-indigo-700' },
  wellness:      { emoji: '🧘', label: 'Wellness',     color: 'bg-teal-50 text-teal-700' },
  other:         { emoji: '📍', label: 'Other',        color: 'bg-slate-100 text-slate-600' },
}

const TRANSPORT_EMOJI = {
  flight: '✈️', train: '🚄', bullet_train: '🚅', bus: '🚌',
  metro: '🚇', taxi: '🚕', ferry: '⛴️', car_rental: '🚗',
  walk: '🚶', bike: '🚲', cable_car: '🚡', boat: '🚢', other: '🚐',
}

const BUDGET_CATS = [
  { key: 'budget_flights',    label: 'Flights',    emoji: '✈️' },
  { key: 'budget_hotels',     label: 'Hotels',     emoji: '🏨' },
  { key: 'budget_food',       label: 'Food',       emoji: '🍜' },
  { key: 'budget_transport',  label: 'Transport',  emoji: '🚄' },
  { key: 'budget_activities', label: 'Activities', emoji: '🎭' },
  { key: 'budget_misc',       label: 'Misc',       emoji: '💼' },
]

const ALERTS_MAP = {
  japan:   ['🌸 Cherry blossom season March–April', '⚡ 100V electrical outlets', '💴 Cash preferred', '🚭 Strict no-smoking rules'],
  nepal:   ['🏔️ Altitude sickness above 3000m', '💉 Vaccinations recommended', '🪙 Local currency preferred', '📋 Trekking permits required'],
  default: ['📋 Check visa requirements', '🏥 Get travel insurance', '💱 Notify your bank', '📱 Check roaming charges'],
}

function getAlerts(trip) {
  const text = [
    trip.title, trip.description,
    ...(trip.trip_destinations || []).map(d => `${d.city} ${d.country_name}`),
  ].join(' ').toLowerCase()
  if (/japan|tokyo|kyoto|osaka|hiroshima/.test(text)) return ALERTS_MAP.japan
  if (/nepal|kathmandu|everest|pokhara/.test(text)) return ALERTS_MAP.nepal
  return ALERTS_MAP.default
}

// ─── Shared Modal Wrapper ────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-slate-800 text-lg font-display">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  )
}

function FormRow({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TripDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentTrip, fetchTrip, loading } = useTripsStore()

  const [activeTab, setActiveTab]         = useState('itinerary')
  const [days, setDays]                   = useState([])
  const [hotels, setHotels]               = useState([])
  const [legs, setLegs]                   = useState([])
  const [transactions, setTransactions]   = useState([])
  const [saving, setSaving]               = useState(false)
  const [catFilter, setCatFilter]         = useState('all')

  // Modal states
  const [activityModal, setActivityModal] = useState(false)
  const [hotelModal, setHotelModal]       = useState(false)
  const [transportModal, setTransportModal] = useState(false)
  const [expenseModal, setExpenseModal]   = useState(false)
  const [selectedDay, setSelectedDay]     = useState(null)

  // Form states
  const [actForm, setActForm] = useState({ title: '', category: 'sightseeing', location: '', start_time: '', cost: '', notes: '' })
  const [hotelForm, setHotelForm] = useState({ name: '', address: '', city: '', phone: '', website: '', check_in_date: '', check_out_date: '', cost_per_night: '', cost_currency: 'EUR', booking_ref: '', notes: '' })
  const [legForm, setLegForm] = useState({ type: 'flight', from_city: '', to_city: '', departure_date: '', departure_time: '', arrival_time: '', cost: '', cost_currency: 'EUR', operator: '', booking_ref: '', notes: '' })
  const [expForm, setExpForm] = useState({ category: 'food', title: '', amount: '', currency: 'EUR', date: '', notes: '' })

  const trip = currentTrip

  // Initial load
  useEffect(() => {
    const load = async () => {
      const data = await fetchTrip(id)
      if (!data) return
      setHotels(data.accommodations || [])
      setLegs(data.transport_legs || [])
      await ensureDays(data)
    }
    load()
  }, [id])

  // Budget transactions
  useEffect(() => {
    if (!id) return
    supabase.from('budget_transactions').select('*').eq('trip_id', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setTransactions(data || []))
  }, [id])

  // Auto-generate itinerary days if none exist
  const ensureDays = async (data) => {
    if (!data.start_date || !data.end_date) return
    if (data.itinerary_days?.length > 0) {
      setDays(data.itinerary_days.map(d => ({ ...d, activities: d.activities || [] })))
      return
    }
    const dates = eachDayOfInterval({ start: parseISO(data.start_date), end: parseISO(data.end_date) })
    const rows = dates.map((date, i) => ({
      trip_id: data.id,
      day_number: i + 1,
      date: format(date, 'yyyy-MM-dd'),
      city: data.trip_destinations?.[0]?.city || data.origin_city || '',
      phase: 'explore',
    }))
    const { data: created } = await supabase.from('itinerary_days').insert(rows).select()
    if (created) setDays(created.map(d => ({ ...d, activities: [] })))
  }

  // ── Add handlers ──────────────────────────────────────────────────────────

  const handleAddActivity = async () => {
    if (!actForm.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    const { data, error } = await supabase.from('activities').insert({
      trip_id: trip.id,
      day_id: selectedDay.id,
      title: actForm.title.trim(),
      category: actForm.category,
      location_name: actForm.location || null,
      start_time: actForm.start_time || null,
      cost_eur: parseFloat(actForm.cost) || 0,
      cost_local: parseFloat(actForm.cost) || 0,
      cost_currency: trip.budget_currency || 'EUR',
      notes: actForm.notes || null,
      order_index: selectedDay.activities?.length || 0,
    }).select().single()
    if (error) { toast.error(error.message) }
    else {
      setDays(prev => prev.map(d => d.id === selectedDay.id ? { ...d, activities: [...(d.activities || []), data] } : d))
      setActivityModal(false)
      setActForm({ title: '', category: 'sightseeing', location: '', start_time: '', cost: '', notes: '' })
      toast.success('Activity added!')
    }
    setSaving(false)
  }

  const handleAddHotel = async () => {
    if (!hotelForm.name.trim()) { toast.error('Hotel name is required'); return }
    setSaving(true)
    const nights = hotelForm.check_in_date && hotelForm.check_out_date
      ? Math.max(1, (new Date(hotelForm.check_out_date) - new Date(hotelForm.check_in_date)) / 86400000)
      : null
    const { data, error } = await supabase.from('accommodations').insert({
      trip_id: trip.id,
      type: 'hotel',
      status: 'wishlist',
      name: hotelForm.name.trim(),
      address: hotelForm.address || null,
      city: hotelForm.city || null,
      phone: hotelForm.phone || null,
      website: hotelForm.website || null,
      check_in_date: hotelForm.check_in_date || null,
      check_out_date: hotelForm.check_out_date || null,
      cost_per_night_eur: parseFloat(hotelForm.cost_per_night) || null,
      cost_per_night_local: parseFloat(hotelForm.cost_per_night) || null,
      total_cost_eur: nights && hotelForm.cost_per_night ? nights * parseFloat(hotelForm.cost_per_night) : null,
      cost_currency: hotelForm.cost_currency,
      booking_ref: hotelForm.booking_ref || null,
      notes: hotelForm.notes || null,
    }).select().single()
    if (error) { toast.error(error.message) }
    else {
      setHotels(prev => [...prev, data])
      setHotelModal(false)
      setHotelForm({ name: '', address: '', city: '', phone: '', website: '', check_in_date: '', check_out_date: '', cost_per_night: '', cost_currency: 'EUR', booking_ref: '', notes: '' })
      toast.success('Hotel added!')
    }
    setSaving(false)
  }

  const handleAddTransport = async () => {
    if (!legForm.from_city.trim() || !legForm.to_city.trim()) { toast.error('From and To cities are required'); return }
    setSaving(true)
    const { data, error } = await supabase.from('transport_legs').insert({
      trip_id: trip.id,
      type: legForm.type,
      status: 'pending',
      from_city: legForm.from_city.trim(),
      to_city: legForm.to_city.trim(),
      departure_date: legForm.departure_date || null,
      departure_time: legForm.departure_time || null,
      arrival_time: legForm.arrival_time || null,
      cost_eur: parseFloat(legForm.cost) || 0,
      cost_local: parseFloat(legForm.cost) || 0,
      cost_currency: legForm.cost_currency,
      operator: legForm.operator || null,
      booking_ref: legForm.booking_ref || null,
      notes: legForm.notes || null,
    }).select().single()
    if (error) { toast.error(error.message) }
    else {
      setLegs(prev => [...prev, data])
      setTransportModal(false)
      setLegForm({ type: 'flight', from_city: '', to_city: '', departure_date: '', departure_time: '', arrival_time: '', cost: '', cost_currency: 'EUR', operator: '', booking_ref: '', notes: '' })
      toast.success('Transport added!')
    }
    setSaving(false)
  }

  const handleAddExpense = async () => {
    if (!expForm.title.trim() || !expForm.amount) { toast.error('Title and amount are required'); return }
    setSaving(true)
    const { data, error } = await supabase.from('budget_transactions').insert({
      trip_id: trip.id,
      user_id: trip.user_id,
      category: expForm.category,
      title: expForm.title.trim(),
      amount_local: parseFloat(expForm.amount),
      currency_local: expForm.currency,
      amount_eur: parseFloat(expForm.amount),
      transaction_date: expForm.date || null,
      notes: expForm.notes || null,
    }).select().single()
    if (error) { toast.error(error.message) }
    else {
      setTransactions(prev => [data, ...prev])
      setExpenseModal(false)
      setExpForm({ category: 'food', title: '', amount: '', currency: 'EUR', date: '', notes: '' })
      toast.success('Expense logged!')
    }
    setSaving(false)
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading || !trip) return (
    <div className="space-y-4 animate-fade-in max-w-5xl">
      <div className="h-10 w-48 shimmer rounded-xl" />
      <div className="h-40 shimmer rounded-2xl" />
      <div className="flex gap-2">{[1,2,3,4,5].map(i => <div key={i} className="h-10 flex-1 shimmer rounded-xl" />)}</div>
      <div className="h-64 shimmer rounded-2xl" />
    </div>
  )

  const allActivities = days.flatMap(d => (d.activities || []).map(a => ({ ...a, day_number: d.day_number, day_date: d.date })))
  const totalTransportCost = legs.reduce((s, l) => s + (l.cost_eur || 0), 0)
  const totalSpent = transactions.reduce((s, t) => s + (t.amount_eur || 0), 0)
  const budgetPct = trip.budget_total > 0 ? Math.min(100, (totalSpent / trip.budget_total) * 100) : 0
  const alerts = getAlerts(trip)

  // ── Tab: Itinerary ────────────────────────────────────────────────────────
  const TabItinerary = (
    <div className="space-y-3">
      {days.length === 0 ? (
        <div className="card text-center py-14">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-slate-500 text-sm">No dates set on this trip yet.</p>
        </div>
      ) : days.map(day => (
        <div key={day.id} className="card overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md">
                {day.day_number}
              </div>
              <div>
                <div className="font-bold text-slate-800 font-display">
                  {format(parseISO(day.date), 'EEEE')}
                  <span className="font-normal text-slate-500 ml-2 text-sm">{format(parseISO(day.date), 'MMM d, yyyy')}</span>
                </div>
                {day.city && <div className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10} /> {day.city}</div>}
              </div>
            </div>
            <button
              onClick={() => { setSelectedDay(day); setActivityModal(true) }}
              className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={13} /> Add
            </button>
          </div>

          {day.activities?.length > 0 ? (
            <div className="mt-3 pl-14 space-y-2">
              {day.activities.map(a => (
                <div key={a.id} className="flex items-center gap-2.5 py-2 border-t border-slate-50">
                  <span className="text-lg">{CAT[a.category]?.emoji || '📍'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-700">{a.title}</span>
                    {a.location_name && <span className="text-xs text-slate-400 ml-2">{a.location_name}</span>}
                  </div>
                  {a.start_time && <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{a.start_time.slice(0,5)}</span>}
                  {a.cost_eur > 0 && <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">€{a.cost_eur}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-3 pl-14">No activities planned — click + to add</p>
          )}
        </div>
      ))}
    </div>
  )

  // ── Tab: Hotels ───────────────────────────────────────────────────────────
  const TabHotels = (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{hotels.length} accommodation{hotels.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setHotelModal(true)} className="btn-primary text-sm py-2 flex items-center gap-1.5">
          <Plus size={15} /> Add Hotel
        </button>
      </div>

      {hotels.length === 0 ? (
        <div className="card text-center py-14">
          <div className="text-4xl mb-3">🏨</div>
          <p className="text-slate-500 text-sm mb-4">No accommodations added yet.</p>
          <button onClick={() => setHotelModal(true)} className="btn-primary text-sm py-2 inline-flex items-center gap-1.5">
            <Plus size={15} /> Add your first hotel
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {hotels.map(h => (
            <div key={h.id} className="card space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-xl flex-shrink-0">🏨</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 truncate font-display">{h.name}</div>
                  {h.city && <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{h.city}</div>}
                </div>
                {h.status && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${h.status === 'confirmed' ? 'bg-green-100 text-green-700' : h.status === 'booked' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                    {h.status}
                  </span>
                )}
              </div>

              {(h.check_in_date || h.check_out_date) && (
                <div className="flex gap-4 text-sm bg-slate-50 rounded-xl p-3">
                  <div><div className="text-[10px] text-slate-400 uppercase font-semibold">Check-in</div><div className="font-semibold text-slate-700">{h.check_in_date ? format(parseISO(h.check_in_date), 'MMM d') : '—'}</div></div>
                  <ChevronRight size={16} className="text-slate-300 self-center" />
                  <div><div className="text-[10px] text-slate-400 uppercase font-semibold">Check-out</div><div className="font-semibold text-slate-700">{h.check_out_date ? format(parseISO(h.check_out_date), 'MMM d') : '—'}</div></div>
                  {h.nights && <div className="ml-auto"><div className="text-[10px] text-slate-400 uppercase font-semibold">Nights</div><div className="font-semibold text-slate-700">{h.nights}</div></div>}
                </div>
              )}

              {(h.cost_per_night_eur || h.total_cost_eur) && (
                <div className="flex items-center justify-between text-sm">
                  {h.cost_per_night_eur && <span className="text-slate-500">{h.cost_currency} {h.cost_per_night_eur}/night</span>}
                  {h.total_cost_eur && <span className="font-bold text-slate-800">{h.cost_currency} {h.total_cost_eur?.toLocaleString()} total</span>}
                </div>
              )}

              {h.booking_ref && <div className="text-xs text-slate-400">Ref: <span className="font-mono text-slate-600">{h.booking_ref}</span></div>}

              <div className="flex gap-2 pt-1">
                {h.address && (
                  <a href={`https://maps.google.com?q=${encodeURIComponent(h.address)}`} target="_blank" rel="noreferrer"
                    className="text-xs flex items-center gap-1 text-sky-600 hover:underline">
                    <MapPin size={11} /> Map
                  </a>
                )}
                <a href={`https://www.booking.com/search.html?ss=${encodeURIComponent(h.city || h.name)}`} target="_blank" rel="noreferrer"
                  className="text-xs flex items-center gap-1 text-indigo-600 hover:underline ml-auto">
                  <ExternalLink size={11} /> Booking.com
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Tab: Transport ────────────────────────────────────────────────────────
  const TabTransport = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {legs.length} leg{legs.length !== 1 ? 's' : ''}
          {totalTransportCost > 0 && <span className="ml-2 font-semibold text-slate-700">· {trip.budget_currency} {totalTransportCost.toLocaleString()} total</span>}
        </p>
        <button onClick={() => setTransportModal(true)} className="btn-primary text-sm py-2 flex items-center gap-1.5">
          <Plus size={15} /> Add Transport
        </button>
      </div>

      {legs.length === 0 ? (
        <div className="card text-center py-14">
          <div className="text-4xl mb-3">🚄</div>
          <p className="text-slate-500 text-sm mb-4">No transport added yet.</p>
          <button onClick={() => setTransportModal(true)} className="btn-primary text-sm py-2 inline-flex items-center gap-1.5">
            <Plus size={15} /> Add first leg
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {legs.map(l => (
            <div key={l.id} className="card flex items-start gap-4">
              <div className="text-3xl flex-shrink-0 mt-1">{TRANSPORT_EMOJI[l.type] || '🚐'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 font-bold text-slate-800 font-display">
                  {l.from_city} <ChevronRight size={14} className="text-slate-400" /> {l.to_city}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                  {l.departure_date && <span>📅 {format(parseISO(l.departure_date), 'MMM d, yyyy')}</span>}
                  {l.departure_time && <span>🕐 {l.departure_time.slice(0,5)}{l.arrival_time && ` → ${l.arrival_time.slice(0,5)}`}</span>}
                  {l.operator && <span>🏢 {l.operator}</span>}
                  {l.booking_ref && <span>📋 {l.booking_ref}</span>}
                </div>
              </div>
              {l.cost_eur > 0 && (
                <span className="font-bold text-slate-700 text-sm flex-shrink-0">{l.cost_currency} {l.cost_eur}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Tab: Activities ───────────────────────────────────────────────────────
  const filteredActs = catFilter === 'all' ? allActivities : allActivities.filter(a => a.category === catFilter)
  const totalActCost = allActivities.reduce((s, a) => s + (a.cost_eur || 0), 0)

  const TabActivities = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {allActivities.length} activit{allActivities.length !== 1 ? 'ies' : 'y'}
          {totalActCost > 0 && <span className="ml-2 font-semibold text-slate-700">· {trip.budget_currency} {totalActCost.toLocaleString()}</span>}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCatFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${catFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>
          All
        </button>
        {Object.entries(CAT).filter(([k]) => allActivities.some(a => a.category === k)).map(([k, v]) => (
          <button key={k} onClick={() => setCatFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${catFilter === k ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>
            {v.emoji} {v.label}
          </button>
        ))}
      </div>

      {filteredActs.length === 0 ? (
        <div className="card text-center py-14">
          <div className="text-4xl mb-3">📍</div>
          <p className="text-slate-500 text-sm">No activities yet. Add them from the Itinerary tab.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredActs.map(a => (
            <div key={a.id} className="card hover:shadow-card-hover transition-all">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{CAT[a.category]?.emoji || '📍'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm truncate">{a.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Day {a.day_number} · {format(parseISO(a.day_date), 'MMM d')}</div>
                  {a.location_name && <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={9} />{a.location_name}</div>}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT[a.category]?.color}`}>{CAT[a.category]?.label}</span>
                {a.cost_eur > 0 && <span className="text-xs font-bold text-slate-700">{trip.budget_currency} {a.cost_eur}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Tab: Budget ───────────────────────────────────────────────────────────
  const TabBudget = (
    <div className="space-y-5">
      {/* Overview card */}
      <div className="card bg-gradient-to-br from-sky-50 to-indigo-50 border-sky-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-slate-500">Total spent</div>
            <div className="text-3xl font-bold font-display text-slate-900">{trip.budget_currency} {totalSpent.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Budget</div>
            <div className="text-xl font-bold text-slate-700">{trip.budget_currency} {(trip.budget_total || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-white/60 rounded-full h-3 overflow-hidden mb-1">
          <div className={`h-full rounded-full transition-all duration-700 ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-sky-500 to-indigo-600'}`}
            style={{ width: `${budgetPct}%` }} />
        </div>
        <div className="text-xs text-slate-500">{budgetPct.toFixed(0)}% of budget used
          {trip.budget_total > 0 && <span className="ml-2 text-emerald-600 font-semibold">· {trip.budget_currency} {Math.max(0, trip.budget_total - totalSpent).toLocaleString()} remaining</span>}
        </div>
      </div>

      {/* Category breakdown */}
      {trip.budget_total > 0 && (
        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4 font-display">Budget Breakdown</h3>
          <div className="space-y-3">
            {BUDGET_CATS.map(cat => {
              const allocated = trip[cat.key] || 0
              if (allocated === 0) return null
              const pct = Math.min(100, (allocated / trip.budget_total) * 100)
              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 text-slate-700 font-medium">{cat.emoji} {cat.label}</span>
                    <span className="font-semibold text-slate-800">{trip.budget_currency} {allocated.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            }).filter(Boolean)}
          </div>
        </div>
      )}

      {/* Add expense */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 font-display">Expenses ({transactions.length})</h3>
        <button onClick={() => setExpenseModal(true)} className="btn-primary text-sm py-2 flex items-center gap-1.5">
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-slate-500 text-sm">No expenses logged yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(t => (
            <div key={t.id} className="card flex items-center gap-3 py-3">
              <span className="text-xl">{CAT[t.category]?.emoji || '💼'}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm truncate">{t.title}</div>
                <div className="text-xs text-slate-400">{CAT[t.category]?.label}{t.transaction_date && ` · ${format(parseISO(t.transaction_date), 'MMM d')}`}</div>
              </div>
              <span className="font-bold text-slate-800 text-sm flex-shrink-0">{t.currency_local} {t.amount_local?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const tabContent = {
    itinerary: TabItinerary,
    hotels: TabHotels,
    transport: TabTransport,
    activities: TabActivities,
    budget: TabBudget,
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/trips" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0 mt-1">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="section-title truncate">{trip.title}</h1>
            <span className={`badge flex-shrink-0 ${TRIP_STATUSES[trip.status]?.color}`}>{TRIP_STATUSES[trip.status]?.label}</span>
          </div>
          <p className="text-slate-500 text-sm">
            📅 {format(parseISO(trip.start_date), 'MMM d')} – {format(parseISO(trip.end_date), 'MMM d, yyyy')}
            <span className="mx-2">·</span>
            {trip.total_days} day{trip.total_days !== 1 ? 's' : ''}
            {trip.traveller_count > 1 && <><span className="mx-2">·</span> 👥 {trip.traveller_count} travellers</>}
          </p>
        </div>
        <button
          onClick={() => {
            const dest = trip.trip_destinations?.[0]?.city || trip.title
            const params = new URLSearchParams({ destination: dest, checkin: trip.start_date, checkout: trip.end_date })
            navigate(`/booking?${params}`)
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold hover:from-sky-600 hover:to-indigo-700 transition-all flex-shrink-0"
          title="Book flights & hotels">
          <Plane size={14} /> Book
        </button>
        <button
          onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0" title="Share">
          <Share2 size={18} />
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto scrollbar-hide -mx-1 px-1">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 sm:flex-1 justify-center min-h-[44px]
              ${activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}>
            <span>{tab.emoji}</span>
            <span className="hidden xs:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Destination alerts strip */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {alerts.map((a, i) => (
          <div key={i} className="flex-shrink-0 bg-amber-50 border border-amber-100 text-amber-800 text-xs font-medium px-3 py-2 rounded-xl">
            {a}
          </div>
        ))}
      </div>

      {/* Active tab content */}
      {tabContent[activeTab]}

      {/* ── Modals ─────────────────────────────────────────────────────── */}

      {activityModal && (
        <Modal title={`Add Activity — Day ${selectedDay?.day_number}`} onClose={() => setActivityModal(false)}>
          <FormRow label="Title *">
            <input className="input" placeholder="e.g. Visit Senso-ji Temple" value={actForm.title} onChange={e => setActForm(f => ({...f, title: e.target.value}))} />
          </FormRow>
          <FormRow label="Category">
            <select className="input" value={actForm.category} onChange={e => setActForm(f => ({...f, category: e.target.value}))}>
              {Object.entries(CAT).map(([k,v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
          </FormRow>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormRow label="Start time">
              <input type="time" className="input" value={actForm.start_time} onChange={e => setActForm(f => ({...f, start_time: e.target.value}))} />
            </FormRow>
            <FormRow label={`Cost (${trip.budget_currency})`}>
              <input type="number" className="input" placeholder="0" value={actForm.cost} onChange={e => setActForm(f => ({...f, cost: e.target.value}))} />
            </FormRow>
          </div>
          <FormRow label="Location">
            <input className="input" placeholder="e.g. Asakusa, Tokyo" value={actForm.location} onChange={e => setActForm(f => ({...f, location: e.target.value}))} />
          </FormRow>
          <FormRow label="Notes">
            <textarea className="input resize-none" rows={2} value={actForm.notes} onChange={e => setActForm(f => ({...f, notes: e.target.value}))} />
          </FormRow>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setActivityModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAddActivity} disabled={saving} className="btn-primary flex-1">{saving ? 'Adding...' : 'Add Activity'}</button>
          </div>
        </Modal>
      )}

      {hotelModal && (
        <Modal title="Add Hotel / Accommodation" onClose={() => setHotelModal(false)}>
          <FormRow label="Hotel name *">
            <input className="input" placeholder="e.g. Park Hyatt Tokyo" value={hotelForm.name} onChange={e => setHotelForm(f => ({...f, name: e.target.value}))} />
          </FormRow>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormRow label="City">
              <input className="input" placeholder="Tokyo" value={hotelForm.city} onChange={e => setHotelForm(f => ({...f, city: e.target.value}))} />
            </FormRow>
            <FormRow label="Phone">
              <input className="input" placeholder="+81 3-xxxx" value={hotelForm.phone} onChange={e => setHotelForm(f => ({...f, phone: e.target.value}))} />
            </FormRow>
          </div>
          <FormRow label="Address">
            <input className="input" value={hotelForm.address} onChange={e => setHotelForm(f => ({...f, address: e.target.value}))} />
          </FormRow>
          <FormRow label="Website">
            <input className="input" placeholder="https://..." value={hotelForm.website} onChange={e => setHotelForm(f => ({...f, website: e.target.value}))} />
          </FormRow>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormRow label="Check-in">
              <input type="date" className="input" value={hotelForm.check_in_date} onChange={e => setHotelForm(f => ({...f, check_in_date: e.target.value}))} />
            </FormRow>
            <FormRow label="Check-out">
              <input type="date" className="input" value={hotelForm.check_out_date} onChange={e => setHotelForm(f => ({...f, check_out_date: e.target.value}))} />
            </FormRow>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormRow label="Cost per night">
                <input type="number" className="input" placeholder="150" value={hotelForm.cost_per_night} onChange={e => setHotelForm(f => ({...f, cost_per_night: e.target.value}))} />
              </FormRow>
            </div>
            <FormRow label="Currency">
              <select className="input" value={hotelForm.cost_currency} onChange={e => setHotelForm(f => ({...f, cost_currency: e.target.value}))}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </FormRow>
          </div>
          <FormRow label="Booking reference">
            <input className="input" placeholder="BK-12345" value={hotelForm.booking_ref} onChange={e => setHotelForm(f => ({...f, booking_ref: e.target.value}))} />
          </FormRow>
          <FormRow label="Notes">
            <textarea className="input resize-none" rows={2} value={hotelForm.notes} onChange={e => setHotelForm(f => ({...f, notes: e.target.value}))} />
          </FormRow>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setHotelModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAddHotel} disabled={saving} className="btn-primary flex-1">{saving ? 'Adding...' : 'Add Hotel'}</button>
          </div>
        </Modal>
      )}

      {transportModal && (
        <Modal title="Add Transport" onClose={() => setTransportModal(false)}>
          <FormRow label="Type">
            <div className="grid grid-cols-4 xs:grid-cols-4 gap-2">
              {Object.entries(TRANSPORT_EMOJI).slice(0, 8).map(([k, emoji]) => (
                <button key={k} onClick={() => setLegForm(f => ({...f, type: k}))}
                  className={`p-2 rounded-xl border text-center text-sm transition-all ${legForm.type === k ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="text-xl">{emoji}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 capitalize">{k.replace('_', ' ')}</div>
                </button>
              ))}
            </div>
          </FormRow>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormRow label="From city *">
              <input className="input" placeholder="Dublin" value={legForm.from_city} onChange={e => setLegForm(f => ({...f, from_city: e.target.value}))} />
            </FormRow>
            <FormRow label="To city *">
              <input className="input" placeholder="Tokyo" value={legForm.to_city} onChange={e => setLegForm(f => ({...f, to_city: e.target.value}))} />
            </FormRow>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <FormRow label="Date">
                <input type="date" className="input" value={legForm.departure_date} onChange={e => setLegForm(f => ({...f, departure_date: e.target.value}))} />
              </FormRow>
            </div>
            <FormRow label="Departs">
              <input type="time" className="input" value={legForm.departure_time} onChange={e => setLegForm(f => ({...f, departure_time: e.target.value}))} />
            </FormRow>
            <FormRow label="Arrives">
              <input type="time" className="input" value={legForm.arrival_time} onChange={e => setLegForm(f => ({...f, arrival_time: e.target.value}))} />
            </FormRow>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormRow label="Cost">
                <input type="number" className="input" placeholder="0" value={legForm.cost} onChange={e => setLegForm(f => ({...f, cost: e.target.value}))} />
              </FormRow>
            </div>
            <FormRow label="Currency">
              <select className="input" value={legForm.cost_currency} onChange={e => setLegForm(f => ({...f, cost_currency: e.target.value}))}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </FormRow>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormRow label="Operator">
              <input className="input" placeholder="Aer Lingus" value={legForm.operator} onChange={e => setLegForm(f => ({...f, operator: e.target.value}))} />
            </FormRow>
            <FormRow label="Booking ref">
              <input className="input" placeholder="ABC123" value={legForm.booking_ref} onChange={e => setLegForm(f => ({...f, booking_ref: e.target.value}))} />
            </FormRow>
          </div>
          <FormRow label="Notes">
            <textarea className="input resize-none" rows={2} value={legForm.notes} onChange={e => setLegForm(f => ({...f, notes: e.target.value}))} />
          </FormRow>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setTransportModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAddTransport} disabled={saving} className="btn-primary flex-1">{saving ? 'Adding...' : 'Add Transport'}</button>
          </div>
        </Modal>
      )}

      {expenseModal && (
        <Modal title="Log Expense" onClose={() => setExpenseModal(false)}>
          <FormRow label="Category">
            <select className="input" value={expForm.category} onChange={e => setExpForm(f => ({...f, category: e.target.value}))}>
              {['flight','accommodation','food','transport','activities','shopping','visa','insurance','communication','other'].map(c => (
                <option key={c} value={c}>{CAT[c]?.emoji || '💼'} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </FormRow>
          <FormRow label="Description *">
            <input className="input" placeholder="e.g. Dinner at Nobu" value={expForm.title} onChange={e => setExpForm(f => ({...f, title: e.target.value}))} />
          </FormRow>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormRow label="Amount *">
                <input type="number" className="input" placeholder="0" value={expForm.amount} onChange={e => setExpForm(f => ({...f, amount: e.target.value}))} />
              </FormRow>
            </div>
            <FormRow label="Currency">
              <select className="input" value={expForm.currency} onChange={e => setExpForm(f => ({...f, currency: e.target.value}))}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </FormRow>
          </div>
          <FormRow label="Date">
            <input type="date" className="input" value={expForm.date} onChange={e => setExpForm(f => ({...f, date: e.target.value}))} />
          </FormRow>
          <FormRow label="Notes">
            <textarea className="input resize-none" rows={2} value={expForm.notes} onChange={e => setExpForm(f => ({...f, notes: e.target.value}))} />
          </FormRow>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setExpenseModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAddExpense} disabled={saving} className="btn-primary flex-1">{saving ? 'Adding...' : 'Log Expense'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
