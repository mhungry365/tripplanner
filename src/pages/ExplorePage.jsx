import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Star, X, Calendar, TrendingUp, Users, Globe } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

/* ─── constants ────────────────────────────────────────────────────────── */

const CONTINENTS = [
  { key:'all',      label:'All' },
  { key:'Asia',     label:'Asia' },
  { key:'Europe',   label:'Europe' },
  { key:'Americas', label:'Americas' },
  { key:'Oceania',  label:'Oceania' },
  { key:'Africa',   label:'Africa' },
]

const CONTINENT_GRADIENT = {
  Asia:          'linear-gradient(135deg, #f97316, #dc2626)',
  Europe:        'linear-gradient(135deg, #3b82f6, #6d28d9)',
  Americas:      'linear-gradient(135deg, #10b981, #0891b2)',
  Africa:        'linear-gradient(135deg, #f59e0b, #ea580c)',
  Oceania:       'linear-gradient(135deg, #06b6d4, #2563eb)',
  'Middle East': 'linear-gradient(135deg, #d97706, #dc2626)',
  default:       'linear-gradient(135deg, #6366f1, #8b5cf6)',
}

const PERSONALITY_COLORS = {
  'Adventure Seeker':{ bg:'bg-orange-100', text:'text-orange-700', emoji:'⚡' },
  'Foodie Explorer':  { bg:'bg-yellow-100', text:'text-yellow-700', emoji:'🍜' },
  'Culture Vulture':  { bg:'bg-violet-100', text:'text-violet-700', emoji:'🎭' },
  'Night Owl':        { bg:'bg-indigo-100', text:'text-indigo-700', emoji:'🌙' },
  'Luxury Traveller': { bg:'bg-amber-100',  text:'text-amber-700',  emoji:'💎' },
  'Wanderer':         { bg:'bg-slate-100',  text:'text-slate-600',  emoji:'🗺️' },
}
function getPersonalityStyle(p) {
  return PERSONALITY_COLORS[p] || { bg:'bg-slate-100', text:'text-slate-600', emoji:'🌍' }
}

/* ─── avatar ───────────────────────────────────────────────────────────── */

const COLORS = ['from-sky-400 to-blue-600','from-pink-400 to-rose-600','from-emerald-400 to-teal-600','from-violet-400 to-purple-600','from-amber-400 to-orange-600','from-indigo-400 to-cyan-600']
function avatarColor(id) {
  if (!id) return COLORS[0]
  let h = 0; for (let i = 0; i < id.length; i++) h = id.charCodeAt(i)+((h<<5)-h)
  return COLORS[Math.abs(h) % COLORS.length]
}
function Avatar({ profile, userId }) {
  const initial = profile?.full_name?.[0]?.toUpperCase() || 'T'
  return (
    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
        : <div className={`w-full h-full bg-gradient-to-br ${avatarColor(userId)} flex items-center justify-center text-white text-xl font-bold`}>{initial}</div>
      }
    </div>
  )
}

/* ─── StarRating ───────────────────────────────────────────────────────── */

function StarRating({ rating, white = false }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11} className={i<=rating ? 'fill-amber-400 text-amber-400' : white ? 'text-white/30' : 'text-slate-300'}/>
      ))}
    </div>
  )
}

/* ─── TravellerCard ────────────────────────────────────────────────────── */

