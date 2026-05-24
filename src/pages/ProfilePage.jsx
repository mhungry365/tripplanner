import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTripsStore } from '../stores/tripsStore'
import { supabase } from '../lib/supabase'
import { uploadAvatar, uploadCover } from '../lib/storage'
import {
  Camera, Save, Globe, Map, Edit3, ImagePlus, Loader2, Share2,
  Plus, X, Award, Settings, Copy, MapPin, BookOpen,
} from 'lucide-react'
import { CURRENCIES, TRIP_STATUSES } from '../lib/constants'
import { format, differenceInDays, getMonth } from 'date-fns'
import toast from 'react-hot-toast'

/* ─── helpers ──────────────────────────────────────────────────────────── */

const COUNTRY_FLAGS = {
  'France':'🇫🇷','Italy':'🇮🇹','Spain':'🇪🇸','Germany':'🇩🇪','Japan':'🇯🇵',
  'USA':'🇺🇸','United States':'🇺🇸','UK':'🇬🇧','United Kingdom':'🇬🇧',
  'Portugal':'🇵🇹','Greece':'🇬🇷','Thailand':'🇹🇭','Ireland':'🇮🇪',
  'Netherlands':'🇳🇱','Belgium':'🇧🇪','Switzerland':'🇨🇭','Austria':'🇦🇹',
  'Croatia':'🇭🇷','Czech Republic':'🇨🇿','Poland':'🇵🇱','Turkey':'🇹🇷',
  'Morocco':'🇲🇦','Mexico':'🇲🇽','Canada':'🇨🇦','Australia':'🇦🇺',
  'New Zealand':'🇳🇿','Brazil':'🇧🇷','Argentina':'🇦🇷','Colombia':'🇨🇴',
  'Vietnam':'🇻🇳','Indonesia':'🇮🇩','Bali':'🇮🇩','Singapore':'🇸🇬',
  'Malaysia':'🇲🇾','India':'🇮🇳','China':'🇨🇳','South Korea':'🇰🇷',
  'Egypt':'🇪🇬','UAE':'🇦🇪','Dubai':'🇦🇪','South Africa':'🇿🇦',
  'Kenya':'🇰🇪','Peru':'🇵🇪','Chile':'🇨🇱','Sweden':'🇸🇪','Norway':'🇳🇴',
  'Denmark':'🇩🇰','Finland':'🇫🇮','Iceland':'🇮🇸','Hungary':'🇭🇺',
  'Romania':'🇷🇴','Bulgaria':'🇧🇬','Serbia':'🇷🇸','Slovakia':'🇸🇰',
  'Slovenia':'🇸🇮','Ukraine':'🇺🇦','Georgia':'🇬🇪','Jordan':'🇯🇴',
  'Israel':'🇮🇱','Tunisia':'🇹🇳','Tanzania':'🇹🇿','Ethiopia':'🇪🇹',
  'Ghana':'🇬🇭','Philippines':'🇵🇭','Taiwan':'🇹🇼','Hong Kong':'🇭🇰',
  'Cambodia':'🇰🇭','Nepal':'🇳🇵','Sri Lanka':'🇱🇰','Maldives':'🇲🇻',
  'Costa Rica':'🇨🇷','Cuba':'🇨🇺','Jamaica':'🇯🇲','Ecuador':'🇪🇨',
  'Bolivia':'🇧🇴','Uruguay':'🇺🇾','Panama':'🇵🇦','Luxembourg':'🇱🇺',
  'Malta':'🇲🇹','Cyprus':'🇨🇾','Lithuania':'🇱🇹','Latvia':'🇱🇻',
  'Estonia':'🇪🇪','Kazakhstan':'🇰🇿','Pakistan':'🇵🇰','Bangladesh':'🇧🇩',
  'Saudi Arabia':'🇸🇦','Kuwait':'🇰🇼','Qatar':'🇶🇦','Bahrain':'🇧🇭',
  'Oman':'🇴🇲','Fiji':'🇫🇯','Mongolia':'🇲🇳','Myanmar':'🇲🇲',
  'Laos':'🇱🇦','Monaco':'🇲🇨','Andorra':'🇦🇩','Albania':'🇦🇱',
  'Montenegro':'🇲🇪','Bosnia':'🇧🇦','Moldova':'🇲🇩','Belarus':'🇧🇾',
}

