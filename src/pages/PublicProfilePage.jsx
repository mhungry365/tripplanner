import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Users, MapPin, Globe, Map, BookOpen, Award, MessageCircle } from 'lucide-react'
import { TRIP_STATUSES } from '../lib/constants'
import { format, differenceInDays, getMonth } from 'date-fns'
import toast from 'react-hot-toast'

/* ─── helpers (same as ProfilePage) ───────────────────────────────────── */

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
    { label:'Foodie Explorer',  val: p.foodie_score    || 0, ...MAP['Foodie Explorer'] },
    { label:'Culture Vulture',  val: p.culture_score   || 0, ...MAP['Culture Vulture'] },
    { label:'Night Owl',        val: p.nightlife_score || 0, ...MAP['Night Owl'] },
  ]
  const top = scores.reduce((a,b) => a.val > b.val ? a : b)
  return top.val < 20 ? fallback : top
}

function computeStats(trips) {
  const w = trips.filter(t => t.start_date && t.end_date)
  const totalDays = w.reduce((s,t) => s + Math.max(0, differenceInDays(new Date(t.end_date),new Date(t.start_date))),0)
  const longest = w.length ? w.reduce((a,b)=>
    differenceInDays(new Date(a.end_date),new Date(a.start_date)) >=
    differenceInDays(new Date(b.end_date),new Date(b.start_date)) ? a : b) : null
  const first = w.length ? w.reduce((a,b)=>new Date(a.start_date)<=new Date(b.start_date)?a:b) : null
  const mc = {}
  w.forEach(t=>{ const m=getMonth(new Date(t.start_date)); mc[m]=(mc[m]||0)+1 })
  const favM = Object.entries(mc).sort((a,b)=>b[1]-a[1])[0]
  return {
    totalDays,
    longestDays: longest ? differenceInDays(new Date(longest.end_date),new Date(longest.start_date)) : 0,
    firstTrip: first,
    favMonth: favM ? MONTHS[Number(favM[0])] : null,
  }
}

/* ─── Component ────────────────────────────────────────────────────────── */

