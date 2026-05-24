import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTripsStore } from '../stores/tripsStore'
import { supabase } from '../lib/supabase'
import { uploadAvatar, uploadCover } from '../lib/storage'
import { Mail, Camera, Save, Globe, Map, Settings, Edit3, ImagePlus, Loader2 } from 'lucide-react'
import { CURRENCIES, TRIP_STATUSES } from '../lib/constants'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { profile, updateProfile } = useAuthStore()
  const { trips, fetchTrips } = useTripsStore()
  const [activeTab, setActiveTab]     = useState('trips')
  const [editing, setEditing]         = useState(false)
  const [loading, setLoading]         = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover]   = useState(false)

  const avatarInputRef = useRef(null)
  const coverInputRef  = useRef(null)

  const [form, setForm] = useState({
    full_name:          profile?.full_name || '',
    username:           profile?.username || '',
    bio:                profile?.bio || '',
    nationality:        profile?.nationality || '',
    home_country:       profile?.home_country || '',
    home_city:          profile?.home_city || '',
    preferred_currency: profile?.preferred_currency || 'EUR',
  })

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (profile?.id) fetchTrips(profile.id)
  }, [profile?.id])

  const handleSave = async () => {
    setLoading(true)
    const { error } = await updateProfile(form)
    if (error) toast.error('Failed to save: ' + error.message)
    else { toast.success('Profile saved!'); setEditing(false) }
    setLoading(false)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }

    setUploadingAvatar(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const publicUrl = await uploadAvatar(file, user.id)
      await updateProfile({ avatar_url: publicUrl })
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return }

    setUploadingCover(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const publicUrl = await uploadCover(file, user.id)
      await updateProfile({ cover_image_url: publicUrl })
      toast.success('Cover photo updated!')
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  const completedTrips = trips.filter(t => t.status === 'completed')

  const TABS = [
    { key: 'trips', label: 'My Trips',     icon: Map },
    { key: 'stats', label: 'Travel Stats', icon: Globe },
  ]

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Hidden file inputs */}
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      <input ref={coverInputRef}  type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

      {/* Profile header card */}
      <div className="card overflow-hidden p-0">
        {/* Cover photo */}
        <div className="h-28 sm:h-36 relative overflow-hidden group">
          {profile?.cover_image_url ? (
            <img src={profile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="h-full bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_60%)]" />
            </div>
          )}
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute inset-0 w-full flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-200 cursor-pointer"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/50 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
              {uploadingCover
                ? <><Loader2 size={13} className="animate-spin" /> Uploading...</>
                : <><ImagePlus size={13} /> Change cover</>
              }
            </span>
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  : <span>{profile?.full_name?.[0]?.toUpperCase() || 'W'}</span>
                }
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors"
                title="Change avatar"
              >
                {uploadingAvatar
                  ? <Loader2 size={12} className="animate-spin text-sky-500" />
                  : <Camera size={13} />
                }
              </button>
            </div>

            <button onClick={() => setEditing(!editing)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
              <Edit3 size={14} /> {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <h2 className="text-xl font-bold font-display text-slate-900">{profile?.full_name}</h2>
          {profile?.username && <p className="text-slate-400 text-sm mb-1">@{profile.username}</p>}
          {profile?.bio && <p className="text-slate-600 text-sm mt-1 mb-3">{profile.bio}</p>}

          <div className="flex items-center gap-3 text-sm text-slate-500 mb-4 flex-wrap">
            {profile?.home_city && (
              <span>📍 {profile.home_city}{profile.home_country ? `, ${profile.home_country}` : ''}</span>
            )}
            <span className="flex items-center gap-1"><Mail size={13} /> {profile?.email}</span>
            <span className="capitalize bg-sky-50 text-sky-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {profile?.role?.replace('_', ' ')}
            </span>
          </div>

          <div className="flex gap-6">
            {[
              { label: 'Trips',     value: trips.length },
              { label: 'Countries', value: profile?.total_countries || 0 },
              { label: 'Followers', value: 0 },
              { label: 'Following', value: 0 },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-bold text-slate-900 text-xl font-display">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-800 font-display text-lg flex items-center gap-2">
            <Settings size={16} /> Edit Profile
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.full_name} onChange={e => setField('full_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input" placeholder="@username" value={form.username} onChange={e => setField('username', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input resize-none" rows={2} placeholder="Tell us about yourself..."
              value={form.bio} onChange={e => setField('bio', e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nationality</label>
              <input className="input" placeholder="Irish" value={form.nationality} onChange={e => setField('nationality', e.target.value)} />
            </div>
            <div>
              <label className="label">Home country</label>
              <input className="input" placeholder="Ireland" value={form.home_country} onChange={e => setField('home_country', e.target.value)} />
            </div>
            <div>
              <label className="label">Home city</label>
              <input className="input" placeholder="Dublin" value={form.home_city} onChange={e => setField('home_city', e.target.value)} />
            </div>
            <div>
              <label className="label">Preferred currency</label>
              <select className="input" value={form.preferred_currency} onChange={e => setField('preferred_currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.symbol} — {c.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <><Save size={16} /> Save changes</>
            }
          </button>
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${activeTab === tab.key
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
                }`}>
              <Icon size={14} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Trips tab */}
      {activeTab === 'trips' && (
        trips.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">🗺️</div>
            <h3 className="font-bold text-slate-800 mb-2">No trips yet</h3>
            <p className="text-slate-500 text-sm mb-4">Start planning your first adventure!</p>
            <Link to="/trips/new" className="btn-primary inline-flex items-center gap-2">
              Plan your first trip
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {trips.map(trip => (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="card-hover p-4 sm:p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-800 font-display leading-tight">{trip.title}</h3>
                  <span className={`badge ml-2 flex-shrink-0 ${TRIP_STATUSES[trip.status]?.color}`}>
                    {TRIP_STATUSES[trip.status]?.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-2">
                  {format(new Date(trip.start_date), 'MMM d')} – {format(new Date(trip.end_date), 'MMM d, yyyy')}
                </p>
                <div className="text-xs text-slate-400">{trip.total_days} days</div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Stats tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Trips',       value: trips.length,              emoji: '✈️' },
            { label: 'Completed',         value: completedTrips.length,     emoji: '✅' },
            { label: 'Countries Visited', value: profile?.total_countries || 0, emoji: '🌍' },
            { label: 'Km Travelled',      value: profile?.total_km ? Number(profile.total_km).toLocaleString() : 0, emoji: '📏' },
          ].map(s => (
            <div key={s.label} className="card text-center p-6">
              <div className="text-3xl mb-2">{s.emoji}</div>
              <div className="text-3xl font-bold font-display text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
