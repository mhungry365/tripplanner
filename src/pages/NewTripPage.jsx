import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTripsStore } from '../stores/tripsStore'
import { ArrowLeft, ArrowRight, Globe, Calendar, DollarSign, Users, CheckCircle } from 'lucide-react'
import { CURRENCIES } from '../lib/constants'
import toast from 'react-hot-toast'

const steps = [
  { id: 1, title: 'Basics', icon: Globe },
  { id: 2, title: 'Dates', icon: Calendar },
  { id: 3, title: 'Budget', icon: DollarSign },
  { id: 4, title: 'Review', icon: CheckCircle },
]

export default function NewTripPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { createTrip } = useTripsStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '',
    origin_country: 'Ireland', origin_city: 'Dublin',
    start_date: '', end_date: '',
    budget_currency: 'EUR', budget_total: '',
    traveller_count: 1, tags: '',
    status: 'planning', visibility: 'private',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    const tripData = {
      ...form,
      user_id: profile.id,
      budget_total: parseFloat(form.budget_total) || 0,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }
    const { data, error } = await createTrip(tripData)
    if (error) {
      toast.error('Failed to create trip: ' + error.message)
    } else {
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
        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold font-display text-slate-800">Tell us about your trip</h2>
            <div>
              <label className="label">Trip title *</label>
              <input className="input" placeholder="e.g. Japan Adventure 2025" value={form.title}
                onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={3} placeholder="What's the vibe of this trip?"
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">From country</label>
                <input className="input" value={form.origin_country} onChange={e => set('origin_country', e.target.value)} />
              </div>
              <div>
                <label className="label">From city</label>
                <input className="input" value={form.origin_city} onChange={e => set('origin_city', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input className="input" placeholder="adventure, culture, food, beach" value={form.tags}
                onChange={e => set('tags', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 2: Dates */}
        {step === 2 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold font-display text-slate-800">When are you going?</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Departure date *</label>
                <input type="date" className="input" value={form.start_date}
                  onChange={e => set('start_date', e.target.value)} />
              </div>
              <div>
                <label className="label">Return date *</label>
                <input type="date" className="input" value={form.end_date}
                  min={form.start_date}
                  onChange={e => set('end_date', e.target.value)} />
              </div>
            </div>
            {form.start_date && form.end_date && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-700 text-sm font-medium">
                🗓️ {Math.round((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1} days trip
              </div>
            )}
            <div>
              <label className="label">Number of travellers</label>
              <input type="number" min="1" max="20" className="input" value={form.traveller_count}
                onChange={e => set('traveller_count', parseInt(e.target.value) || 1)} />
            </div>
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
            <h2 className="text-xl font-bold font-display text-slate-800">Set your budget</h2>
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
            <p className="text-xs text-slate-400">You can track individual expenses later in the trip detail view.</p>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-bold font-display text-slate-800">Review your trip</h2>
            <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl p-6 space-y-3">
              <div className="text-2xl font-bold text-slate-900 font-display">{form.title}</div>
              {form.description && <p className="text-slate-600 text-sm">{form.description}</p>}
              <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                <div><span className="text-slate-400">From</span><br /><span className="font-semibold">{form.origin_city}, {form.origin_country}</span></div>
                <div><span className="text-slate-400">Travellers</span><br /><span className="font-semibold">{form.traveller_count} person{form.traveller_count > 1 ? 's' : ''}</span></div>
                <div><span className="text-slate-400">Dates</span><br /><span className="font-semibold">{form.start_date} → {form.end_date}</span></div>
                <div><span className="text-slate-400">Budget</span><br /><span className="font-semibold">{form.budget_currency} {form.budget_total || 'Not set'}</span></div>
              </div>
            </div>
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