export default function PublicProfilePage() {
  const { userId }        = useParams()
  const { profile: me }   = useAuthStore()

  const [pubProfile, setPubProfile] = useState(null)
  const [trips,      setTrips]      = useState([])
  const [posts,      setPosts]      = useState([])
  const [following,  setFollowing]  = useState(false)
  const [fLoading,   setFLoading]   = useState(false)
  const [pageLoading,setPageLoading]= useState(true)
  const [activeTab,  setActiveTab]  = useState('overview')

  useEffect(() => {
    if (!userId) return
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    setPageLoading(true)

    const [{ data: profileData }, { data: tripsData }, { data: postsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('trips').select('*').eq('user_id', userId).eq('visibility','public').order('created_at',{ascending:false}),
      supabase.from('posts').select('id,content,image_urls,location_name,like_count,comment_count,created_at,trip_id')
        .eq('user_id', userId).eq('visibility','public').order('created_at',{ascending:false}).limit(12),
    ])

    setPubProfile(profileData)
    setTrips(tripsData || [])
    setPosts(postsData || [])

    if (me?.id && me.id !== userId) {
      const { data: followRow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', me.id)
        .eq('following_id', userId)
        .maybeSingle()
      setFollowing(!!followRow)
    }

    setPageLoading(false)
  }

  const handleFollow = async () => {
    if (!me?.id) { toast.error('Sign in to follow'); return }
    setFLoading(true)
    try {
      if (following) {
        await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', userId)
        await supabase.from('profiles').update({ follower_count: Math.max(0,(pubProfile?.follower_count||1)-1) }).eq('id', userId)
        setPubProfile(p => ({ ...p, follower_count: Math.max(0,(p?.follower_count||1)-1) }))
        setFollowing(false)
        toast.success('Unfollowed')
      } else {
        await supabase.from('follows').insert({ follower_id: me.id, following_id: userId })
        await supabase.from('profiles').update({ follower_count: (pubProfile?.follower_count||0)+1 }).eq('id', userId)
        setPubProfile(p => ({ ...p, follower_count: (p?.follower_count||0)+1 }))
        setFollowing(true)
        toast.success('Following!')
      }
    } catch (err) {
      toast.error(err.message)
    }
    setFLoading(false)
  }

  if (pageLoading) {
    return (
      <div className="max-w-3xl flex items-center justify-center py-24">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🌍</div>
          <p className="text-slate-500 text-sm">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (!pubProfile) {
    return (
      <div className="max-w-3xl">
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">🕵️</div>
          <h3 className="font-bold text-slate-800 text-lg mb-2">Profile not found</h3>
          <p className="text-slate-500 text-sm mb-4">This user doesn't exist or their profile is private.</p>
          <Link to="/explore" className="btn-primary inline-flex items-center gap-2">Explore travellers</Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = me?.id === userId
  const personality  = getPersonality(pubProfile)
  const stats        = computeStats(trips)
  const allCountries = [...new Set([
    ...(pubProfile.countries_visited||[]),
    ...trips.map(t=>t.destination).filter(Boolean),
  ])]
  const recentTrips = trips.slice(0,4)

  const TABS = [
    { key:'overview',  label:'Overview',  icon: Globe },
    { key:'countries', label:'Countries', icon: Map },
    { key:'posts',     label:'Posts',     icon: BookOpen },
  ]

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in">

      {/* ── Identity Card ───────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        <div className="h-32 sm:h-44 relative overflow-hidden">
          {pubProfile.cover_image_url
            ? <img src={pubProfile.cover_image_url} alt="Cover" className="w-full h-full object-cover"/>
            : <div className="h-full bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600"/>
          }
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
              {pubProfile.avatar_url
                ? <img src={pubProfile.avatar_url} alt="" className="w-full h-full object-cover"/>
                : <span>{pubProfile.full_name?.[0]?.toUpperCase()||'W'}</span>}
            </div>

            {/* Action buttons */}
            {!isOwnProfile && (
              <div className="flex items-center gap-2">
                <button onClick={handleFollow} disabled={fLoading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    following
                      ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md hover:shadow-lg'
                  }`}>
                  <Users size={14}/>{fLoading ? '…' : following ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={()=>toast('Messaging coming soon!')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all">
                  <MessageCircle size={14}/>Message
                </button>
              </div>
            )}
            {isOwnProfile && (
              <Link to="/profile"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                Edit profile
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-xl font-bold font-display text-slate-900">{pubProfile.full_name}</h2>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${personality.color}`}>
              {personality.emoji} {personality.label}
            </span>
          </div>
          {pubProfile.username && <p className="text-slate-400 text-sm">@{pubProfile.username}</p>}
          {pubProfile.bio      && <p className="text-slate-600 text-sm mt-1.5 mb-1">{pubProfile.bio}</p>}
          {pubProfile.home_city && (
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
              <MapPin size={12}/>{pubProfile.home_city}{pubProfile.home_country ? `, ${pubProfile.home_country}` : ''}
            </p>
          )}

          <div className="flex gap-6 sm:gap-8 border-t border-slate-100 pt-4 mt-4">
            {[
              { label:'Trips',     value: trips.length },
              { label:'Countries', value: allCountries.length || pubProfile.total_countries || 0 },
              { label:'Followers', value: pubProfile.follower_count  || 0 },
              { label:'Following', value: pubProfile.following_count || 0 },
            ].map(s=>(
              <div key={s.label} className="text-center">
                <div className="font-bold text-slate-900 text-lg font-display leading-tight">{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab nav ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
        {TABS.map(tab=>{
          const Icon=tab.icon
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
                const val = pubProfile[s.key] || 0
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
                  {[0,1,2].map(i=>(
                    <div key={i} className={`flex-1 h-1.5 rounded-full ${i<=(pubProfile.budget_style??1)?'bg-indigo-500':'bg-slate-200'}`}/>
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-700">{BUDGET_STYLES[pubProfile.budget_style??1]}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-2 font-semibold">🏃 Travel Pace</p>
                <div className="flex gap-1 mb-1.5">
                  {[0,1,2].map(i=>(
                    <div key={i} className={`flex-1 h-1.5 rounded-full ${i<=(pubProfile.travel_pace??1)?'bg-sky-500':'bg-slate-200'}`}/>
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-700">{TRAVEL_PACES[pubProfile.travel_pace??1]}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="card">
            <h3 className="font-bold text-slate-800 font-display text-base mb-4">📊 Travel Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label:'Total Trips',   value: trips.length,                                              emoji:'✈️' },
                { label:'Days Abroad',   value: stats.totalDays || pubProfile.total_days_travelled || 0,   emoji:'📅' },
                { label:'Countries',     value: allCountries.length || pubProfile.total_countries || 0,    emoji:'🌍' },
                { label:'Distance (km)', value: pubProfile.total_km ? Number(pubProfile.total_km).toLocaleString() : '—', emoji:'📏' },
                { label:'Longest Trip',  value: stats.longestDays ? `${stats.longestDays} days` : '—',    emoji:'🏅' },
                { label:'Fav Month',     value: stats.favMonth || '—',                                     emoji:'📆' },
              ].map(s=>(
                <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <div className="font-bold text-slate-900 font-display text-lg">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent public trips */}
          <div className="card">
            <h3 className="font-bold text-slate-800 font-display text-base mb-4">✈️ Trips</h3>
            {recentTrips.length===0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No public trips yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {recentTrips.map(trip=>(
                  <div key={trip.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-lg flex-shrink-0">✈️</div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{trip.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {trip.start_date ? format(new Date(trip.start_date),'MMM d') : '—'}
                        {trip.end_date   ? ` – ${format(new Date(trip.end_date),'MMM d, yyyy')}` : ''}
                      </p>
                      <span className={`badge text-xs mt-1 ${TRIP_STATUSES[trip.status]?.color||'bg-slate-100 text-slate-600'}`}>
                        {TRIP_STATUSES[trip.status]?.label||trip.status}
                      </span>
                    </div>
                  </div>
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
              <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full"
                style={{width:`${Math.min(100,(allCountries.length/195)*100)}%`}}/>
            </div>
            {allCountries.length===0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No countries listed yet.</p>
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

          {(pubProfile.bucket_list||[]).length > 0 && (
            <div className="card">
              <h3 className="font-bold text-slate-800 font-display text-base mb-4">⭐ Dream Destinations</h3>
              <div className="flex flex-wrap gap-2">
                {pubProfile.bucket_list.map((dest,i)=>(
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-800">
                    ⭐ {dest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Posts Tab ───────────────────────────────────────────────── */}
      {activeTab==='posts' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 font-display text-base">📸 Posts</h3>
            <span className="text-xs text-slate-400">{posts.length} posts</span>
          </div>
          {posts.length===0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📸</div>
              <p className="text-slate-500 text-sm">No public posts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map(post=>{
                const img = post.image_urls?.[0]
                return (
                  <div key={post.id} className="aspect-square rounded-lg overflow-hidden relative group bg-slate-100">
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
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
