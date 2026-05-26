import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTripsStore } from '../stores/tripsStore'
import { supabase } from '../lib/supabase'
import { ArrowLeft, ArrowRight, Globe, Calendar, DollarSign, Users, CheckCircle, MapPin, Sparkles } from 'lucide-react'
import { CURRENCIES } from '../lib/constants'
import toast from 'react-hot-toast'

const steps = [
  { id: 1, title: 'Destination', icon: Globe },
  { id: 2, title: 'Dates', icon: Calendar },
  { id: 3, title: 'Budget', icon: DollarSign },
  { id: 4, title: 'Review', icon: CheckCircle },
]

const POPULAR_DESTINATIONS = [
  { city: 'Tokyo', country: 'Japan', emoji: '🇯🇵', season: 'Mar–May or Oct–Nov', budget_hint: '€80–120/day' },
  { city: 'Paris', country: 'France', emoji: '🇫🇷', season: 'Apr–Jun or Sep', budget_hint: '€100–150/day' },
  { city: 'Bali', country: 'Indonesia', emoji: '🇮🇩', season: 'Apr–Oct', budget_hint: '€40–70/day' },
  { city: 'New York', country: 'USA', emoji: '🇺🇸', season: 'Sep–Nov or Apr–May', budget_hint: '€150–250/day' },
  { city: 'Barcelona', country: 'Spain', emoji: '🇪🇸', season: 'May–Jun or Sep–Oct', budget_hint: '€80–120/day' },
  { city: 'Dubai', country: 'UAE', emoji: '🇦🇪', season: 'Nov–Mar', budget_hint: '€100–200/day' },
  { city: 'Rome', country: 'Italy', emoji: '🇮🇹', season: 'Apr–Jun or Sep–Oct', budget_hint: '€80–120/day' },
  { city: 'Santorini', country: 'Greece', emoji: '🇬🇷', season: 'May–Oct', budget_hint: '€120–180/day' },
  { city: 'Bangkok', country: 'Thailand', emoji: '🇹🇭', season: 'Nov–Feb', budget_hint: '€40–80/day' },
  { city: 'Lisbon', country: 'Portugal', emoji: '🇵🇹', season: 'Mar–May or Sep–Oct', budget_hint: '€70–110/day' },
  { city: 'Amsterdam', country: 'Netherlands', emoji: '🇳🇱', season: 'Apr–May or Sep', budget_hint: '€100–150/day' },
  { city: 'Kyoto', country: 'Japan', emoji: '🇯🇵', season: 'Mar–May (cherry blossom)', budget_hint: '€70–110/day' },
  { city: 'Sydney', country: 'Australia', emoji: '🇦🇺', season: 'Sep–Nov or Mar–May', budget_hint: '€120–180/day' },
  { city: 'Marrakech', country: 'Morocco', emoji: '🇲🇦', season: 'Mar–May or Sep–Nov', budget_hint: '€40–70/day' },
  { city: 'Reykjavik', country: 'Iceland', emoji: '🇮🇸', season: 'Jun–Aug or Dec–Feb (aurora)', budget_hint: '€150–250/day' },
]

function getSeasonHint(city, startDate) {
  const dest = POPULAR_DESTINATIONS.find(d => d.city.toLowerCase() === city?.toLowerCase())
  if (!dest) return null
  const month = startDate ? new Date(startDate).getMonth() : null
  return { season: dest.season, budget: dest.budget_hint }
}

