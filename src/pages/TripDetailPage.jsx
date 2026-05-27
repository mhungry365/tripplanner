import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTripsStore } from '../stores/tripsStore'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Plus, X, MapPin, Clock, ExternalLink,
  Share2, ChevronRight, Plane, Pencil, Trash2, Check, GripVertical, Search,
  Loader2, Brain, Users2, Camera, Sparkles, CalendarPlus,
} from 'lucide-react'
import { TRIP_STATUSES, CURRENCIES } from '../lib/constants'
import { format, eachDayOfInterval, parseISO, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'
import { calculateCompatibility } from '../lib/compatibility'

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'itinerary',  label: 'Plan'       },
  { id: 'hotels',     label: 'Hotels'     },
  { id: 'transport',  label: 'Transport'  },
  { id: 'activities', label: 'Activities' },
  { id: 'budget',     label: 'Budget'     },
  { id: 'visa',       label: 'Visa'       },
  { id: 'checklist',  label: 'Checklist'  },
  { id: 'travellers', label: 'Travellers' },
  { id: 'memories',   label: 'Memories'   },
]

const CHECKLIST_CAT_EMOJI = { Documents: '📄', Health: '💊', Clothing: '👕', Tech: '📱', Money: '💳', Misc: '🎒' }

function getDestination(trip) {
  return trip?.trip_destinations?.[0]?.city || trip?.title || 'your destination'
}

function getDaysUntilTrip(trip) {
  if (!trip?.start_date) return null
  return differenceInDays(parseISO(trip.start_date), new Date())
}

function heroGrad(trip) {
  const dest = getDestination(trip).toLowerCase()
  if (/japan|tokyo|kyoto|osaka/.test(dest)) return 'from-pink-600 via-rose-500 to-orange-400'
  if (/paris|france/.test(dest)) return 'from-indigo-600 via-purple-500 to-pink-400'
  if (/bali|indonesia|thailand/.test(dest)) return 'from-emerald-500 via-teal-500 to-cyan-400'
  if (/new york|usa|america/.test(dest)) return 'from-slate-700 via-slate-600 to-blue-500'
  if (/dubai|uae/.test(dest)) return 'from-amber-500 via-orange-500 to-yellow-400'
  if (/italy|rome|venice|milan/.test(dest)) return 'from-orange-500 via-red-500 to-rose-400'
  if (/spain|barcelona|madrid/.test(dest)) return 'from-red-600 via-orange-500 to-yellow-400'
  if (/greece|santorini|athens/.test(dest)) return 'from-blue-500 via-sky-400 to-cyan-300'
  return 'from-sky-500 via-indigo-500 to-purple-600'
}

function getDefaultChecklist(trip) {
  const dest = getDestination(trip)
  return [
    { category: 'Documents', title: 'Passport (valid 6+ months)', done: false },
    { category: 'Documents', title: 'Travel insurance policy', done: false },
    { category: 'Documents', title: 'Flight & hotel confirmations', done: false },
    { category: 'Documents', title: `Visa for ${dest}`, done: false },
    { category: 'Health', title: 'Check vaccination requirements', done: false },
    { category: 'Health', title: 'Pack prescription medications', done: false },
    { category: 'Health', title: 'First aid kit & sanitiser', done: false },
    { category: 'Tech', title: 'Chargers & universal adapter', done: false },
    { category: 'Tech', title: 'Download offline maps', done: false },
    { category: 'Tech', title: 'Enable international roaming', done: false },
    { category: 'Money', title: 'Notify bank of travel dates', done: false },
    { category: 'Money', title: 'Get local currency / card', done: false },
    { category: 'Misc', title: 'Arrange pet or house care', done: false },
    { category: 'Misc', title: 'Check weather & pack accordingly', done: false },
  ]
}

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
  { key: 'budget_flights',    label: 'Flights',    emoji: '✈️',  expCat: 'flight' },
  { key: 'budget_hotels',     label: 'Hotels',     emoji: '🏨',  expCat: 'accommodation' },
  { key: 'budget_food',       label: 'Food',       emoji: '🍜',  expCat: 'food' },
  { key: 'budget_transport',  label: 'Transport',  emoji: '🚄',  expCat: 'transport' },
  { key: 'budget_activities', label: 'Activities', emoji: '🎭',  expCat: 'activities' },
  { key: 'budget_misc',       label: 'Misc',       emoji: '💼',  expCat: null },
]

