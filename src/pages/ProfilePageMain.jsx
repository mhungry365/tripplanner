import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { User, Mail, Globe, Camera, Save } from 'lucide-react'
import { CURRENCIES } from '../lib/constants'
import toast from 'react-hot-toast'

export default function ProfilePageMain() {
  const { profile, updateProfile } = useAuthStore()
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    nationality: profile?.nationality || '',
    home_country: profile?.home_country || '',
    home_city: profile?.home_city || '',
    preferred_currency: profile?.preferred_currency || 'EUR',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setLoading(true)
    const { error } = await updateProfile(form)
    if (error) toast.error('Failed to save: ' + error.message)
    else toast.success('Profile saved! ✅')
    setLoading(false)
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <h1 className="section-title">My Profile</h1>

      {/* Avatar */}
      <div className="card flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
            {profile?.full_name?.[0]?.toUpperCase() || 'W'}
          </div>
          <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 border border-slate-200">
            <Camera size={13} />
          </button>
        </div>
        <div>
          <div className="font-bold text-slate-900 text-lg font-display">{profile?.full_name}</div>
          <div className="text-sm text-slate-500 flex items-center gap-1"><Mail size={13} /> {profile?.email}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full capitalize">
            {profile?.role?.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          ['Total Trips', profile?.total_trips || 0, '🗺️'],
          ['Countries', profile?.total_countries || 0, '🌍'],
          ['Status', profile?.status || 'active', '✅'],
        ].map(([l, v, e]) => (
          <div key={l} className="card text-center">
            <div className="text-2xl mb-1">{e}</div>
            <div className="text-xl font-bold font-display text-slate-900 capitalize">{v}</div>
            <div className="text-xs text-slate-500">{l}</div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="card space-y-4">
        <h3 className="font-bold text-slate-800 font-display text-lg">Edit Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Username</label>
            <input className="input" placeholder="@username" value={form.username} onChange={e => set('username', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea className="input resize-none" rows={2} placeholder="Tell us about yourself..." value={form.bio}
            onChange={e => set('bio', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nationality</label>
            <input className="input" placeholder="Irish" value={form.nationality} onChange={e => set('nationality', e.target.value)} />
          </div>
          <div>
            <label className="label">Home country</label>
            <input className="input" placeholder="Ireland" value={form.home_country} onChange={e => set('home_country', e.target.value)} />
          </div>
          <div>
            <label className="label">Home city</label>
            <input className="input" placeholder="Dublin" value={form.home_city} onChange={e => set('home_city', e.target.value)} />
          </div>
          <div>
            <label className="label">Preferred currency</label>
            <select className="input" value={form.preferred_currency} onChange={e => set('preferred_currency', e.target.value)}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.symbol} — {c.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleSave} disabled={loading}
          className="btn-primary flex items-center gap-2">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save changes</>}
        </button>
      </div>
    </div>
  )
}