export default function NewTripPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { createTrip } = useTripsStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [destQuery, setDestQuery] = useState('')
  const [showDestSuggestions, setShowDestSuggestions] = useState(false)
  const destRef = useRef(null)
  const [form, setForm] = useState({
    title: '', description: '',
    destination_city: '', destination_country: '',
    origin_country: 'Ireland', origin_city: 'Dublin',
    start_date: '', end_date: '',
    budget_currency: 'EUR', budget_total: '',
    traveller_count: 1, tags: '',
    status: 'planning', visibility: 'private',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSelectDest = (dest) => {
    setDestQuery(`${dest.city}, ${dest.country}`)
    set('destination_city', dest.city)
    set('destination_country', dest.country)
    if (!form.title) set('title', `${dest.city} Trip`)
    setShowDestSuggestions(false)
  }

  const destSuggestions = destQuery.length >= 2
    ? POPULAR_DESTINATIONS.filter(d =>
        `${d.city} ${d.country}`.toLowerCase().includes(destQuery.toLowerCase())
      )
    : POPULAR_DESTINATIONS.slice(0, 6)

  const tripDays = form.start_date && form.end_date
    ? Math.round((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1
    : null

  const seasonHint = getSeasonHint(form.destination_city, form.start_date)

  const budgetHint = (() => {
    const dest = POPULAR_DESTINATIONS.find(d => d.city.toLowerCase() === form.destination_city?.toLowerCase())
    if (!dest || !tripDays) return null
    const low = parseInt(dest.budget_hint.replace(/[^0-9]/g, '').slice(0, 3)) * tripDays * form.traveller_count
    const high = parseInt(dest.budget_hint.match(/(\d+)\/day/)?.[1] || 0) * tripDays * form.traveller_count
    if (!low || !high) return null
    return `For ${tripDays} days × ${form.traveller_count} traveller${form.traveller_count > 1 ? 's' : ''}: ~€${(low).toLocaleString()} – €${(high).toLocaleString()}`
  })()

  const handleSubmit = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('You must be logged in to create a trip')
      setLoading(false)
      return
    }
    const { destination_city, destination_country, tags: rawTags, budget_total: rawBudget, ...rest } = form
    const tripData = {
      ...rest,
      user_id: user.id,
      budget_total: parseFloat(rawBudget) || 0,
      tags: rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }
    const { data, error } = await createTrip(tripData)
    if (error) {
      toast.error('Failed to create trip: ' + error.message)
    } else {
      if (destination_city) {
        await supabase.from('trip_destinations').insert({
          trip_id: data.id,
          city: destination_city,
          country_name: destination_country || null,
        })
      }
      toast.success('Trip created! 🎉')
      navigate(`/trips/${data.id}`)
    }
    setLoading(false)
  }

  const canNext = () => {
    if (step === 1) return form.title.length >= 3
    if (step === 2) return form.start_date && form.end_date && form.end_date >= form.start_date
    return true
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/trips" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="section-title">Create New Trip</h1>
          <p className="text-slate-500 text-sm">Step {step} of {steps.length}</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center mb-8">
        {steps.map((s, i) => {
          const Icon = s.icon
          const done = step > s.id
          const active = step === s.id
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center gap-2 ${active ? 'text-sky-600' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${active ? 'bg-sky-100 ring-2 ring-sky-500' : done ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  {done ? <CheckCircle size={16} /> : <Icon size={16} />}
                </div>
                <span className="text-xs font-semibold hidden sm:block">{s.title}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="card space-y-5">
        {/* Step 1: Destination */}
        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold font-display text-slate-800">Where are you going?</h2>

            {/* Destination search */}
            <div className="relative" ref={destRef}>
              <label className="label">Destination</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  className="input pl-9"
                  placeholder="Search city or country..."
                  value={destQuery}
                  onChange={e => { setDestQuery(e.target.value); setShowDestSuggestions(true) }}
                  onFocus={() => setShowDestSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDestSuggestions(false), 150)}
                />
              </div>
              {showDestSuggestions && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                  {destQuery.length < 2 && (
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Popular destinations</div>
                  )}
                  {destSuggestions.map(d => (
                    <button key={`${d.city}-${d.country}`} type="button"
                      onMouseDown={() => handleSelectDest(d)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sky-50 transition-colors text-left">
                      <span className="text-xl flex-shrink-0">{d.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-sm">{d.city}, {d.country}</div>
                        <div className="text-xs text-slate-400">Best time: {d.season}</div>
                      </div>
                      <div className="text-xs text-emerald-600 font-semibold flex-shrink-0">{d.budget_hint}</div>
                    </button>
                  ))}
                  {destSuggestions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-400">No suggestions — you can type any destination</div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="label">Trip title *</label>
              <input className="input" placeholder="e.g. Japan Adventure 2025" value={form.title}
                onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} placeholder="What's the vibe of this trip?"
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Flying from</label>
                <input className="input" value={form.origin_city} onChange={e => set('origin_city', e.target.value)} placeholder="Dublin" />
              </div>
              <div>
                <label className="label">Travellers</label>
                <input type="number" min="1" max="20" className="input" value={form.traveller_count}
                  onChange={e => set('traveller_count', parseInt(e.target.value) || 1)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Dates */}
        {step === 2 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold font-display text-slate-800">When are you going?</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Departure *</label>
                <input type="date" className="input" value={form.start_date}
                  onChange={e => set('start_date', e.target.value)} />
              </div>
              <div>
                <label className="label">Return *</label>
                <input type="date" className="input" value={form.end_date}
                  min={form.start_date}
                  onChange={e => set('end_date', e.target.value)} />
              </div>
            </div>
            {tripDays && (
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">🗓️</span>
                <div>
                  <div className="font-bold text-sky-700 text-sm">{tripDays} day{tripDays !== 1 ? 's' : ''} trip</div>
                  {form.destination_city && (
                    <div className="text-xs text-sky-600">{form.destination_city} · {Math.ceil(tripDays / 7)} week{Math.ceil(tripDays / 7) !== 1 ? 's' : ''}</div>
                  )}
                </div>
              </div>
            )}
            {seasonHint && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl flex-shrink-0">☀️</span>
                <div>
                  <div className="font-semibold text-amber-800 text-sm">Best time for {form.destination_city}</div>
                  <div className="text-xs text-amber-700 mt-0.5">{seasonHint.season}</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Visibility</label>
                <select className="input" value={form.visibility} onChange={e => set('visibility', e.target.value)}>
                  <option value="private">🔒 Private</option>
                  <option value="friends">👥 Friends</option>
                  <option value="public">🌍 Public</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="planning">Planning</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold font-display text-slate-800">What's your budget?</h2>
            {budgetHint && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                <Sparkles size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-800 text-sm">AI Budget Estimate</div>
                  <div className="text-xs text-emerald-700 mt-0.5">{budgetHint}</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="label">Total budget</label>
                <input type="number" className="input" placeholder="3000" value={form.budget_total}
                  onChange={e => set('budget_total', e.target.value)} />
              </div>
              <div>
                <label className="label">Currency</label>
                <select className="input" value={form.budget_currency} onChange={e => set('budget_currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Tags (optional)</label>
              <input className="input" placeholder="adventure, culture, food, beach" value={form.tags}
                onChange={e => set('tags', e.target.value)} />
            </div>
            <p className="text-xs text-slate-400">Track individual expenses later in the trip detail view.</p>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold font-display text-slate-800">Ready to create your trip?</h2>
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white p-6 space-y-4">
              <div>
                {form.destination_city && (
                  <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium mb-1">
                    <MapPin size={11} /> {form.destination_city}{form.destination_country ? `, ${form.destination_country}` : ''}
                  </div>
                )}
                <div className="text-2xl font-bold font-display">{form.title}</div>
                {form.description && <p className="text-white/80 text-sm mt-1">{form.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/15 rounded-xl p-3">
                  <div className="text-white/60 text-[10px] font-semibold uppercase mb-1">Dates</div>
                  <div className="font-semibold text-sm">
                    {form.start_date ? new Date(form.start_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
                    {form.end_date ? ` – ${new Date(form.end_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}` : ''}
                  </div>
                  {tripDays && <div className="text-white/60 text-xs mt-0.5">{tripDays} days</div>}
                </div>
                <div className="bg-white/15 rounded-xl p-3">
                  <div className="text-white/60 text-[10px] font-semibold uppercase mb-1">Travellers</div>
                  <div className="font-semibold text-sm">{form.traveller_count} person{form.traveller_count > 1 ? 's' : ''}</div>
                  <div className="text-white/60 text-xs mt-0.5">from {form.origin_city}</div>
                </div>
                <div className="bg-white/15 rounded-xl p-3">
                  <div className="text-white/60 text-[10px] font-semibold uppercase mb-1">Budget</div>
                  <div className="font-semibold text-sm">{form.budget_currency} {form.budget_total ? parseInt(form.budget_total).toLocaleString() : 'Not set'}</div>
                </div>
                <div className="bg-white/15 rounded-xl p-3">
                  <div className="text-white/60 text-[10px] font-semibold uppercase mb-1">Visibility</div>
                  <div className="font-semibold text-sm capitalize">{form.visibility}</div>
                  <div className="text-white/60 text-xs mt-0.5">{form.status}</div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">You can add destinations, hotels, transport and activities after creating your trip.</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
            className="btn-secondary flex items-center gap-2 disabled:opacity-40">
            <ArrowLeft size={16} /> Back
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="btn-primary flex items-center gap-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><CheckCircle size={16} /> Create Trip</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