const DNA_SCORES = [
  { key:'adventure_score', label:'Adventure', emoji:'⚡', from:'from-orange-400', to:'to-red-500',    bg:'bg-orange-50', text:'text-orange-700' },
  { key:'foodie_score',    label:'Foodie',    emoji:'🍜', from:'from-yellow-400', to:'to-orange-500', bg:'bg-yellow-50', text:'text-yellow-700' },
  { key:'culture_score',  label:'Culture',   emoji:'🎭', from:'from-violet-400', to:'to-purple-600', bg:'bg-violet-50', text:'text-violet-700' },
  { key:'nightlife_score',label:'Nightlife', emoji:'🌙', from:'from-indigo-400', to:'to-blue-600',   bg:'bg-indigo-50', text:'text-indigo-700' },
]

const BUDGET_STYLES = ['Budget Backpacker','Comfort Traveller','Luxury Seeker']
const TRAVEL_PACES  = ['Slow Explorer','Balanced Wanderer','Fast Mover']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getPersonality(p) {
  const fallback = { label:'Wanderer', emoji:'🗺️', color:'bg-slate-100 text-slate-700' }
  if (!p) return fallback
  const MAP = {
    'Adventure Seeker':{ emoji:'⚡', color:'bg-orange-100 text-orange-700' },
    'Foodie Explorer': { emoji:'🍜', color:'bg-yellow-100 text-yellow-700' },
    'Culture Vulture': { emoji:'🎭', color:'bg-violet-100 text-violet-700' },
    'Night Owl':       { emoji:'🌙', color:'bg-indigo-100 text-indigo-700' },
    'Luxury Traveller':{ emoji:'💎', color:'bg-amber-100 text-amber-700' },
    'Wanderer':        fallback,
  }
  if (p.travel_personality && MAP[p.travel_personality])
    return { label: p.travel_personality, ...MAP[p.travel_personality] }
  const scores = [
    { label:'Adventure Seeker', val: p.adventure_score || 0, ...MAP['Adventure Seeker'] },
    { label:'Foodie Explorer',  val: p.foodie_score || 0,    ...MAP['Foodie Explorer'] },
    { label:'Culture Vulture',  val: p.culture_score || 0,   ...MAP['Culture Vulture'] },
    { label:'Night Owl',        val: p.nightlife_score || 0, ...MAP['Night Owl'] },
  ]
  const top = scores.reduce((a,b) => a.val > b.val ? a : b)
  return top.val < 20 ? fallback : top
}

function computeStats(trips) {
  const w = trips.filter(t => t.start_date && t.end_date)
  const totalDays = w.reduce((s,t) => s + Math.max(0, differenceInDays(new Date(t.end_date), new Date(t.start_date))), 0)
  const longest = w.length ? w.reduce((a,b) =>
    differenceInDays(new Date(a.end_date),new Date(a.start_date)) >=
    differenceInDays(new Date(b.end_date),new Date(b.start_date)) ? a : b) : null
  const first = w.length ? w.reduce((a,b) => new Date(a.start_date) <= new Date(b.start_date) ? a : b) : null
  const mc = {}
  w.forEach(t => { const m = getMonth(new Date(t.start_date)); mc[m] = (mc[m]||0)+1 })
  const favM = Object.entries(mc).sort((a,b)=>b[1]-a[1])[0]
  return {
    totalDays,
    longestDays: longest ? differenceInDays(new Date(longest.end_date),new Date(longest.start_date)) : 0,
    longestTrip: longest,
    firstTrip: first,
    favMonth: favM ? MONTHS[Number(favM[0])] : null,
  }
}