const ALERTS_MAP = {
  japan:   ['🌸 Cherry blossom season March–April', '⚡ 100V electrical outlets', '💴 Cash preferred', '🚭 Strict no-smoking rules'],
  nepal:   ['🏔️ Altitude sickness above 3000m', '💉 Vaccinations recommended', '🪙 Local currency preferred', '📋 Trekking permits required'],
  default: ['📋 Check visa requirements', '🏥 Get travel insurance', '📱 Check roaming charges'],
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

const HOTEL_STATUSES = ['wishlist','pending','booked','confirmed','checked_in','checked_out','cancelled']

// ─── Shared Modal ────────────────────────────────────────────────────────────

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

  // Add modals
  const [activityModal, setActivityModal] = useState(false)
  const [hotelModal, setHotelModal]       = useState(false)
  const [transportModal, setTransportModal] = useState(false)
  const [expenseModal, setExpenseModal]   = useState(false)
  const [roamingModal, setRoamingModal]   = useState(false)
  const [insuranceModal, setInsuranceModal] = useState(false)
  const [selectedDay, setSelectedDay]     = useState(null)

  // Add forms
  const [actForm, setActForm] = useState({ title: '', category: 'sightseeing', location: '', start_time: '', cost: '', notes: '' })
  const [hotelForm, setHotelForm] = useState({ name: '', address: '', city: '', phone: '', website: '', check_in_date: '', check_out_date: '', cost_per_night: '', cost_currency: 'EUR', booking_ref: '', status: 'wishlist', notes: '' })
  const [legForm, setLegForm] = useState({ type: 'flight', from_city: '', to_city: '', departure_date: '', departure_time: '', arrival_time: '', cost: '', cost_currency: 'EUR', operator: '', booking_ref: '', notes: '' })
  const [expForm, setExpForm] = useState({ category: 'food', title: '', amount: '', currency: 'EUR', date: '', notes: '' })

  // Edit activity
  const [editActModal,  setEditActModal]  = useState(false)
  const [editActId,     setEditActId]     = useState(null)
  const [editActForm,   setEditActForm]   = useState({ title: '', category: 'sightseeing', location: '', start_time: '', cost: '', notes: '' })

  // Edit hotel
  const [editHotelModal, setEditHotelModal] = useState(false)
  const [editHotelId,    setEditHotelId]    = useState(null)
  const [editHotelForm,  setEditHotelForm]  = useState({ name: '', address: '', city: '', phone: '', website: '', check_in_date: '', check_out_date: '', cost_per_night: '', cost_currency: 'EUR', booking_ref: '', status: 'wishlist', notes: '' })

  // Edit transport
  const [editLegModal, setEditLegModal] = useState(false)
  const [editLegId,    setEditLegId]    = useState(null)
  const [editLegForm,  setEditLegForm]  = useState({ type: 'flight', from_city: '', to_city: '', departure_date: '', departure_time: '', arrival_time: '', cost: '', cost_currency: 'EUR', operator: '', booking_ref: '', notes: '' })

  // Edit expense
  const [editExpModal,  setEditExpModal]  = useState(false)
  const [editExpId,     setEditExpId]     = useState(null)
  const [editExpForm,   setEditExpForm]   = useState({ category: 'food', title: '', amount: '', currency: 'EUR', date: '', notes: '' })

  // Budget
  const [editingBudget,  setEditingBudget]  = useState(false)
  const [newBudget,      setNewBudget]      = useState('')
  const [editCatBudget,    setEditCatBudget]    = useState(null)
  const [editCatBudgetVal, setEditCatBudgetVal] = useState('')

  // Day title editing
  const [editDayId,    setEditDayId]    = useState(null)
  const [editDayTitle, setEditDayTitle] = useState('')
  const [addingDay,    setAddingDay]    = useState(false)

  const trip = currentTrip
  const { profile: myProfile } = useAuthStore()

  // New intelligent feature state
  const [aiPlan, setAiPlan]                       = useState(null)
  const [aiLoading, setAiLoading]                 = useState(false)
  const [aiError, setAiError]                     = useState('')
  const [checkItems, setCheckItems]               = useState([])
  const [checkLoading, setCheckLoading]           = useState(false)
  const [memories, setMemories]                   = useState([])
  const [memoriesLoading, setMemoriesLoading]     = useState(false)
  const [fellowTravellers, setFellowTravellers]   = useState([])
  const [travellersLoading, setTravellersLoading] = useState(false)

  // Visa intelligence
  const [passportCountry, setPassportCountry]     = useState('')
  const [visaInfo, setVisaInfo]                   = useState(null)
  const [visaLoading, setVisaLoading]             = useState(false)

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

  // Load passport country whenever auth resolves (myProfile loads async after mount)
  useEffect(() => {
    if (!myProfile?.id || passportCountry) return
    supabase.from('profiles').select('passport_country').eq('id', myProfile.id).single()
      .then(({ data }) => { if (data?.passport_country) setPassportCountry(data.passport_country) })
  }, [myProfile?.id])

  // Run visa check whenever both passport and trip are available
  useEffect(() => {
    if (passportCountry && trip?.id) {
      checkVisa(passportCountry, trip)
    }
  }, [trip?.id, passportCountry])

  useEffect(() => {
    if (!id) return
    supabase.from('budget_transactions').select('*').eq('trip_id', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setTransactions(data || []))
  }, [id])

  useEffect(() => {
    if (!trip || !id) return
    if (activeTab === 'itinerary'  && !aiPlan && !aiLoading)                      loadAiPlan()
    if (activeTab === 'checklist'  && checkItems.length === 0 && !checkLoading)   loadChecklist()
    if (activeTab === 'travellers' && fellowTravellers.length === 0 && !travellersLoading) loadFellowTravellers()
    if (activeTab === 'memories'   && memories.length === 0 && !memoriesLoading)  loadMemories()
  }, [activeTab, trip, id])

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
      status: hotelForm.status || 'wishlist',
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
      setHotelForm({ name: '', address: '', city: '', phone: '', website: '', check_in_date: '', check_out_date: '', cost_per_night: '', cost_currency: 'EUR', booking_ref: '', status: 'wishlist', notes: '' })
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

  // ── Edit/Delete activity ──────────────────────────────────────────────────

  const openEditAct = (a) => {
    setEditActId(a.id)
    setEditActForm({ title: a.title||'', category: a.category||'sightseeing', location: a.location_name||'', start_time: a.start_time||'', cost: a.cost_eur?.toString()||'', notes: a.notes||'' })
    setEditActModal(true)
  }

  const handleUpdateAct = async () => {
    if (!editActForm.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    const patch = { title: editActForm.title.trim(), category: editActForm.category, location_name: editActForm.location||null, start_time: editActForm.start_time||null, cost_eur: parseFloat(editActForm.cost)||0, cost_local: parseFloat(editActForm.cost)||0, notes: editActForm.notes||null }
    const { error } = await supabase.from('activities').update(patch).eq('id', editActId)
    if (error) { toast.error(error.message) }
    else {
      setDays(prev => prev.map(d => ({ ...d, activities: (d.activities||[]).map(a => a.id === editActId ? {...a,...patch} : a) })))
      setEditActModal(false)
      toast.success('Activity updated!')
    }
    setSaving(false)
  }

  const handleDeleteAct = async (actId, dayId) => {
    if (!window.confirm('Delete this activity?')) return
    const { error } = await supabase.from('activities').delete().eq('id', actId)
    if (error) { toast.error(error.message); return }
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, activities: (d.activities||[]).filter(a => a.id !== actId) } : d))
    toast.success('Activity deleted')
  }

  // ── Edit/Delete hotel ─────────────────────────────────────────────────────

  const openEditHotel = (h) => {
    setEditHotelId(h.id)
    setEditHotelForm({ name: h.name||'', address: h.address||'', city: h.city||'', phone: h.phone||'', website: h.website||'', check_in_date: h.check_in_date||'', check_out_date: h.check_out_date||'', cost_per_night: h.cost_per_night_eur?.toString()||'', cost_currency: h.cost_currency||'EUR', booking_ref: h.booking_ref||'', status: h.status||'wishlist', notes: h.notes||'' })
    setEditHotelModal(true)
  }

  const handleUpdateHotel = async () => {
    if (!editHotelForm.name.trim()) { toast.error('Hotel name required'); return }
    setSaving(true)
    const nights = editHotelForm.check_in_date && editHotelForm.check_out_date
      ? Math.max(1, (new Date(editHotelForm.check_out_date) - new Date(editHotelForm.check_in_date)) / 86400000)
      : null
    const patch = { name: editHotelForm.name.trim(), address: editHotelForm.address||null, city: editHotelForm.city||null, phone: editHotelForm.phone||null, website: editHotelForm.website||null, check_in_date: editHotelForm.check_in_date||null, check_out_date: editHotelForm.check_out_date||null, cost_per_night_eur: parseFloat(editHotelForm.cost_per_night)||null, cost_per_night_local: parseFloat(editHotelForm.cost_per_night)||null, total_cost_eur: nights && editHotelForm.cost_per_night ? nights * parseFloat(editHotelForm.cost_per_night) : null, cost_currency: editHotelForm.cost_currency, booking_ref: editHotelForm.booking_ref||null, status: editHotelForm.status, notes: editHotelForm.notes||null }
    const { error } = await supabase.from('accommodations').update(patch).eq('id', editHotelId)
    if (error) { toast.error(error.message) }
    else { setHotels(prev => prev.map(h => h.id === editHotelId ? {...h,...patch} : h)); setEditHotelModal(false); toast.success('Hotel updated!') }
    setSaving(false)
  }

  const handleDeleteHotel = async (hotelId) => {
    if (!window.confirm('Remove this hotel?')) return
    const { error } = await supabase.from('accommodations').delete().eq('id', hotelId)
    if (error) { toast.error(error.message); return }
    setHotels(prev => prev.filter(h => h.id !== hotelId))
    toast.success('Hotel removed')
  }

  // ── Edit/Delete transport ─────────────────────────────────────────────────

  const openEditLeg = (l) => {
    setEditLegId(l.id)
    setEditLegForm({ type: l.type||'flight', from_city: l.from_city||'', to_city: l.to_city||'', departure_date: l.departure_date||'', departure_time: l.departure_time||'', arrival_time: l.arrival_time||'', cost: l.cost_eur?.toString()||'', cost_currency: l.cost_currency||'EUR', operator: l.operator||'', booking_ref: l.booking_ref||'', notes: l.notes||'' })
    setEditLegModal(true)
  }

  const handleUpdateLeg = async () => {
    if (!editLegForm.from_city.trim() || !editLegForm.to_city.trim()) { toast.error('From and To cities required'); return }
    setSaving(true)
    const patch = { type: editLegForm.type, from_city: editLegForm.from_city.trim(), to_city: editLegForm.to_city.trim(), departure_date: editLegForm.departure_date||null, departure_time: editLegForm.departure_time||null, arrival_time: editLegForm.arrival_time||null, cost_eur: parseFloat(editLegForm.cost)||0, cost_local: parseFloat(editLegForm.cost)||0, cost_currency: editLegForm.cost_currency, operator: editLegForm.operator||null, booking_ref: editLegForm.booking_ref||null, notes: editLegForm.notes||null }
    const { error } = await supabase.from('transport_legs').update(patch).eq('id', editLegId)
    if (error) { toast.error(error.message) }
    else { setLegs(prev => prev.map(l => l.id === editLegId ? {...l,...patch} : l)); setEditLegModal(false); toast.success('Transport updated!') }
    setSaving(false)
  }

  const handleDeleteLeg = async (legId) => {
    if (!window.confirm('Remove this transport leg?')) return
    const { error } = await supabase.from('transport_legs').delete().eq('id', legId)
    if (error) { toast.error(error.message); return }
    setLegs(prev => prev.filter(l => l.id !== legId))
    toast.success('Transport removed')
  }

  // ── Edit/Delete expense ───────────────────────────────────────────────────

  const openEditExpense = (t) => {
    setEditExpId(t.id)
    setEditExpForm({ category: t.category||'food', title: t.title||'', amount: t.amount_local?.toString()||'', currency: t.currency_local||'EUR', date: t.transaction_date||'', notes: t.notes||'' })
    setEditExpModal(true)
  }

  const handleUpdateExpense = async () => {
    if (!editExpForm.title.trim() || !editExpForm.amount) { toast.error('Title and amount required'); return }
    setSaving(true)
    const patch = { category: editExpForm.category, title: editExpForm.title.trim(), amount_local: parseFloat(editExpForm.amount), currency_local: editExpForm.currency, amount_eur: parseFloat(editExpForm.amount), transaction_date: editExpForm.date||null, notes: editExpForm.notes||null }
    const { error } = await supabase.from('budget_transactions').update(patch).eq('id', editExpId)
    if (error) { toast.error(error.message) }
    else { setTransactions(prev => prev.map(t => t.id === editExpId ? {...t,...patch} : t)); setEditExpModal(false); toast.success('Expense updated!') }
    setSaving(false)
  }

  const handleDeleteExpense = async (txId) => {
    if (!window.confirm('Delete this expense?')) return
    const { error } = await supabase.from('budget_transactions').delete().eq('id', txId)
    if (error) { toast.error(error.message); return }
    setTransactions(prev => prev.filter(t => t.id !== txId))
    toast.success('Expense deleted')
  }

  // ── Budget ────────────────────────────────────────────────────────────────

  const handleUpdateBudget = async () => {
    const val = parseFloat(newBudget)
    if (isNaN(val) || val < 0) { toast.error('Enter a valid budget amount'); return }
    const { error } = await supabase.from('trips').update({ budget_total: val }).eq('id', trip.id)
    if (error) { toast.error(error.message); return }
    await fetchTrip(id)
    setEditingBudget(false)
    toast.success('Budget updated!')
  }

  const handleUpdateCatBudget = async () => {
    const val = parseFloat(editCatBudgetVal)
    if (isNaN(val) || val < 0) { toast.error('Enter a valid amount'); return }
    const { error } = await supabase.from('trips').update({ [editCatBudget]: val }).eq('id', trip.id)
    if (error) { toast.error(error.message); return }
    await fetchTrip(id)
    setEditCatBudget(null)
    toast.success('Category budget updated!')
  }

  // ── Day management ────────────────────────────────────────────────────────

  const handleAddDay = async () => {
    if (!trip) return
    setAddingDay(true)
    const lastDay = days[days.length - 1]
    const newDate = lastDay
      ? format(new Date(new Date(lastDay.date).getTime() + 86400000), 'yyyy-MM-dd')
      : (trip.start_date || format(new Date(), 'yyyy-MM-dd'))
    const { data, error } = await supabase.from('itinerary_days').insert({
      trip_id: trip.id,
      day_number: (lastDay?.day_number || 0) + 1,
      date: newDate,
      city: trip.trip_destinations?.[0]?.city || '',
      phase: 'explore',
    }).select().single()
    if (error) { toast.error(error.message) }
    else { setDays(prev => [...prev, { ...data, activities: [] }]); toast.success('Day added!') }
    setAddingDay(false)
  }

  const handleSaveDayTitle = async (dayId) => {
    const { error } = await supabase.from('itinerary_days').update({ title: editDayTitle }).eq('id', dayId)
    if (error) { toast.error(error.message); return }
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, title: editDayTitle } : d))
    setEditDayId(null)
  }

  // ── Visa Intelligence ─────────────────────────────────────────────────────

  const checkVisa = async (passport, tripData) => {
    const t = tripData || trip
    if (!passport || !t) return
    setVisaLoading(true)
    setVisaInfo(null)
    try {
      const destination = t.trip_destinations?.[0]?.city || t.title || 'Unknown'
      const country = t.trip_destinations?.[0]?.country_name || ''
      const res = await fetch('/api/visa-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passport_country: passport,
          destination,
          destination_country: country,
        }),
      })
      if (!res.ok) throw new Error('API error ' + res.status)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setVisaInfo(data)
    } catch (e) {
      console.error('visa check failed:', e)
      setVisaInfo({ error: e.message })
    }
    setVisaLoading(false)
  }

  // ── AI Plan ───────────────────────────────────────────────────────────────

  const loadAiPlan = async () => {
    if (!trip) return
    setAiLoading(true)
    setAiError('')
    const dest = getDestination(trip)
    const numDays = trip.total_days || 7
    const prompt = `Create a detailed ${numDays}-day travel itinerary for ${dest}. Return ONLY valid JSON, no markdown, no code fences:
{"overview":"2-3 sentence trip summary","highlights":["highlight1","highlight2","highlight3"],"days":[{"day":1,"theme":"Day theme","morning":"Morning activity","afternoon":"Afternoon activity","evening":"Evening activity/dinner","tip":"Local insider tip"}],"practical":{"best_time":"Best season note","getting_around":"Local transport advice","budget_tip":"Money saving tip","must_try":"Must-try food or experience"}}`
    try {
      const resp = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const respData = await resp.json()
      if (!resp.ok) { setAiError(respData.error || 'AI request failed'); setAiLoading(false); return }
      const plan = JSON.parse(respData.text)
      setAiPlan(plan)
    } catch (err) {
      setAiError(err.message || 'Failed to generate plan')
    }
    setAiLoading(false)
  }

  // ── Checklist ─────────────────────────────────────────────────────────────

  const loadChecklist = async () => {
    if (!id) return
    setCheckLoading(true)
    const { data } = await supabase.from('trip_checklist').select('*').eq('trip_id', id).order('created_at')
    if (data && data.length > 0) {
      setCheckItems(data)
    } else {
      const defaults = getDefaultChecklist(trip).map(item => ({ ...item, trip_id: id }))
      const { data: created } = await supabase.from('trip_checklist').insert(defaults).select()
      if (created) setCheckItems(created)
    }
    setCheckLoading(false)
  }

  const toggleCheckItem = async (item) => {
    const newDone = !item.done
    const { error } = await supabase.from('trip_checklist').update({ done: newDone }).eq('id', item.id)
    if (!error) setCheckItems(prev => prev.map(c => c.id === item.id ? { ...c, done: newDone } : c))
  }

  // ── Memories ──────────────────────────────────────────────────────────────

  const loadMemories = async () => {
    if (!id) return
    setMemoriesLoading(true)
    const { data } = await supabase.from('posts')
      .select('id, content, image_url, created_at, profiles(full_name, avatar_url)')
      .eq('trip_id', id)
      .order('created_at', { ascending: false })
      .limit(24)
    setMemories(data || [])
    setMemoriesLoading(false)
  }

  // ── Fellow Travellers ─────────────────────────────────────────────────────

  const loadFellowTravellers = async () => {
    if (!trip) return
    setTravellersLoading(true)
    const dest = getDestination(trip)
    const destWord = dest.toLowerCase().split(',')[0].trim()
    const { data } = await supabase.from('trips')
      .select('user_id, title, start_date, end_date, trip_destinations(city, country_name), profiles!trips_user_id_fkey(id, full_name, avatar_url, bio, travel_style, budget_style, adventure_level, food_level, culture_level, bucket_list)')
      .neq('user_id', trip.user_id)
      .not('profiles', 'is', null)
      .limit(40)
    const filtered = (data || []).filter(t => {
      if (!t.profiles) return false
      const tText = [t.title, ...(t.trip_destinations || []).map(d => `${d.city} ${d.country_name}`)].join(' ').toLowerCase()
      return destWord.length > 3 && tText.includes(destWord)
    })
    const withScores = filtered.map(t => ({
      ...t,
      profile: t.profiles,
      compat: myProfile ? calculateCompatibility(myProfile, t.profiles) : null,
    })).sort((a, b) => (b.compat?.score || 0) - (a.compat?.score || 0))
    setFellowTravellers(withScores.slice(0, 8))
    setTravellersLoading(false)
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading || !trip) return (
    <div className="space-y-4 animate-fade-in max-w-5xl">
      <div className="h-10 w-48 shimmer rounded-xl" />
      <div className="h-40 shimmer rounded-2xl" />
      <div className="flex gap-2">{[1,2,3,4,5].map(i => <div key={i} className="h-10 flex-1 shimmer rounded-xl" />)}</div>
      <div className="h-64 shimmer rounded-2xl" />
    </div>
  )

  const allActivities = days.flatMap(d => (d.activities || []).map(a => ({ ...a, day_number: d.day_number, day_date: d.date, day_id: d.id })))
  const totalTransportCost = legs.reduce((s, l) => s + (l.cost_eur || 0), 0)
  const totalSpent = transactions.reduce((s, t) => s + (t.amount_eur || 0), 0)
  const budgetPct = trip.budget_total > 0 ? Math.min(100, (totalSpent / trip.budget_total) * 100) : 0
  const alerts = getAlerts(trip)

  const spentByExpCat = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + (t.amount_eur || 0)
    return acc
  }, {})

  const EXP_CATS = ['flight','accommodation','food','transport','activities','shopping','visa','insurance','communication','other']

  // ── Tab: Itinerary & AI ───────────────────────────────────────────────────
  const TabItinerary = (
    <div className="space-y-4">
      {/* AI Travel Assistant */}
      <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h3 className="font-bold text-slate-800 font-display">AI Travel Assistant</h3>
          </div>
          {!aiLoading && (
            <button onClick={() => { setAiPlan(null); loadAiPlan() }}
              className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5">
              <Sparkles size={13} /> {aiPlan ? 'Regenerate' : 'Generate AI Plan'}
            </button>
          )}
        </div>
        {aiLoading ? (
          <div className="flex items-center gap-3 text-indigo-600 py-4 justify-center">
            <Loader2 size={22} className="animate-spin" />
            <span className="font-medium text-sm">Crafting your itinerary...</span>
          </div>
        ) : aiError ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-slate-600 text-sm">{aiError}</p>
            <button onClick={loadAiPlan} className="btn-primary text-xs py-1.5 inline-flex items-center gap-1.5"><Brain size={13} /> Try Again</button>
          </div>
        ) : !aiPlan ? (
          <p className="text-slate-500 text-sm">Let Gemini AI craft a personalised day-by-day itinerary for {getDestination(trip)}. Click Generate to start.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-slate-600 text-sm leading-relaxed">{aiPlan.overview}</p>
            {aiPlan.highlights?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aiPlan.highlights.map((h, i) => (
                  <span key={i} className="text-xs bg-white border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">{h}</span>
                ))}
              </div>
            )}
            {(aiPlan.days || []).map(day => (
              <div key={day.day} className="bg-white rounded-xl p-3 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {day.day}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm font-display">{day.theme}</h4>
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  {[['🌅 Morning', day.morning], ['☀️ Afternoon', day.afternoon], ['🌙 Evening', day.evening]].map(([label, text]) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-2">
                      <div className="text-[10px] font-bold text-slate-500 mb-0.5">{label}</div>
                      <p className="text-xs text-slate-700 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
                {day.tip && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-2">
                    <span className="text-sm flex-shrink-0">💡</span>
                    <p className="text-xs text-amber-800">{day.tip}</p>
                  </div>
                )}
              </div>
            ))}
            {aiPlan.practical && (
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <div className="text-xs font-bold text-slate-500 mb-2">Practical Tips</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[['🗓️ Best Time', aiPlan.practical.best_time], ['🚇 Getting Around', aiPlan.practical.getting_around], ['💰 Budget Tip', aiPlan.practical.budget_tip], ['🍜 Must Try', aiPlan.practical.must_try]].map(([label, text]) => text && (
                    <div key={label} className="bg-slate-50 rounded-lg p-2">
                      <div className="text-[10px] font-bold text-slate-500 mb-0.5">{label}</div>
                      <p className="text-xs text-slate-700">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Day-by-day itinerary */}
    <div className="space-y-3">
      {days.length === 0 ? (
        <div className="card text-center py-14">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-slate-500 text-sm mb-4">No dates set on this trip yet.</p>
          <button onClick={handleAddDay} disabled={addingDay} className="btn-primary text-sm py-2 inline-flex items-center gap-1.5">
            <Plus size={14} /> Add First Day
          </button>
        </div>
      ) : (
        <>
          {days.map(day => (
            <div key={day.id} className="card overflow-hidden">
              {/* Day header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md">
                    {day.day_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editDayId === day.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          className="text-sm font-bold border border-sky-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-sky-400 flex-1 min-w-0"
                          value={editDayTitle}
                          onChange={e => setEditDayTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveDayTitle(day.id); if (e.key === 'Escape') setEditDayId(null) }}
                          placeholder="Day title..."
                        />
                        <button onClick={() => handleSaveDayTitle(day.id)} className="p-1 rounded-lg bg-sky-500 text-white hover:bg-sky-600 flex-shrink-0"><Check size={13} /></button>
                        <button onClick={() => setEditDayId(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 flex-shrink-0"><X size={13} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditDayId(day.id); setEditDayTitle(day.title || '') }}
                        className="group flex items-center gap-1.5 text-left w-full">
                        <div className="font-bold text-slate-800 font-display text-sm">
                          {day.title || format(parseISO(day.date), 'EEEE')}
                          <span className="font-normal text-slate-400 ml-2 text-xs">{format(parseISO(day.date), 'MMM d')}</span>
                        </div>
                        <Pencil size={11} className="text-slate-300 group-hover:text-sky-400 transition-colors flex-shrink-0" />
                      </button>
                    )}
                    {day.city && editDayId !== day.id && (
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={9} />{day.city}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedDay(day); setActivityModal(true) }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                  <Plus size={13} /> Add
                </button>
              </div>

              {/* Activities */}
              {day.activities?.length > 0 ? (
                <div className="mt-3 pl-14 space-y-1">
                  {day.activities.map(a => (
                    <div key={a.id} className="flex items-center gap-2 py-1.5 border-t border-slate-50 group">
                      <GripVertical size={13} className="text-slate-200 flex-shrink-0 cursor-grab" />
                      <span className="text-base">{CAT[a.category]?.emoji || '📍'}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-slate-700">{a.title}</span>
                        {a.location_name && <span className="text-xs text-slate-400 ml-1.5">{a.location_name}</span>}
                      </div>
                      {a.start_time && <span className="text-xs text-slate-400 flex items-center gap-0.5"><Clock size={9} />{a.start_time.slice(0,5)}</span>}
                      {a.cost_eur > 0 && <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full">€{a.cost_eur}</span>}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => openEditAct(a)} className="p-1 rounded text-slate-300 hover:text-sky-500 hover:bg-sky-50 transition-colors"><Pencil size={12} /></button>
                        <button onClick={() => handleDeleteAct(a.id, day.id)} className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-3 pl-14 italic">No activities — click + to add</p>
              )}
            </div>
          ))}

          {/* Add day */}
          <button
            onClick={handleAddDay}
            disabled={addingDay}
            className="w-full card border-dashed border-2 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all text-sm font-semibold text-slate-400 hover:text-sky-600 py-4 flex items-center justify-center gap-2">
            <Plus size={16} /> {addingDay ? 'Adding...' : 'Add Day'}
          </button>
        </>
      )}
    </div>
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
                <div className="flex items-center gap-1 flex-shrink-0">
                  {h.status && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${h.status === 'confirmed' ? 'bg-green-100 text-green-700' : h.status === 'booked' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                      {h.status}
                    </span>
                  )}
                  <button onClick={() => openEditHotel(h)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Edit"><Pencil size={13} /></button>
                  <button onClick={() => handleDeleteHotel(h.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 size={13} /></button>
                </div>
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
                <a href={`https://www.booking.com/search.html?ss=${encodeURIComponent(h.city || h.name)}&checkin=${h.check_in_date||''}&checkout=${h.check_out_date||''}`} target="_blank" rel="noreferrer"
                  className="text-xs flex items-center gap-1 text-indigo-600 hover:underline ml-auto">
                  <ExternalLink size={11} /> Book on Booking.com
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
              <div className="text-3xl flex-shrink-0 mt-0.5">{TRANSPORT_EMOJI[l.type] || '🚐'}</div>
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
                <div className="flex items-center gap-3 mt-2">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${l.type} ${l.from_city} to ${l.to_city} tickets`)}`}
                    target="_blank" rel="noreferrer"
                    className="text-xs flex items-center gap-1 text-indigo-600 hover:underline">
                    <Search size={11} /> Search tickets
                  </a>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {l.cost_eur > 0 && <span className="font-bold text-slate-700 text-sm">{l.cost_currency} {l.cost_eur}</span>}
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditLeg(l)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Edit"><Pencil size={13} /></button>
                  <button onClick={() => handleDeleteLeg(l.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 size={13} /></button>
                </div>
              </div>
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
        <button
          onClick={() => { setSelectedDay(days[0]); setActivityModal(true) }}
          disabled={days.length === 0}
          className="btn-primary text-sm py-2 flex items-center gap-1.5">
          <Plus size={15} /> Add Activity
        </button>
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
          <p className="text-slate-500 text-sm">No activities yet. Add them from the Itinerary tab or click above.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredActs.map(a => (
            <div key={a.id} className="card hover:shadow-card-hover transition-all group relative">
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditAct(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors bg-white shadow-sm border border-slate-100"><Pencil size={12} /></button>
                <button onClick={() => handleDeleteAct(a.id, a.day_id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors bg-white shadow-sm border border-slate-100"><Trash2 size={12} /></button>
              </div>
              <div className="flex items-start gap-3 pr-16">
                <span className="text-2xl">{CAT[a.category]?.emoji || '📍'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm leading-snug">{a.title}</div>
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
      {/* Overview */}
      <div className="card bg-gradient-to-br from-sky-50 to-indigo-50 border-sky-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-slate-500">Total spent</div>
            <div className="text-3xl font-bold font-display text-slate-900">{trip.budget_currency} {totalSpent.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Budget</div>
            {editingBudget ? (
              <div className="flex items-center gap-1 justify-end">
                <input autoFocus type="number" min="0"
                  className="w-28 px-2 py-1 text-sm border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-slate-800 font-bold"
                  value={newBudget} onChange={e => setNewBudget(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleUpdateBudget(); if (e.key === 'Escape') setEditingBudget(false) }} />
                <button onClick={handleUpdateBudget} className="p-1 rounded-lg bg-sky-500 text-white hover:bg-sky-600"><Check size={14} /></button>
                <button onClick={() => setEditingBudget(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => { setNewBudget((trip.budget_total||0).toString()); setEditingBudget(true) }}
                className="flex items-center gap-1.5 text-xl font-bold text-slate-700 hover:text-sky-600 transition-colors group" title="Click to edit budget">
                {trip.budget_currency} {(trip.budget_total||0).toLocaleString()}
                <Pencil size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-sky-500" />
              </button>
            )}
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

      {/* Category breakdown with real spending */}
      <div className="card">
        <h3 className="font-bold text-slate-800 mb-4 font-display">Category Breakdown</h3>
        <div className="space-y-4">
          {BUDGET_CATS.map(cat => {
            const allocated = trip[cat.key] || 0
            const spent = cat.expCat ? (spentByExpCat[cat.expCat] || 0) : Object.keys(spentByExpCat).filter(k => !['flight','accommodation','food','transport','activities'].includes(k)).reduce((s, k) => s + spentByExpCat[k], 0)
            const hasData = allocated > 0 || spent > 0
            if (!hasData) return null
            const allocPct = trip.budget_total > 0 ? Math.min(100, (allocated / trip.budget_total) * 100) : 0
            const spentPct = allocated > 0 ? Math.min(100, (spent / allocated) * 100) : 0
            return (
              <div key={cat.key}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">{cat.emoji} {cat.label}</span>
                  <div className="flex items-center gap-2">
                    {spent > 0 && <span className="text-xs text-slate-500">€{spent.toFixed(0)} spent</span>}
                    {editCatBudget === cat.key ? (
                      <div className="flex items-center gap-1">
                        <input autoFocus type="number" min="0"
                          className="w-20 px-1.5 py-0.5 text-xs border border-sky-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-400"
                          value={editCatBudgetVal} onChange={e => setEditCatBudgetVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdateCatBudget(); if (e.key === 'Escape') setEditCatBudget(null) }} />
                        <button onClick={handleUpdateCatBudget} className="p-0.5 rounded bg-sky-500 text-white hover:bg-sky-600"><Check size={11} /></button>
                        <button onClick={() => setEditCatBudget(null)} className="p-0.5 rounded text-slate-400 hover:bg-slate-100"><X size={11} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditCatBudget(cat.key); setEditCatBudgetVal(allocated.toString()) }}
                        className="flex items-center gap-1 font-semibold text-slate-700 hover:text-sky-600 transition-colors group text-xs">
                        {allocated > 0 ? `€${allocated.toLocaleString()}` : 'Set budget'}
                        <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                </div>
                {allocated > 0 && (
                  <div className="relative bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-sky-100 rounded-full" style={{ width: `${allocPct}%` }} />
                    <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${spentPct > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-sky-400 to-indigo-500'}`} style={{ width: `${spentPct * allocPct / 100}%` }} />
                  </div>
                )}
              </div>
            )
          }).filter(Boolean)}

          {BUDGET_CATS.every(cat => !(trip[cat.key] > 0) && !(cat.expCat ? spentByExpCat[cat.expCat] > 0 : false)) && (
            <p className="text-sm text-slate-400 text-center py-4">No category budgets set yet. Click on a category amount to set one.</p>
          )}

          {/* Show categories with spending but no budget */}
          {BUDGET_CATS.filter(cat => {
            const spent = cat.expCat ? (spentByExpCat[cat.expCat] || 0) : 0
            return spent > 0 && !(trip[cat.key] > 0)
          }).map(cat => {
            const spent = cat.expCat ? (spentByExpCat[cat.expCat] || 0) : 0
            return (
              <div key={`unbudgeted-${cat.key}`} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">{cat.emoji} {cat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">€{spent.toFixed(0)} spent</span>
                  <button onClick={() => { setEditCatBudget(cat.key); setEditCatBudgetVal('') }}
                    className="text-xs text-sky-600 hover:underline font-semibold">Set budget</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Expenses */}
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
              <span className="text-xl flex-shrink-0">{CAT[t.category]?.emoji || '💼'}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm truncate">{t.title}</div>
                <div className="text-xs text-slate-400">{CAT[t.category]?.label}{t.transaction_date && ` · ${format(parseISO(t.transaction_date), 'MMM d')}`}</div>
              </div>
              <span className="font-bold text-slate-800 text-sm flex-shrink-0">{t.currency_local} {t.amount_local?.toLocaleString()}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEditExpense(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Edit"><Pencil size={13} /></button>
                <button onClick={() => handleDeleteExpense(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Tab: Visa ─────────────────────────────────────────────────────────────
  const PASSPORT_COUNTRIES = ['Afghan','Albanian','Algerian','Andorran','Angolan','Antiguan','Argentine','Armenian','Australian','Austrian','Azerbaijani','Bahamian','Bahraini','Bangladeshi','Barbadian','Belarusian','Belgian','Belizean','Beninese','Bhutanese','Bolivian','Bosnian','Botswanan','Brazilian','Bruneian','Bulgarian','Burkinabe','Burundian','Cambodian','Cameroonian','Canadian','Cape Verdean','Central African','Chadian','Chilean','Chinese','Colombian','Comorian','Congolese','Costa Rican','Croatian','Cuban','Cypriot','Czech','Danish','Djiboutian','Dominican','East Timorese','Ecuadorian','Egyptian','Emirati','Equatorial Guinean','Eritrean','Estonian','Eswatini','Ethiopian','Fijian','Finnish','French','Gabonese','Gambian','Georgian','German','Ghanaian','Greek','Grenadian','Guatemalan','Guinean','Guinea-Bissauan','Guyanese','Haitian','Honduran','Hungarian','Icelander','Indian','Indonesian','Iranian','Iraqi','Irish','Israeli','Italian','Ivorian','Jamaican','Japanese','Jordanian','Kazakhstani','Kenyan','Kiribati','Kuwaiti','Kyrgyz','Laotian','Latvian','Lebanese','Lesothan','Liberian','Libyan','Liechtensteiner','Lithuanian','Luxembourger','Malagasy','Malawian','Malaysian','Maldivian','Malian','Maltese','Marshallese','Mauritanian','Mauritian','Mexican','Micronesian','Moldovan','Monegasque','Mongolian','Montenegrin','Moroccan','Mozambican','Namibian','Nauruan','Nepali','New Zealand','Nicaraguan','Nigerian','Nigerien','North Korean','North Macedonian','Norwegian','Omani','Pakistani','Palauan','Palestinian','Panamanian','Papua New Guinean','Paraguayan','Peruvian','Filipino','Polish','Portuguese','Qatari','Romanian','Russian','Rwandan','Saint Kitts and Nevis','Saint Lucian','Saint Vincentian','Samoan','San Marinese','Sao Tomean','Saudi Arabian','Senegalese','Serbian','Seychellois','Sierra Leonean','Singaporean','Slovak','Slovenian','Solomon Islander','Somali','South African','South Korean','South Sudanese','Spanish','Sri Lankan','Sudanese','Surinamese','Swedish','Swiss','Syrian','Tajik','Tanzanian','Thai','Togolese','Tongan','Trinidadian','Tunisian','Turkmen','Tuvaluan','Ugandan','Ukrainian','British','Uruguayan','American','Uzbek','Vanuatuan','Venezuelan','Vietnamese','Yemeni','Zambian','Zimbabwean']

  const visaDest = getDestination(trip)
  const visaDestCountry = trip?.trip_destinations?.[0]?.country_name || visaDest

  const TabVisa = (
    <div className="space-y-4">
      <div style={{ background: '#f8f8ff', border: '1.5px solid #e0e0ff', borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>🛂 Visa Requirements</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Travelling to {visaDestCountry}</div>
        {!passportCountry ? (
          <div>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>Select your passport country to check entry requirements.</p>
            <select
              style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid #e0e0ff', fontSize: 14, color: '#1a1a2e', background: '#fff', cursor: 'pointer', width: '100%', maxWidth: 320 }}
              onChange={async (e) => {
                const val = e.target.value
                if (!val) return
                setPassportCountry(val)
                if (myProfile?.id) await supabase.from('profiles').update({ passport_country: val }).eq('id', myProfile.id)
                checkVisa(val)
              }}
              defaultValue=""
            >
              <option value="" disabled>Select your passport country...</option>
              {PASSPORT_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        ) : visaLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6366f1', fontSize: 14 }}>
            <div style={{ width: 16, height: 16, border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Checking requirements for {passportCountry} passport holders...
          </div>
        ) : visaInfo && !visaInfo.error && visaInfo.visa_type ? (
          <div>
            {/* Status banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: visaInfo.visa_required ? '#fffbeb' : '#f0fdf4', border: `1.5px solid ${visaInfo.visa_required ? '#fcd34d' : '#86efac'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>{visaInfo.visa_required ? '📋' : '✅'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: visaInfo.visa_required ? '#b45309' : '#15803d' }}>{visaInfo.visa_type}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{passportCountry} passport → {visaDestCountry}</div>
              </div>
              <button onClick={() => { setPassportCountry(''); setVisaInfo(null) }} style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>Change</button>
            </div>

            {/* Stats row */}
            {(visaInfo.cost_usd != null || visaInfo.processing_days != null || visaInfo.max_stay_days != null) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {visaInfo.cost_usd != null && <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', border: '1px solid #f0f0f5', textAlign: 'center' }}><div style={{ fontSize: 11, color: '#9ca3af' }}>Cost</div><div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>${visaInfo.cost_usd}</div></div>}
                {visaInfo.processing_days != null && <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', border: '1px solid #f0f0f5', textAlign: 'center' }}><div style={{ fontSize: 11, color: '#9ca3af' }}>Processing</div><div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{visaInfo.processing_days}d</div></div>}
                {visaInfo.max_stay_days != null && <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', border: '1px solid #f0f0f5', textAlign: 'center' }}><div style={{ fontSize: 11, color: '#9ca3af' }}>Max Stay</div><div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{visaInfo.max_stay_days}d</div></div>}
              </div>
            )}

            {/* Notes */}
            {visaInfo.notes && <p style={{ fontSize: 13, color: '#374151', marginBottom: 16, lineHeight: 1.7, background: '#f9fafb', borderRadius: 10, padding: '12px 14px', border: '1px solid #f0f0f5' }}>{visaInfo.notes}</p>}

            {/* Authority links */}
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>Official Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visaInfo.apply_url && (
                <a href={visaInfo.apply_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 12, textDecoration: 'none' }}>
                  <span style={{ fontSize: 20 }}>📝</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Apply for Visa</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Official application portal</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>→</span>
                </a>
              )}
              {visaInfo.embassy_url && (
                <a href={visaInfo.embassy_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f0f0ff', border: '1.5px solid #e0e0ff', borderRadius: 12, textDecoration: 'none' }}>
                  <span style={{ fontSize: 20 }}>🏛️</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5' }}>Embassy / Consulate</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Official embassy website</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: '#a5b4fc', fontSize: 16 }}>→</span>
                </a>
              )}
              {!visaInfo.apply_url && !visaInfo.embassy_url && (
                <a href="https://www.timaticweb2.com/integration/external" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f0f0ff', border: '1.5px solid #e0e0ff', borderRadius: 12, textDecoration: 'none' }}>
                  <span style={{ fontSize: 20 }}>🌐</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5' }}>IATA Timatic</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Verify official entry requirements</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: '#a5b4fc', fontSize: 16 }}>→</span>
                </a>
              )}
            </div>

            {visaInfo.source && <p style={{ fontSize: 11, color: '#d1d5db', marginTop: 14 }}>Source: {visaInfo.source}</p>}
          </div>
        ) : visaInfo?.error ? (
          <div>
            <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 10 }}>Could not load visa info. Please try again.</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={() => { setVisaInfo(null); checkVisa(passportCountry) }}
                style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#6366f1', padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Retry</button>
              <button onClick={() => { setPassportCountry(''); setVisaInfo(null) }}
                style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>Change passport</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )

  // ── Tab: Checklist ────────────────────────────────────────────────────────
  const checkByCategory = checkItems.reduce((acc, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc }, {})
  const doneCount = checkItems.filter(c => c.done).length

  const TabChecklist = (
    <div className="space-y-4">
      {checkLoading ? (
        <div className="card text-center py-12">
          <Loader2 size={24} className="animate-spin text-sky-500 mx-auto" />
          <p className="text-slate-400 text-sm mt-2">Loading checklist...</p>
        </div>
      ) : (
        <>
          <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-bold text-slate-800 font-display">Trip Checklist</div>
                <div className="text-sm text-slate-500">{doneCount} of {checkItems.length} completed</div>
              </div>
              <div className="text-3xl font-bold text-emerald-600">{checkItems.length > 0 ? Math.round(doneCount / checkItems.length * 100) : 0}%</div>
            </div>
            <div className="bg-white/60 rounded-full h-2.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${checkItems.length > 0 ? doneCount / checkItems.length * 100 : 0}%` }} />
            </div>
          </div>
          {Object.entries(checkByCategory).map(([cat, items]) => (
            <div key={cat} className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{CHECKLIST_CAT_EMOJI[cat] || '📋'}</span>
                <h3 className="font-bold text-slate-700 font-display">{cat}</h3>
                <span className="text-xs text-slate-400 ml-auto">{items.filter(i => i.done).length}/{items.length}</span>
              </div>
              <div className="space-y-1.5">
                {items.map(item => (
                  <button key={item.id} onClick={() => toggleCheckItem(item)}
                    className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl transition-all hover:bg-slate-50 ${item.done ? 'opacity-60' : ''}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                      {item.done && <Check size={11} className="text-white" />}
                    </div>
                    <span className={`text-sm flex-1 text-left ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )

  // ── Tab: Travellers ───────────────────────────────────────────────────────
  const TabTravellers = (
    <div className="space-y-4">
      {travellersLoading ? (
        <div className="card text-center py-12">
          <Loader2 size={24} className="animate-spin text-sky-500 mx-auto" />
          <p className="text-slate-400 text-sm mt-2">Finding fellow travellers...</p>
        </div>
      ) : fellowTravellers.length === 0 ? (
        <div className="card text-center py-14 space-y-3">
          <div className="text-4xl">🌍</div>
          <h3 className="font-bold text-slate-700 font-display">No fellow travellers found</h3>
          <p className="text-slate-500 text-sm">No other Wanderwall users have trips to {getDestination(trip)} yet.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{fellowTravellers.length} Wanderwall user{fellowTravellers.length !== 1 ? 's' : ''} visiting {getDestination(trip)}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {fellowTravellers.map(t => (
              <div key={t.user_id} className="card hover:shadow-card-hover transition-all">
                <div className="flex items-start gap-3">
                  {t.profile?.avatar_url ? (
                    <img src={t.profile.avatar_url} alt={t.profile.full_name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {t.profile?.full_name?.[0] || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 font-display truncate">{t.profile?.full_name}</div>
                    {t.profile?.bio && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{t.profile.bio}</p>}
                    {t.compat && (
                      <span className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {t.compat.emoji} {t.compat.score}% match
                      </span>
                    )}
                  </div>
                  <Link to={`/compatibility?with=${t.profile?.id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0">
                    View Match
                  </Link>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-50 text-xs text-slate-400 flex items-center gap-1">
                  <Plane size={10} />
                  <span className="truncate">{t.title}</span>
                  {t.start_date && <span className="ml-auto flex-shrink-0">{format(parseISO(t.start_date), 'MMM d')}{t.end_date && ` – ${format(parseISO(t.end_date), 'MMM d')}`}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )

  // ── Tab: Memories ─────────────────────────────────────────────────────────
  const TabMemories = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{memories.length} memor{memories.length !== 1 ? 'ies' : 'y'}</p>
        <Link to="/feed" className="btn-primary text-sm py-2 inline-flex items-center gap-1.5">
          <Camera size={14} /> Add Memory
        </Link>
      </div>
      {memoriesLoading ? (
        <div className="card text-center py-12">
          <Loader2 size={24} className="animate-spin text-sky-500 mx-auto" />
          <p className="text-slate-400 text-sm mt-2">Loading memories...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="card text-center py-14 space-y-3">
          <div className="text-5xl">📸</div>
          <h3 className="font-bold text-slate-700 font-display">No memories yet</h3>
          <p className="text-slate-500 text-sm">Share posts tagged to this trip to collect them here</p>
          <Link to="/feed" className="btn-primary text-sm py-2 inline-flex items-center gap-1.5">
            <Camera size={14} /> Share a memory
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {memories.map(m => (
            <div key={m.id} className="relative group rounded-2xl overflow-hidden bg-slate-100 aspect-square">
              {m.image_url ? (
                <img src={m.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-100 p-3">
                  <p className="text-xs text-slate-600 text-center line-clamp-4">{m.content}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                <p className="text-white text-xs font-semibold truncate">{m.profiles?.full_name}</p>
                <p className="text-white/70 text-[10px]">{format(parseISO(m.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const tabContent = { itinerary: TabItinerary, hotels: TabHotels, transport: TabTransport, activities: TabActivities, budget: TabBudget, visa: TabVisa, checklist: TabChecklist, travellers: TabTravellers, memories: TabMemories }

  // ─── Render ───────────────────────────────────────────────────────────────
  const daysUntil = getDaysUntilTrip(trip)
  const dest = getDestination(trip)

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">

      {/* Cinematic Hero */}
      <div className={`relative rounded-3xl bg-gradient-to-br ${heroGrad(trip)} p-6 sm:p-8 text-white overflow-hidden shadow-xl`}>
        {/* Decorative orbs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none" />

        {/* Back + share row */}
        <div className="relative flex items-center justify-between mb-6">
          <Link to="/trips" className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors">
            <ArrowLeft size={16} /> All Trips
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
              {TRIP_STATUSES[trip.status]?.label}
            </span>
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors" title="Share">
              <Share2 size={15} />
            </button>
          </div>
        </div>

        {/* Title + destination */}
        <div className="relative space-y-1 mb-6">
          <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
            <MapPin size={13} /> {dest}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display leading-tight">{trip.title}</h1>
          <p className="text-white/70 text-sm">
            {trip.start_date && format(parseISO(trip.start_date), 'MMM d')}
            {trip.end_date && ` – ${format(parseISO(trip.end_date), 'MMM d, yyyy')}`}
            {trip.total_days && ` · ${trip.total_days} days`}
            {trip.traveller_count > 1 && ` · 👥 ${trip.traveller_count} travellers`}
          </p>
        </div>

        {/* Countdown + actions row */}
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          {/* Countdown */}
          {daysUntil !== null && (
            <div className="flex items-center gap-3">
              {daysUntil > 0 ? (
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center">
                  <div className="text-2xl font-bold font-display leading-none">{daysUntil}</div>
                  <div className="text-[10px] text-white/80 font-semibold uppercase tracking-wide mt-0.5">days to go</div>
                </div>
              ) : daysUntil === 0 ? (
                <div className="bg-white/25 backdrop-blur-sm rounded-2xl px-4 py-2.5">
                  <div className="text-sm font-bold">🎉 Today!</div>
                </div>
              ) : (
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center">
                  <div className="text-2xl font-bold font-display leading-none">{Math.abs(daysUntil)}</div>
                  <div className="text-[10px] text-white/80 font-semibold uppercase tracking-wide mt-0.5">days in</div>
                </div>
              )}
              <CalendarPlus size={15} className="text-white/60" />
              <span className="text-white/60 text-xs">
                {daysUntil > 0 ? `${Math.floor(daysUntil / 7)}w ${daysUntil % 7}d` : daysUntil < 0 ? 'Trip underway' : ''}
              </span>
            </div>
          )}

          {/* Quick action buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                const params = new URLSearchParams({ destination: dest, checkin: trip.start_date || '', checkout: trip.end_date || '' })
                navigate(`/booking?${params}`)
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-bold transition-all">
              <Plane size={13} /> Book
            </button>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: 4, scrollbarWidth: 'none', background: '#f1f5f9', padding: 4, borderRadius: 16, msOverflowStyle: 'none' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? '#0f172a' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {tabContent[activeTab]}

      {/* ── Modals ─────────────────────────────────────────────────────── */}

      {/* Roaming Advice */}
      {roamingModal && (
        <Modal title="📱 Roaming Advice" onClose={() => setRoamingModal(false)}>
          <p className="text-slate-600 text-sm leading-relaxed">Contact your mobile carrier before travel. Most carriers offer temporary roaming add-ons.</p>
          <div className="space-y-3 mt-1">
            {[
              { carrier: 'Three Ireland', detail: 'Add a roaming bolt-on via the Three app before you travel.' },
              { carrier: 'Vodafone', detail: 'Activate TravelPlus in the My Vodafone app for daily roaming rates.' },
              { carrier: 'Eir', detail: 'Roam Like Home within the EU — included on most plans at no extra cost.' },
            ].map(({ carrier, detail }) => (
              <div key={carrier} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="font-semibold text-slate-800 text-sm">{carrier}</div>
                <div className="text-slate-500 text-xs mt-0.5">{detail}</div>
              </div>
            ))}
            <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
              <div className="font-semibold text-indigo-800 text-sm">Travelling outside the EU?</div>
              <div className="text-indigo-600 text-xs mt-0.5">Buy a local SIM on arrival, or get an international eSIM in advance at <span className="font-semibold">Airalo.com</span></div>
            </div>
          </div>
        </Modal>
      )}

      {/* Travel Insurance */}
      {insuranceModal && (
        <Modal title="🏥 Travel Insurance" onClose={() => setInsuranceModal(false)}>
          <p className="text-slate-600 text-sm leading-relaxed">Compare travel insurance providers before you go. Cover typically includes medical emergencies, cancellation, and lost luggage.</p>
          <div className="space-y-3 mt-1">
            {[
              { name: 'AXA Travel Insurance', url: 'https://www.axa.ie/travel-insurance', desc: 'Single trip & annual multi-trip cover' },
              { name: 'Allianz Travel', url: 'https://www.allianz-travel.ie', desc: 'Comprehensive plans with 24/7 assistance' },
              { name: 'Europ Assistance', url: 'https://www.europ-assistance.ie', desc: 'Medical & travel protection plans' },
              { name: 'Covermore', url: 'https://www.covermore.com', desc: 'Flexible cover for all trip types' },
            ].map(({ name, url, desc }) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100 hover:bg-sky-50 hover:border-sky-100 transition-colors no-underline group">
                <div>
                  <div className="font-semibold text-slate-800 text-sm group-hover:text-sky-700">{name}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
                </div>
                <span className="text-slate-300 group-hover:text-sky-400 text-sm ml-3">→</span>
              </a>
            ))}
          </div>
        </Modal>
      )}

      {/* Add Activity */}
      {activityModal && (
        <Modal title={`Add Activity${selectedDay ? ` — Day ${selectedDay.day_number}` : ''}`} onClose={() => setActivityModal(false)}>
          {days.length > 1 && (
            <FormRow label="Day">
              <select className="input" value={selectedDay?.id || ''} onChange={e => setSelectedDay(days.find(d => d.id === e.target.value))}>
                {days.map(d => <option key={d.id} value={d.id}>Day {d.day_number} — {format(parseISO(d.date), 'MMM d')}{d.title ? ` (${d.title})` : ''}</option>)}
              </select>
            </FormRow>
          )}
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

      {/* Edit Activity */}
      {editActModal && (
        <Modal title="Edit Activity" onClose={() => setEditActModal(false)}>
          <FormRow label="Title *">
            <input className="input" value={editActForm.title} onChange={e => setEditActForm(f => ({...f, title: e.target.value}))} />
          </FormRow>
          <FormRow label="Category">
            <select className="input" value={editActForm.category} onChange={e => setEditActForm(f => ({...f, category: e.target.value}))}>
              {Object.entries(CAT).map(([k,v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
          </FormRow>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormRow label="Start time">
              <input type="time" className="input" value={editActForm.start_time} onChange={e => setEditActForm(f => ({...f, start_time: e.target.value}))} />
            </FormRow>
            <FormRow label="Cost">
              <input type="number" className="input" value={editActForm.cost} onChange={e => setEditActForm(f => ({...f, cost: e.target.value}))} />
            </FormRow>
          </div>
          <FormRow label="Location">
            <input className="input" value={editActForm.location} onChange={e => setEditActForm(f => ({...f, location: e.target.value}))} />
          </FormRow>
          <FormRow label="Notes">
            <textarea className="input resize-none" rows={2} value={editActForm.notes} onChange={e => setEditActForm(f => ({...f, notes: e.target.value}))} />
          </FormRow>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditActModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleUpdateAct} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </Modal>
      )}

      {/* Add Hotel */}
      {hotelModal && (
        <Modal title="Add Hotel / Accommodation" onClose={() => setHotelModal(false)}>
          <FormRow label="Hotel name *">
            <input className="input" placeholder="e.g. Park Hyatt Tokyo" value={hotelForm.name} onChange={e => setHotelForm(f => ({...f, name: e.target.value}))} />
          </FormRow>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormRow label="City">
              <input className="input" placeholder="Tokyo" value={hotelForm.city} onChange={e => setHotelForm(f => ({...f, city: e.target.value}))} />
            </FormRow>
            <FormRow label="Status">
              <select className="input" value={hotelForm.status} onChange={e => setHotelForm(f => ({...f, status: e.target.value}))}>
                {HOTEL_STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </FormRow>
          </div>
          <FormRow label="Address">
            <input className="input" value={hotelForm.address} onChange={e => setHotelForm(f => ({...f, address: e.target.value}))} />
          </FormRow>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormRow label="Phone">
              <input className="input" value={hotelForm.phone} onChange={e => setHotelForm(f => ({...f, phone: e.target.value}))} />
            </FormRow>
            <FormRow label="Website">
              <input className="input" placeholder="https://..." value={hotelForm.website} onChange={e => setHotelForm(f => ({...f, website: e.target.value}))} />
            </FormRow>
          </div>
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

      {/* Edit Hotel */}
      {editHotelModal && (
        <Modal title="Edit Hotel" onClose={() => setEditHotelModal(false)}>
          <FormRow label="Hotel name *">
            <input className="input" value={editHotelForm.name} onChange={e => setEditHotelForm(f => ({...f, name: e.target.value}))} />
          </FormRow>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormRow label="City">
              <input className="input" value={editHotelForm.city} onChange={e => setEditHotelForm(f => ({...f, city: e.target.value}))} />
            </FormRow>
            <FormRow label="Status">
              <select className="input" value={editHotelForm.status} onChange={e => setEditHotelForm(f => ({...f, status: e.target.value}))}>
                {HOTEL_STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </FormRow>
          </div>
          <FormRow label="Address">
            <input className="input" value={editHotelForm.address} onChange={e => setEditHotelForm(f => ({...f, address: e.target.value}))} />
          </FormRow>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormRow label="Check-in">
              <input type="date" className="input" value={editHotelForm.check_in_date} onChange={e => setEditHotelForm(f => ({...f, check_in_date: e.target.value}))} />
            </FormRow>
            <FormRow label="Check-out">
              <input type="date" className="input" value={editHotelForm.check_out_date} onChange={e => setEditHotelForm(f => ({...f, check_out_date: e.target.value}))} />
            </FormRow>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormRow label="Cost per night">
                <input type="number" className="input" value={editHotelForm.cost_per_night} onChange={e => setEditHotelForm(f => ({...f, cost_per_night: e.target.value}))} />
              </FormRow>
            </div>
            <FormRow label="Currency">
              <select className="input" value={editHotelForm.cost_currency} onChange={e => setEditHotelForm(f => ({...f, cost_currency: e.target.value}))}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </FormRow>
          </div>
          <FormRow label="Booking reference">
            <input className="input" value={editHotelForm.booking_ref} onChange={e => setEditHotelForm(f => ({...f, booking_ref: e.target.value}))} />
          </FormRow>
          <FormRow label="Notes">
            <textarea className="input resize-none" rows={2} value={editHotelForm.notes} onChange={e => setEditHotelForm(f => ({...f, notes: e.target.value}))} />
          </FormRow>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditHotelModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleUpdateHotel} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </Modal>
      )}

      {/* Add Transport */}
      {transportModal && (
        <Modal title="Add Transport" onClose={() => setTransportModal(false)}>
          <FormRow label="Type">
            <div className="grid grid-cols-4 gap-2">
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

      {/* Edit Transport */}
      {editLegModal && (
        <Modal title="Edit Transport" onClose={() => setEditLegModal(false)}>
          <FormRow label="Type">
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(TRANSPORT_EMOJI).slice(0, 8).map(([k, emoji]) => (
                <button key={k} onClick={() => setEditLegForm(f => ({...f, type: k}))}
                  className={`p-2 rounded-xl border text-center text-sm transition-all ${editLegForm.type === k ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="text-xl">{emoji}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 capitalize">{k.replace('_', ' ')}</div>
                </button>
              ))}
            </div>
          </FormRow>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormRow label="From city *">
              <input className="input" value={editLegForm.from_city} onChange={e => setEditLegForm(f => ({...f, from_city: e.target.value}))} />
            </FormRow>
            <FormRow label="To city *">
              <input className="input" value={editLegForm.to_city} onChange={e => setEditLegForm(f => ({...f, to_city: e.target.value}))} />
            </FormRow>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <FormRow label="Date">
                <input type="date" className="input" value={editLegForm.departure_date} onChange={e => setEditLegForm(f => ({...f, departure_date: e.target.value}))} />
              </FormRow>
            </div>
            <FormRow label="Departs">
              <input type="time" className="input" value={editLegForm.departure_time} onChange={e => setEditLegForm(f => ({...f, departure_time: e.target.value}))} />
            </FormRow>
            <FormRow label="Arrives">
              <input type="time" className="input" value={editLegForm.arrival_time} onChange={e => setEditLegForm(f => ({...f, arrival_time: e.target.value}))} />
            </FormRow>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormRow label="Cost">
                <input type="number" className="input" value={editLegForm.cost} onChange={e => setEditLegForm(f => ({...f, cost: e.target.value}))} />
              </FormRow>
            </div>
            <FormRow label="Currency">
              <select className="input" value={editLegForm.cost_currency} onChange={e => setEditLegForm(f => ({...f, cost_currency: e.target.value}))}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </FormRow>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormRow label="Operator">
              <input className="input" value={editLegForm.operator} onChange={e => setEditLegForm(f => ({...f, operator: e.target.value}))} />
            </FormRow>
            <FormRow label="Booking ref">
              <input className="input" value={editLegForm.booking_ref} onChange={e => setEditLegForm(f => ({...f, booking_ref: e.target.value}))} />
            </FormRow>
          </div>
          <FormRow label="Notes">
            <textarea className="input resize-none" rows={2} value={editLegForm.notes} onChange={e => setEditLegForm(f => ({...f, notes: e.target.value}))} />
          </FormRow>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditLegModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleUpdateLeg} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </Modal>
      )}

      {/* Add Expense */}
      {expenseModal && (
        <Modal title="Log Expense" onClose={() => setExpenseModal(false)}>
          <FormRow label="Category">
            <select className="input" value={expForm.category} onChange={e => setExpForm(f => ({...f, category: e.target.value}))}>
              {EXP_CATS.map(c => <option key={c} value={c}>{CAT[c]?.emoji || '💼'} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
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

      {/* Edit Expense */}
      {editExpModal && (
        <Modal title="Edit Expense" onClose={() => setEditExpModal(false)}>
          <FormRow label="Category">
            <select className="input" value={editExpForm.category} onChange={e => setEditExpForm(f => ({...f, category: e.target.value}))}>
              {EXP_CATS.map(c => <option key={c} value={c}>{CAT[c]?.emoji || '💼'} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </FormRow>
          <FormRow label="Description *">
            <input className="input" value={editExpForm.title} onChange={e => setEditExpForm(f => ({...f, title: e.target.value}))} />
          </FormRow>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormRow label="Amount *">
                <input type="number" className="input" value={editExpForm.amount} onChange={e => setEditExpForm(f => ({...f, amount: e.target.value}))} />
              </FormRow>
            </div>
            <FormRow label="Currency">
              <select className="input" value={editExpForm.currency} onChange={e => setEditExpForm(f => ({...f, currency: e.target.value}))}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </FormRow>
          </div>
          <FormRow label="Date">
            <input type="date" className="input" value={editExpForm.date} onChange={e => setEditExpForm(f => ({...f, date: e.target.value}))} />
          </FormRow>
          <FormRow label="Notes">
            <textarea className="input resize-none" rows={2} value={editExpForm.notes} onChange={e => setEditExpForm(f => ({...f, notes: e.target.value}))} />
          </FormRow>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditExpModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleUpdateExpense} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