function TravellerCard({ traveller, currentUserId, followingIds, onFollow }) {
  const isFollowing = followingIds.has(traveller.id)
  const isMe        = traveller.id === currentUserId
  const pStyle      = getPersonalityStyle(traveller.travel_personality)

  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start gap-3">
        <Link to={isMe ? '/profile' : `/profile/${traveller.id}`}>
          <Avatar profile={traveller} userId={traveller.id}/>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={isMe ? '/profile' : `/profile/${traveller.id}`}
            className="font-bold text-slate-800 text-sm hover:text-sky-600 transition-colors block truncate font-display">
            {traveller.full_name}
          </Link>
          {traveller.username && (
            <p className="text-xs text-slate-400 truncate">@{traveller.username}</p>
          )}
          {traveller.home_city && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">📍 {traveller.home_city}{traveller.home_country ? `, ${traveller.home_country}` : ''}</p>
          )}
        </div>
      </div>

      {traveller.travel_personality && (
        <span className={`inline-flex items-center gap-1 self-start px-2.5 py-1 rounded-full text-xs font-semibold ${pStyle.bg} ${pStyle.text}`}>
          {pStyle.emoji} {traveller.travel_personality}
        </span>
      )}

      {traveller.bio && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{traveller.bio}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-50 pt-2">
        <span>🌍 <strong className="text-slate-700">{traveller.total_countries || 0}</strong> countries</span>
        <span>✈️ <strong className="text-slate-700">{traveller.follower_count || 0}</strong> followers</span>
      </div>

      {!isMe && (
        <button onClick={() => onFollow(traveller)}
          className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
            isFollowing
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:shadow-md'
          }`}>
          {isFollowing ? '✓ Following' : '+ Follow'}
        </button>
      )}
    </div>
  )
}

/* ─── ExplorePage ──────────────────────────────────────────────────────── */

export default function ExplorePage() {
  const [searchParams] = useSearchParams()
  const { profile }    = useAuthStore()

  /* destinations tab */
  const [destinations, setDestinations] = useState([])
  const [destSearch,   setDestSearch]   = useState('')
  const [continent,    setContinent]    = useState('all')
  const [destLoading,  setDestLoading]  = useState(true)
  const [selected,     setSelected]     = useState(null)

  /* travellers tab */
  const [travellers,    setTravellers]    = useState([])
  const [travSearch,    setTravSearch]    = useState('')
  const [travLoading,   setTravLoading]   = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [followingIds,  setFollowingIds]  = useState(new Set())

  const initialTab = searchParams.get('tab') === 'travellers' ? 'travellers' : 'destinations'
  const [activeTab, setActiveTab] = useState(initialTab)

  /* ── init user + following ── */
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)
      const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
      setFollowingIds(new Set((data || []).map(f => f.following_id)))
    }
    init()
  }, [])

  /* ── destinations ── */
  useEffect(() => {
    if (activeTab !== 'destinations') return
    const fetch = async () => {
      setDestLoading(true)
      let q = supabase
        .from('destinations')
        .select('id,city,country_name,continent,flag_emoji,description,cover_image_url,budget_level,avg_daily_budget_usd,safety_rating,popularity_score,best_months,visa_required,currency_code,currency_symbol,language')
        .order('popularity_score', { ascending: false })
      if (continent !== 'all') q = q.eq('continent', continent)
      if (destSearch) q = q.or(`city.ilike.%${destSearch}%,country_name.ilike.%${destSearch}%`)
      const { data } = await q.limit(50)
      setDestinations(data || [])
      setDestLoading(false)
    }
    fetch()
  }, [destSearch, continent, activeTab])

  /* ── travellers ── */
  useEffect(() => {
    if (activeTab !== 'travellers') return
    const fetch = async () => {
      setTravLoading(true)
      let q = supabase
        .from('profiles')
        .select('id,full_name,username,avatar_url,bio,home_city,home_country,travel_personality,total_countries,follower_count')
        .order('follower_count', { ascending: false, nullsFirst: false })
      if (travSearch) q = q.ilike('full_name', `%${travSearch}%`)
      const { data } = await q.limit(48)
      setTravellers(data || [])
      setTravLoading(false)
    }
    fetch()
  }, [travSearch, activeTab])

  /* ── follow/unfollow ── */
  const handleFollow = async (traveller) => {
    if (!currentUserId) { toast.error('Sign in to follow'); return }
    const isFollowing = followingIds.has(traveller.id)

    if (isFollowing) {
      setFollowingIds(prev => { const n = new Set(prev); n.delete(traveller.id); return n })
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', traveller.id)
      await supabase.from('profiles').update({ follower_count: Math.max(0,(traveller.follower_count||1)-1) }).eq('id', traveller.id)
    } else {
      setFollowingIds(prev => new Set([...prev, traveller.id]))
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: traveller.id })
      await supabase.from('profiles').update({ follower_count: (traveller.follower_count||0)+1 }).eq('id', traveller.id)
      const followerId = currentUserId || profile?.id
      if (followerId) {
        try {
          await supabase.rpc('send_social_notification', {
            p_user_id: traveller.id,
            p_title: `👤 ${profile?.full_name || 'Someone'} started following you`,
            p_message: 'They are now following your travel adventures!',
            p_action_url: `/profile/${followerId}`,
            p_data: { follower_id: followerId },
          })
        } catch {}
      }
      toast.success(`Following ${traveller.full_name}!`)
    }
  }

  const trendingIds = new Set(destinations.slice(0, 5).map(d => d.id))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Explore</h1>
        <p className="text-slate-500 text-sm mt-1">Discover destinations and travellers</p>
      </div>

      {/* ── Main tabs ── */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 max-w-xs">
        <button onClick={() => setActiveTab('destinations')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all
            ${activeTab==='destinations' ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
          <Globe size={14}/> Destinations
        </button>
        <button onClick={() => setActiveTab('travellers')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all
            ${activeTab==='travellers' ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
          <Users size={14}/> Travellers
        </button>
      </div>

      {/* ══ DESTINATIONS TAB ══ */}
      {activeTab === 'destinations' && (
        <>
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className="input pl-10" placeholder="Search cities or countries…"
              value={destSearch} onChange={e => setDestSearch(e.target.value)}/>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {CONTINENTS.map(c => (
              <button key={c.key} onClick={() => setContinent(c.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all min-h-[44px]
                  ${continent===c.key
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                {c.label}
              </button>
            ))}
          </div>

          {destLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {Array.from({length:8}).map((_,i) => <div key={i} className="h-48 sm:h-64 shimmer rounded-2xl"/>)}
            </div>
          ) : destinations.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🌍</div>
              <p className="text-slate-500 font-medium">No destinations found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {destinations.map(d => (
                <button key={d.id} onClick={() => setSelected(d)}
                  className="relative h-48 sm:h-64 rounded-2xl overflow-hidden group cursor-pointer text-left shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: d.cover_image_url ? `url(${d.cover_image_url})` : (CONTINENT_GRADIENT[d.continent]||CONTINENT_GRADIENT.default) }}/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
                  {trendingIds.has(d.id) && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
                      <TrendingUp size={10}/> Trending
                    </div>
                  )}
                  <div className="absolute top-3 right-3 text-2xl drop-shadow-md">{d.flag_emoji}</div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-white font-bold text-lg font-display leading-tight">{d.city}</div>
                    <div className="text-white/70 text-sm mb-2">{d.country_name}</div>
                    <div className="flex items-center justify-between">
                      <StarRating rating={d.safety_rating} white/>
                      <span className="text-white/90 text-xs font-semibold bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        ${d.avg_daily_budget_usd}/day
                      </span>
                    </div>
                    {d.best_months?.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {d.best_months.slice(0,2).map(m => (
                          <span key={m} className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">{m}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Destination detail modal */}
          {selected && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setSelected(null)}>
              <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                <div className="relative h-56 sm:h-72 flex-shrink-0">
                  <div className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: selected.cover_image_url ? `url(${selected.cover_image_url})` : (CONTINENT_GRADIENT[selected.continent]||CONTINENT_GRADIENT.default) }}/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                  <button onClick={() => setSelected(null)}
                    className="absolute top-4 right-4 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                    <X size={18}/>
                  </button>
                  <div className="absolute bottom-4 left-5">
                    <div className="text-4xl mb-1">{selected.flag_emoji}</div>
                    <h2 className="text-3xl font-bold font-display text-white">{selected.city}</h2>
                    <p className="text-white/80 text-sm">{selected.country_name} · {selected.continent}</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  {selected.description && <p className="text-slate-600 leading-relaxed">{selected.description}</p>}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="text-2xl font-bold font-display text-slate-900">${selected.avg_daily_budget_usd}</div>
                      <div className="text-xs text-slate-500 mt-0.5">avg/day</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="flex justify-center mb-1"><StarRating rating={selected.safety_rating}/></div>
                      <div className="text-xs text-slate-500">safety</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="text-2xl font-bold font-display text-slate-900">{selected.popularity_score}</div>
                      <div className="text-xs text-slate-500 mt-0.5">popularity</div>
                    </div>
                  </div>
                  {selected.best_months?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><Calendar size={14}/> Best time to visit</p>
                      <div className="flex flex-wrap gap-2">
                        {selected.best_months.map(m => <span key={m} className="text-sm bg-sky-50 text-sky-700 font-medium px-3 py-1 rounded-full">{m}</span>)}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap text-sm">
                    {selected.visa_required && <span className="bg-amber-50 text-amber-700 font-medium px-3 py-1 rounded-full">Visa required</span>}
                    {selected.currency_code && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{selected.currency_code} {selected.currency_symbol}</span>}
                    {selected.language && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{selected.language}</span>}
                  </div>
                  <Link to="/trips/new" onClick={() => setSelected(null)}
                    className="block w-full btn-primary text-center py-3 text-base font-bold rounded-xl">
                    ✈️ Plan a trip here
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ TRAVELLERS TAB ══ */}
      {activeTab === 'travellers' && (
        <>
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className="input pl-10" placeholder="Search travellers by name…"
              value={travSearch} onChange={e => setTravSearch(e.target.value)}/>
          </div>

          {travLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({length:8}).map((_,i) => (
                <div key={i} className="card p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100"/>
                    <div className="flex-1 space-y-2"><div className="h-3 bg-slate-100 rounded w-24"/><div className="h-2.5 bg-slate-100 rounded w-16"/></div>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-full w-32"/>
                  <div className="h-8 bg-slate-100 rounded-xl"/>
                </div>
              ))}
            </div>
          ) : travellers.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🌍</div>
              <p className="text-slate-500 font-medium">No travellers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {travellers.map(t => (
                <TravellerCard key={t.id} traveller={t}
                  currentUserId={currentUserId}
                  followingIds={followingIds}
                  onFollow={handleFollow}/>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