function computeBadges(trips, posts, profile) {
  const completed = trips.filter(t => t.status === 'completed')
  const countries = new Set([...(profile?.countries_visited||[]), ...trips.map(t=>t.destination).filter(Boolean)])
  return [
    { id:'first_steps',      emoji:'🌱', label:'First Steps',     desc:'Planned your first trip',  unlocked: trips.length >= 1 },
    { id:'frequent_flyer',   emoji:'✈️', label:'Frequent Flyer',  desc:'5 or more trips planned',  unlocked: trips.length >= 5 },
    { id:'globe_trotter',    emoji:'🌍', label:'Globe Trotter',   desc:'10+ countries visited',    unlocked: countries.size >= 10 },
    { id:'storyteller',      emoji:'📖', label:'Storyteller',     desc:'Shared 3+ travel posts',   unlocked: posts.length >= 3 },
    { id:'social_butterfly', emoji:'🦋', label:'Social Butterfly',desc:'10+ followers',            unlocked:(profile?.follower_count||0) >= 10 },
    { id:'wanderer_elite',   emoji:'🏆', label:'Wanderer Elite',  desc:'20+ trips completed',      unlocked: completed.length >= 20 },
    { id:'culture_vulture',  emoji:'🎭', label:'Culture Vulture', desc:'Culture score 70+',        unlocked:(profile?.culture_score||0) >= 70 },
    { id:'born_adventurer',  emoji:'⚡', label:'Born Adventurer', desc:'Adventure score 70+',      unlocked:(profile?.adventure_score||0) >= 70 },
  ]
}

/* ─── Component ────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const { profile, updateProfile } = useAuthStore()
  const { trips, fetchTrips }      = useTripsStore()

  const [activeTab,       setActiveTab]       = useState('overview')
  const [editing,         setEditing]         = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover,  setUploadingCover]  = useState(false)
  const [posts,           setPosts]           = useState([])
  const [shareModal,      setShareModal]      = useState(false)
  const [dreamInput,      setDreamInput]      = useState('')
  const [savingDream,     setSavingDream]     = useState(false)
  const [followModal,     setFollowModal]     = useState(null)  // 'followers' | 'following'
  const [followList,      setFollowList]      = useState([])
  const [followListLoading, setFollowListLoading] = useState(false)

  const avatarRef = useRef(null)
  const coverRef  = useRef(null)

  const [form, setForm] = useState({
    full_name:          profile?.full_name          || '',
    username:           profile?.username           || '',
    bio:                profile?.bio                || '',
    nationality:        profile?.nationality        || '',
    home_country:       profile?.home_country       || '',
    home_city:          profile?.home_city          || '',
    preferred_currency: profile?.preferred_currency || 'EUR',
    travel_personality: profile?.travel_personality || '',
    adventure_score:    profile?.adventure_score    || 0,
    foodie_score:       profile?.foodie_score       || 0,
    culture_score:      profile?.culture_score      || 0,
    nightlife_score:    profile?.nightlife_score    || 0,
    budget_style:       profile?.budget_style       ?? 1,
    travel_pace:        profile?.travel_pace        ?? 1,
    countries_visited:  profile?.countries_visited  || [],
  })

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!profile?.id) return
    fetchTrips(profile.id)
    supabase
      .from('posts')
      .select('id,content,image_urls,location_name,like_count,comment_count,created_at,trip_id')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => { if (data) setPosts(data) })
  }, [profile?.id])

  /* sync form when profile loads */
  useEffect(() => {
    if (!profile) return
    setForm({
      full_name:          profile.full_name          || '',
      username:           profile.username           || '',
      bio:                profile.bio                || '',
      nationality:        profile.nationality        || '',
      home_country:       profile.home_country       || '',
      home_city:          profile.home_city          || '',
      preferred_currency: profile.preferred_currency || 'EUR',
      travel_personality: profile.travel_personality || '',
      adventure_score:    profile.adventure_score    || 0,
      foodie_score:       profile.foodie_score       || 0,
      culture_score:      profile.culture_score      || 0,
      nightlife_score:    profile.nightlife_score    || 0,
      budget_style:       profile.budget_style       ?? 1,
      travel_pace:        profile.travel_pace        ?? 1,
      countries_visited:  profile.countries_visited  || [],
    })
  }, [profile])

  const handleSave = async () => {
    setLoading(true)
    const { error } = await updateProfile(form)
    if (error) toast.error('Save failed: ' + error.message)
    else { toast.success('Profile saved!'); setEditing(false) }
    setLoading(false)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5*1024*1024) { toast.error('Max 5 MB'); return }
    setUploadingAvatar(true)
    try {
      const { data:{ user } } = await supabase.auth.getUser()
      const url = await uploadAvatar(file, user.id)
      await updateProfile({ avatar_url: url })
      toast.success('Avatar updated!')
    } catch (err) { toast.error(err.message) }
    finally { setUploadingAvatar(false); e.target.value = '' }
  }

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10*1024*1024) { toast.error('Max 10 MB'); return }
    setUploadingCover(true)
    try {
      const { data:{ user } } = await supabase.auth.getUser()
      const url = await uploadCover(file, user.id)
      await updateProfile({ cover_image_url: url })
      toast.success('Cover updated!')
    } catch (err) { toast.error(err.message) }
    finally { setUploadingCover(false); e.target.value = '' }
  }

  const addDreamDest = async () => {
    if (!dreamInput.trim()) return
    setSavingDream(true)
    const updated = [...(profile?.bucket_list||[]), dreamInput.trim()]
    const { error } = await updateProfile({ bucket_list: updated })
    if (!error) { setDreamInput(''); toast.success('Added!') }
    else toast.error(error.message)
    setSavingDream(false)
  }

  const removeDreamDest = async (dest) => {
    const updated = (profile?.bucket_list||[]).filter(d => d !== dest)
    const { error } = await updateProfile({ bucket_list: updated })
    if (error) toast.error(error.message)
  }

  const openFollowModal = async (type) => {
    setFollowModal(type)
    setFollowList([])
    setFollowListLoading(true)
    if (type === 'followers') {
      const { data } = await supabase
        .from('follows')
        .select('profiles!follows_follower_id_fkey(id,full_name,avatar_url,username,travel_personality)')
        .eq('following_id', profile.id)
      setFollowList((data || []).map(r => r.profiles).filter(Boolean))
    } else {
      const { data } = await supabase
        .from('follows')
        .select('profiles!follows_following_id_fkey(id,full_name,avatar_url,username,travel_personality)')
        .eq('follower_id', profile.id)
      setFollowList((data || []).map(r => r.profiles).filter(Boolean))
    }
    setFollowListLoading(false)
  }

  const handleShare = () => {
    const url = `${window.location.origin}/profile/${profile?.id}`
    navigator.clipboard.writeText(url).then(() => toast.success('Profile link copied!'))
    setShareModal(true)
  }

  /* ── derived ── */
  const personality    = getPersonality(profile)
  const stats          = computeStats(trips)
  const badges         = computeBadges(trips, posts, profile)
  const completedTrips = trips.filter(t => t.status === 'completed')
  const recentTrips    = [...trips].sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,4)
  const allCountries   = [...new Set([
    ...(profile?.countries_visited||[]),
    ...trips.map(t => t.destination).filter(Boolean),
  ])]

  const TABS = [
    { key:'overview',  label:'Overview',  icon: Globe },
    { key:'countries', label:'Countries', icon: Map },
    { key:'posts',     label:'Posts',     icon: BookOpen },
  ]

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in">
      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      <input ref={coverRef}  type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

      {/* ── Identity Card ───────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        {/* Cover */}
        <div className="h-32 sm:h-44 relative overflow-hidden group">
          {profile?.cover_image_url
            ? <img src={profile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
            : <div className="h-full bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
              </div>
          }
          <button onClick={() => coverRef.current?.click()} disabled={uploadingCover}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all cursor-pointer">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/50 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
              {uploadingCover
                ? <><Loader2 size={12} className="animate-spin"/>Uploading…</>
                : <><ImagePlus size={12}/>Change cover</>}
            </span>
          </button>
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
                  : <span>{profile?.full_name?.[0]?.toUpperCase()||'W'}</span>}
              </div>
              <button onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-colors"
                title="Change avatar">
                {uploadingAvatar
                  ? <Loader2 size={12} className="animate-spin text-sky-500"/>
                  : <Camera size={13} className="text-slate-600"/>}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(!editing)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                <Edit3 size={14}/>{editing ? 'Cancel' : 'Edit'}
              </button>
              <button onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all">
                <Share2 size={14}/>Share
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-xl font-bold font-display text-slate-900">{profile?.full_name}</h2>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${personality.color}`}>
              {personality.emoji} {personality.label}
            </span>
          </div>
          {profile?.username && <p className="text-slate-400 text-sm">@{profile.username}</p>}
          {profile?.bio      && <p className="text-slate-600 text-sm mt-1.5 mb-1">{profile.bio}</p>}
          {profile?.home_city && (
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
              <MapPin size={12}/>{profile.home_city}{profile.home_country ? `, ${profile.home_country}` : ''}
            </p>
          )}

          {/* Stats row */}
          <div className="flex gap-6 sm:gap-8 border-t border-slate-100 pt-4 mt-4">
            {[
              { label:'Trips',     value: trips.length,                                         click: null },
              { label:'Countries', value: allCountries.length || profile?.total_countries || 0, click: null },
              { label:'Followers', value: profile?.follower_count  || 0,                        click: 'followers' },
              { label:'Following', value: profile?.following_count || 0,                        click: 'following' },
            ].map(s => (
              <div key={s.label} className={`text-center ${s.click ? 'cursor-pointer group' : ''}`}
                onClick={() => s.click && openFollowModal(s.click)}>
                <div className={`font-bold text-slate-900 text-lg font-display leading-tight ${s.click ? 'group-hover:text-sky-600 transition-colors' : ''}`}>{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Edit form ───────────────────────────────────────────────── */}
      {editing && (
        <div className="card space-y-5">
          <h3 className="font-bold text-slate-800 font-display text-base flex items-center gap-2">
            <Settings size={16}/>Edit Profile
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.full_name} onChange={e=>setField('full_name',e.target.value)}/>
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input" placeholder="@username" value={form.username} onChange={e=>setField('username',e.target.value)}/>
            </div>
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea className="input resize-none" rows={2} placeholder="Tell us about yourself…"
              value={form.bio} onChange={e=>setField('bio',e.target.value)}/>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Nationality</label>
              <input className="input" placeholder="Irish" value={form.nationality} onChange={e=>setField('nationality',e.target.value)}/>
            </div>
            <div>
              <label className="label">Home country</label>
              <input className="input" placeholder="Ireland" value={form.home_country} onChange={e=>setField('home_country',e.target.value)}/>
            </div>
            <div>
              <label className="label">Home city</label>
              <input className="input" placeholder="Dublin" value={form.home_city} onChange={e=>setField('home_city',e.target.value)}/>
            </div>
          </div>

          <div>
            <label className="label">Preferred currency</label>
            <select className="input" value={form.preferred_currency} onChange={e=>setField('preferred_currency',e.target.value)}>
              {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code} {c.symbol} — {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Countries visited (comma-separated)</label>
            <textarea className="input resize-none" rows={2}
              placeholder="France, Italy, Japan, …"
              value={form.countries_visited.join(', ')}
              onChange={e=>setField('countries_visited', e.target.value.split(',').map(c=>c.trim()).filter(Boolean))}/>
          </div>

          {/* Travel DNA sliders */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-bold text-slate-700 mb-3">🧬 Travel DNA</p>
            <div className="space-y-3">
              {DNA_SCORES.map(s=>(
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-base w-6">{s.emoji}</span>
                  <span className="text-sm font-medium text-slate-600 w-20">{s.label}</span>
                  <input type="range" min="0" max="100" step="5"
                    value={form[s.key]}
                    onChange={e=>setField(s.key, Number(e.target.value))}
                    className="flex-1 accent-indigo-500"/>
                  <span className="text-sm font-bold text-slate-700 w-8 text-right">{form[s.key]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Travel Personality</label>
              <select className="input" value={form.travel_personality} onChange={e=>setField('travel_personality',e.target.value)}>
                <option value="">Auto-detect from scores</option>
                {['Adventure Seeker','Foodie Explorer','Culture Vulture','Night Owl','Luxury Traveller','Wanderer'].map(o=>(
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Budget Style</label>
              <select className="input" value={form.budget_style} onChange={e=>setField('budget_style',Number(e.target.value))}>
                {BUDGET_STYLES.map((s,i)=><option key={i} value={i}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Travel Pace</label>
              <select className="input" value={form.travel_pace} onChange={e=>setField('travel_pace',Number(e.target.value))}>
                {TRAVEL_PACES.map((p,i)=><option key={i} value={i}>{p}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin"/> : <><Save size={16}/>Save changes</>}
          </button>
        </div>
      )}

      {/* ── Tab nav ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
        {TABS.map(tab=>{
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${activeTab===tab.key
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon size={14}/>{tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Overview Tab ────────────────────────────────────────────── */}
      {activeTab==='overview' && (
        <div className="space-y-5">

          {/* Travel DNA */}
          <div className="card">
            <h3 className="font-bold text-slate-800 font-display text-base mb-4">🧬 Travel DNA</h3>
            <div className="space-y-3.5">
              {DNA_SCORES.map(s=>{
                const val = profile?.[s.key] || 0
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-700">{s.emoji} {s.label}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{val}/100</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${s.from} ${s.to} rounded-full transition-all duration-700`}
                        style={{width:`${val}%`}}/>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-2 font-semibold">💰 Budget Style</p>
                <div className="flex gap-1 mb-1.5">
                  {BUDGET_STYLES.map((_,i)=>(
                    <div key={i} className={`flex-1 h-1.5 rounded-full ${i<=(profile?.budget_style??1)?'bg-indigo-500':'bg-slate-200'}`}/>
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-700">{BUDGET_STYLES[profile?.budget_style??1]}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-2 font-semibold">🏃 Travel Pace</p>
                <div className="flex gap-1 mb-1.5">
                  {TRAVEL_PACES.map((_,i)=>(
                    <div key={i} className={`flex-1 h-1.5 rounded-full ${i<=(profile?.travel_pace??1)?'bg-sky-500':'bg-slate-200'}`}/>
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-700">{TRAVEL_PACES[profile?.travel_pace??1]}</p>
              </div>
            </div>
          </div>

          {/* Travel Stats */}
          <div className="card">
            <h3 className="font-bold text-slate-800 font-display text-base mb-4">📊 Travel Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label:'Total Trips',   value: trips.length,                                              emoji:'✈️' },
                { label:'Completed',     value: completedTrips.length,                                     emoji:'✅' },
                { label:'Days Abroad',   value: stats.totalDays || profile?.total_days_travelled || 0,     emoji:'📅' },
                { label:'Countries',     value: allCountries.length || profile?.total_countries || 0,      emoji:'🌍' },
                { label:'Distance (km)', value: profile?.total_km ? Number(profile.total_km).toLocaleString() : '—', emoji:'📏' },
                { label:'Longest Trip',  value: stats.longestDays ? `${stats.longestDays} days` : '—',    emoji:'🏅' },
              ].map(s=>(
                <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <div className="font-bold text-slate-900 font-display text-lg">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {(stats.firstTrip || stats.favMonth) && (
              <div className="mt-3 flex gap-3">
                {stats.firstTrip && (
                  <div className="flex-1 bg-sky-50 rounded-xl p-3">
                    <p className="text-xs text-sky-600 font-semibold mb-0.5">First Trip</p>
                    <p className="font-bold text-sky-800 text-sm truncate">{stats.firstTrip.title}</p>
                    <p className="text-xs text-sky-600">{format(new Date(stats.firstTrip.start_date),'MMM yyyy')}</p>
                  </div>
                )}
                {stats.favMonth && (
                  <div className="flex-1 bg-violet-50 rounded-xl p-3">
                    <p className="text-xs text-violet-600 font-semibold mb-0.5">Favourite Month</p>
                    <p className="font-bold text-violet-800 text-sm">{stats.favMonth}</p>
                    <p className="text-xs text-violet-600">most trips started</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 font-display text-base">🏅 Achievements</h3>
              <span className="text-xs text-slate-400">{badges.filter(b=>b.unlocked).length}/{badges.length} unlocked</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.map(b=>(
                <div key={b.id} className={`rounded-xl p-3 text-center transition-all border ${
                  b.unlocked
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                    : 'bg-slate-50 border-slate-100 opacity-45 grayscale'
                }`}>
                  <div className="text-2xl mb-1">{b.emoji}</div>
                  <div className="text-xs font-bold text-slate-700 leading-tight">{b.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-tight">{b.desc}</div>
                  {b.unlocked && (
                    <div className="mt-1.5 text-xs font-bold text-amber-600 flex items-center justify-center gap-0.5">
                      <Award size={10}/>Unlocked
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trips */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 font-display text-base">✈️ Recent Trips</h3>
              <Link to="/trips" className="text-sm text-sky-600 font-semibold hover:text-sky-700">View all →</Link>
            </div>
            {recentTrips.length===0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-slate-500 text-sm mb-3">No trips yet.</p>
                <Link to="/trips/new" className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2">
                  Plan your first trip
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {recentTrips.map(trip=>(
                  <Link key={trip.id} to={`/trips/${trip.id}`}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-lg flex-shrink-0">
                      ✈️
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate group-hover:text-sky-600 transition-colors">{trip.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {trip.start_date ? format(new Date(trip.start_date),'MMM d') : '—'}
                        {trip.end_date   ? ` – ${format(new Date(trip.end_date),'MMM d, yyyy')}` : ''}
                      </p>
                      <span className={`badge text-xs mt-1 ${TRIP_STATUSES[trip.status]?.color||'bg-slate-100 text-slate-600'}`}>
                        {TRIP_STATUSES[trip.status]?.label||trip.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Countries Tab ───────────────────────────────────────────── */}
      {activeTab==='countries' && (
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 font-display text-base">🌍 Countries Visited</h3>
              <span className="text-sm text-slate-500">
                <span className="font-bold text-slate-800">{allCountries.length}</span>
                {' '}visited · <span className="font-bold text-slate-800">{Math.max(0,195-allCountries.length)}</span> to go
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
              <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all"
                style={{width:`${Math.min(100,(allCountries.length/195)*100)}%`}}/>
            </div>
            {allCountries.length===0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                <p>Add countries from Edit Profile, or they'll appear from your trip destinations.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allCountries.map((c,i)=>(
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700">
                    {COUNTRY_FLAGS[c]||'🏳️'} {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dream Destinations */}
          <div className="card">
            <h3 className="font-bold text-slate-800 font-display text-base mb-4">⭐ Dream Destinations</h3>
            <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem]">
              {(profile?.bucket_list||[]).length===0 && (
                <p className="text-slate-400 text-sm">Add places you dream of visiting…</p>
              )}
              {(profile?.bucket_list||[]).map((dest,i)=>(
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-800">
                  ⭐ {dest}
                  <button onClick={()=>removeDreamDest(dest)}
                    className="text-amber-400 hover:text-red-500 transition-colors">
                    <X size={12}/>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Add a dream destination…"
                value={dreamInput} onChange={e=>setDreamInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&addDreamDest()}/>
              <button onClick={addDreamDest} disabled={savingDream||!dreamInput.trim()}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm">
                {savingDream ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Posts Tab ───────────────────────────────────────────────── */}
      {activeTab==='posts' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 font-display text-base">📸 My Posts</h3>
            <span className="text-xs text-slate-400">{posts.length} posts</span>
          </div>
          {posts.length===0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📸</div>
              <p className="text-slate-500 text-sm">No posts yet.</p>
              <p className="text-slate-400 text-xs mt-1">Share travel moments from a trip page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map(post=>{
                const img = post.image_urls?.[0]
                return (
                  <Link key={post.id} to={post.trip_id ? `/trips/${post.trip_id}` : '/feed'}
                    className="aspect-square rounded-lg overflow-hidden relative group bg-slate-100">
                    {img
                      ? <img src={img} alt={post.location_name||''} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-3xl">✈️</div>
                    }
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="text-white text-xs font-semibold text-center px-2">
                        <div className="flex items-center gap-2 justify-center">
                          <span>❤️ {post.like_count||0}</span>
                          <span>💬 {post.comment_count||0}</span>
                        </div>
                        {post.location_name && <p className="mt-1 truncate">{post.location_name}</p>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Followers / Following Modal ─────────────────────────────── */}
      {followModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setFollowModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 font-display capitalize">
                {followModal === 'followers' ? 'Followers' : 'Following'}
              </h3>
              <button onClick={() => setFollowModal(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18}/>
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {followListLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-slate-400"/>
                </div>
              ) : followList.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">
                  No {followModal} yet
                </p>
              ) : (
                followList.map(u => {
                  const pColor = ['from-sky-400 to-indigo-500','from-violet-400 to-purple-600','from-orange-400 to-rose-500','from-emerald-400 to-teal-600'][u.full_name?.charCodeAt(0)%4||0]
                  return (
                    <Link key={u.id} to={`/profile/${u.id}`}
                      onClick={() => setFollowModal(null)}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${pColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden`}>
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover"/>
                          : <span>{u.full_name?.[0]?.toUpperCase()||'?'}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 text-sm truncate">{u.full_name}</p>
                        {u.username && <p className="text-xs text-slate-400">@{u.username}</p>}
                      </div>
                      {u.travel_personality && (
                        <span className="text-xs text-slate-400 flex-shrink-0">{u.travel_personality}</span>
                      )}
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Travel Card / Share Modal ────────────────────────────────── */}
      {shareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e=>{ if(e.target===e.currentTarget) setShareModal(false) }}>
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Card */}
            <div className="bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_25%_15%,white,transparent_55%)]"/>
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-[3px] border-white/80 shadow-lg overflow-hidden bg-white/20 flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
                    : <span>{profile?.full_name?.[0]?.toUpperCase()||'W'}</span>}
                </div>
                <h3 className="font-bold text-xl font-display">{profile?.full_name}</h3>
                {profile?.username && <p className="text-white/70 text-sm">@{profile.username}</p>}
                <div className="mt-2 inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm font-semibold backdrop-blur-sm">
                  {personality.emoji} {personality.label}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label:'Trips',     value: trips.length },
                    { label:'Countries', value: allCountries.length || profile?.total_countries || 0 },
                    { label:'Days',      value: stats.totalDays || 0 },
                  ].map(s=>(
                    <div key={s.label} className="bg-white/20 rounded-xl p-2.5 backdrop-blur-sm">
                      <div className="font-bold text-2xl font-display">{s.value}</div>
                      <div className="text-xs text-white/80">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1.5">
                  {DNA_SCORES.map(s=>(
                    <div key={s.key} className="flex items-center gap-2">
                      <span className="text-xs w-5">{s.emoji}</span>
                      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/80 rounded-full" style={{width:`${profile?.[s.key]||0}%`}}/>
                      </div>
                      <span className="text-xs text-white/70 w-6 text-right">{profile?.[s.key]||0}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs text-white/50">holidater.vercel.app</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2">
              <button
                onClick={()=>{
                  const url=`${window.location.origin}/profile/${profile?.id}`
                  navigator.clipboard.writeText(url).then(()=>toast.success('Link copied!'))
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
                <Copy size={15}/>Copy profile link
              </button>
              <button onClick={()=>setShareModal(false)}
                className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
