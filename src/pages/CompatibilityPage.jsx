import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { calculateCompatibility, getCompatibilityMessage } from '../lib/compatibility'
import { Search, Users, MessageCircle, X, Loader2, ArrowRight, Download, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'

/* ── helpers ─────────────────────────────────────────────────────────── */

const GRADS = [
  'from-sky-400 to-indigo-500', 'from-violet-400 to-purple-600',
  'from-orange-400 to-rose-500', 'from-emerald-400 to-teal-600', 'from-pink-400 to-rose-600',
]
const gradFor = (name) => GRADS[(name?.charCodeAt(0) || 0) % GRADS.length]

const GRAD_BG = [
  ['#38bdf8','#6366f1'], ['#a78bfa','#9333ea'],
  ['#fb923c','#f43f5e'], ['#34d399','#14b8a6'], ['#f472b6','#f43f5e'],
]
const solidFor = (name) => GRAD_BG[(name?.charCodeAt(0) || 0) % GRAD_BG.length]

function Av({ p, size = 40, textSz = 16 }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}
      className={`rounded-full overflow-hidden bg-gradient-to-br ${gradFor(p?.full_name)} flex items-center justify-center text-white font-bold`}>
      {p?.avatar_url
        ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
        : <span style={{ fontSize: textSz }}>{p?.full_name?.[0]?.toUpperCase() || '?'}</span>}
    </div>
  )
}

/* ── Share card (captured by html2canvas) ────────────────────────────── */

function ShareCard({ me, other, compat }) {
  const [bg1, bg2] = solidFor(me?.full_name)
  const [bg3, bg4] = solidFor(other?.full_name)
  return (
    <div style={{
      width: 400, padding: 32, borderRadius: 24, fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
    }}>
      {/* Avatars + emoji */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
            border: '3px solid rgba(255,255,255,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: 'white',
          }}>
            {me?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600 }}>
            {me?.full_name?.split(' ')[0]}
          </span>
        </div>
        <span style={{ fontSize: 40 }}>{compat.emoji}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `linear-gradient(135deg, ${bg3}, ${bg4})`,
            border: '3px solid rgba(255,255,255,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: 'white',
          }}>
            {other?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600 }}>
            {other?.full_name?.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 56, fontWeight: 800, color: 'white', lineHeight: 1 }}>{compat.score}%</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8 }}>
        {compat.label}
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 24 }}>
        {getCompatibilityMessage(compat.score, other?.full_name?.split(' ')[0])}
      </div>

      {/* Top 3 factors */}
      {compat.factors.slice(0, 3).map(f => (
        <div key={f.name} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>{f.emoji} {f.name}</span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 700 }}>{f.score}/{f.max}</span>
          </div>
          <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3 }}>
            <div style={{
              width: `${(f.score / f.max) * 100}%`, height: '100%',
              backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 3,
            }} />
          </div>
        </div>
      ))}

      <div style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
        wanderwall.vercel.app
      </div>
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────────────────── */

export default function CompatibilityPage() {
  const { profile: me } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselect = searchParams.get('with')

  const [search,        setSearch]        = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selected,      setSelected]      = useState(null)
  const [compat,        setCompat]        = useState(null)
  const [topMatches,    setTopMatches]    = useState([])
  const [loadingTop,    setLoadingTop]    = useState(true)
  const [followingIds,  setFollowingIds]  = useState(new Set())
  const [fLoading,      setFLoading]      = useState(false)
  const [shareOpen,     setShareOpen]     = useState(false)
  const [downloading,   setDownloading]   = useState(false)

  const shareCardRef = useRef(null)
  const searchRef    = useRef(null)

  /* ── init ── */
  useEffect(() => {
    if (!me?.id) return
    const init = async () => {
      const [{ data: fData }, { data: profiles }] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', me.id),
        supabase.from('profiles').select('*').neq('id', me.id).limit(50),
      ])
      setFollowingIds(new Set((fData || []).map(f => f.following_id)))

      if (profiles?.length) {
        const ranked = profiles
          .map(p => ({ profile: p, ...calculateCompatibility(me, p) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
        setTopMatches(ranked)

        if (preselect) {
          const pre = profiles.find(p => p.id === preselect)
          if (pre) { setSelected(pre); setCompat(calculateCompatibility(me, pre)) }
          else {
            const { data } = await supabase.from('profiles').select('*').eq('id', preselect).single()
            if (data) { setSelected(data); setCompat(calculateCompatibility(me, data)) }
          }
        }
      }
      setLoadingTop(false)
    }
    init()
  }, [me?.id])

  /* ── debounced search ── */
  useEffect(() => {
    if (!search.trim() || !me?.id) { setSearchResults([]); return }
    setSearchLoading(true)
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('*')
        .ilike('full_name', `%${search}%`).neq('id', me.id).limit(10)
      setSearchResults(data || [])
      setSearchLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [search, me?.id])

  const selectUser = useCallback((p) => {
    setSelected(p)
    setCompat(calculateCompatibility(me, p))
    setSearch('')
    setSearchResults([])
  }, [me])

  /* ── follow ── */
  const handleFollow = async () => {
    if (!me?.id || !selected) return
    setFLoading(true)
    const isFollowing = followingIds.has(selected.id)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', selected.id)
      setFollowingIds(prev => { const n = new Set(prev); n.delete(selected.id); return n })
    } else {
      await supabase.from('follows').insert({ follower_id: me.id, following_id: selected.id })
      setFollowingIds(prev => new Set([...prev, selected.id]))
      try {
        const followerId = me.id
        await supabase.rpc('send_social_notification', {
          p_user_id: selected.id,
          p_title: `👤 ${me.full_name || 'Someone'} started following you`,
          p_message: 'They are now following your travel adventures!',
          p_action_url: `/profile/${followerId}`,
          p_data: { follower_id: followerId },
        })
      } catch {}
      toast.success(`Following ${selected.full_name?.split(' ')[0]}!`)
    }
    setFLoading(false)
  }

  /* ── download share card ── */
  const handleDownload = async () => {
    if (!shareCardRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2, useCORS: true, backgroundColor: null, logging: false,
      })
      const link = document.createElement('a')
      link.download = `travel-match-${selected?.username || selected?.full_name?.replace(/\s+/g, '-').toLowerCase() || 'share'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Image downloaded!')
    } catch {
      toast.error('Download failed — try a screenshot instead')
    }
    setDownloading(false)
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/compatibility?with=${selected?.id}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'))
  }

  const personality = (p) => {
    if (!p) return { label: 'Wanderer', emoji: '🗺️', color: 'bg-slate-100 text-slate-600' }
    const MAP = {
      'Adventure Seeker': { emoji: '⚡', color: 'bg-orange-100 text-orange-700' },
      'Foodie Explorer':  { emoji: '🍜', color: 'bg-yellow-100 text-yellow-700' },
      'Culture Vulture':  { emoji: '🎭', color: 'bg-violet-100 text-violet-700' },
      'Night Owl':        { emoji: '🌙', color: 'bg-indigo-100 text-indigo-700' },
      'Luxury Traveller': { emoji: '💎', color: 'bg-amber-100 text-amber-700' },
    }
    return MAP[p.travel_personality] || { label: 'Wanderer', emoji: '🗺️', color: 'bg-slate-100 text-slate-600' }
  }

  const DNA = [
    { key: 'adventure_score', emoji: '⚡', color: '#f97316' },
    { key: 'foodie_score',    emoji: '🍜', color: '#eab308' },
    { key: 'culture_score',   emoji: '🎭', color: '#8b5cf6' },
    { key: 'nightlife_score', emoji: '🌙', color: '#6366f1' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 text-white p-6 sm:p-10 relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
        <div className="relative text-center">
          <div className="text-5xl mb-3">🔥</div>
          <h1 className="text-2xl sm:text-4xl font-bold font-display mb-2">
            Find Your Perfect Travel Match
          </h1>
          <p className="text-white/75 text-sm sm:text-base max-w-lg mx-auto">
            Discover how compatible you are with other Wanderwall travellers based on your travel DNA
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_288px] gap-5 items-start">
        {/* ── Left: search + result ── */}
        <div className="space-y-5 min-w-0">

          {/* Search */}
          <div className="card relative" ref={searchRef}>
            <label className="label mb-2 block">Search travellers by name</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 pr-9"
                placeholder="Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {(search || searchLoading) && (
                <button onClick={() => { setSearch(''); setSearchResults([]) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {searchLoading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                </button>
              )}
            </div>

            {/* Results dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mx-5">
                {searchResults.map(p => {
                  const pers = personality(p)
                  return (
                    <button key={p.id} onClick={() => selectUser(p)}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                      <Av p={p} size={36} textSz={14} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{p.full_name}</p>
                        {p.username && <p className="text-xs text-slate-400">@{p.username}</p>}
                      </div>
                      {p.travel_personality && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pers.color}`}>
                          {pers.emoji} {p.travel_personality}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Compatibility Result */}
          {selected && compat && (
            <div className="card space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 font-display">Compatibility Result</h3>
                <button onClick={() => { setSelected(null); setCompat(null) }}
                  className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Avatars + score */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <Av p={me} size={56} textSz={20} />
                  <span className="text-xs font-semibold text-slate-600 text-center max-w-[80px] truncate">
                    {me?.full_name?.split(' ')[0]}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-4xl">{compat.emoji}</span>
                  <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
                    <svg className="absolute inset-0 -rotate-90" width="96" height="96">
                      <circle cx="48" cy="48" r="36" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                      <circle cx="48" cy="48" r="36" fill="none" stroke={compat.color} strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={226.2}
                        strokeDashoffset={226.2 - (compat.score / 100) * 226.2}
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                      />
                    </svg>
                    <span className="text-2xl font-bold font-display text-slate-900">{compat.score}%</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: compat.color }}>{compat.label}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <Av p={selected} size={56} textSz={20} />
                  <span className="text-xs font-semibold text-slate-600 text-center max-w-[80px] truncate">
                    {selected.full_name?.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Message */}
              <p className="text-center text-slate-500 text-sm italic">
                "{getCompatibilityMessage(compat.score, selected.full_name?.split(' ')[0])}"
              </p>

              {/* Factor bars */}
              <div className="space-y-3">
                {compat.factors.map(f => (
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600">{f.emoji} {f.name}</span>
                      <span className="text-xs font-bold text-slate-700">{f.score}/{f.max}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(f.score / f.max) * 100}%`, backgroundColor: compat.color }} />
                    </div>
                    {f.shared?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {f.shared.slice(0, 6).map((c, i) => (
                          <span key={i} className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 font-medium">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={handleFollow} disabled={fLoading}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    followingIds.has(selected.id)
                      ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md hover:shadow-lg'
                  }`}>
                  <Users size={14} />{fLoading ? '…' : followingIds.has(selected.id) ? 'Following' : 'Follow'}
                </button>
                <button onClick={() => navigate(`/messages/${selected.id}`)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all">
                  <MessageCircle size={14} />Message
                </button>
                <Link to={`/profile/${selected.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all">
                  View Profile
                </Link>
                <button onClick={() => setShareOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all">
                  📸 Share this match
                </button>
              </div>
            </div>
          )}

          {/* Placeholder when nothing selected */}
          {!selected && (
            <div className="card text-center py-10 border-2 border-dashed border-slate-200">
              <div className="text-5xl mb-3">🔍</div>
              <p className="font-semibold text-slate-700 mb-1">Search for a traveller above</p>
              <p className="text-slate-400 text-sm">Or pick from your top matches below</p>
            </div>
          )}
        </div>

        {/* ── Right: Your Profile Card ── */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-slate-800 font-display text-sm mb-4">Your Travel DNA</h3>
            <div className="flex items-center gap-3 mb-4">
              <Av p={me} size={44} textSz={16} />
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{me?.full_name}</p>
                {me?.username && <p className="text-xs text-slate-400">@{me.username}</p>}
              </div>
            </div>
            <div className="space-y-2.5">
              {DNA.map(d => (
                <div key={d.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{d.emoji}</span>
                    <span className="text-xs font-bold text-slate-600">{me?.[d.key] || 0}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${me?.[d.key] || 0}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
              <div>
                <div className="font-bold text-slate-800">{(me?.countries_visited || []).length}</div>
                <div className="text-slate-400">Countries</div>
              </div>
              <div>
                <div className="font-bold text-slate-800">{(me?.bucket_list || []).length}</div>
                <div className="text-slate-400">Dream spots</div>
              </div>
            </div>
          </div>

          <Link to="/profile"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
            Update your DNA →
          </Link>
        </div>
      </div>

      {/* ── Top Matches ─────────────────────────────────────────── */}
      <div>
        <h2 className="section-title mb-1">Your Top Matches</h2>
        <p className="text-slate-400 text-xs mb-4">Automatically ranked by travel compatibility</p>

        {loadingTop ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : topMatches.length === 0 ? (
          <div className="card text-center py-10">
            <div className="text-5xl mb-3">🌍</div>
            <p className="font-semibold text-slate-700 mb-1">No other travellers yet</p>
            <p className="text-slate-400 text-sm">Invite friends to discover travel compatibility!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topMatches.map(({ profile: p, score, label, emoji, color }) => (
              <div key={p.id}
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => selectUser(p)}>
                <div className="flex items-center gap-3 mb-3">
                  <Av p={p} size={44} textSz={16} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{p.full_name}</p>
                    {p.username && <p className="text-xs text-slate-400">@{p.username}</p>}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="font-bold text-lg font-display" style={{ color }}>{score}%</div>
                    <div className="text-base">{emoji}</div>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${score}%`, backgroundColor: color }} />
                </div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                {p.home_city && (
                  <p className="text-xs text-slate-400 mt-0.5">📍 {p.home_city}</p>
                )}
                <button
                  className="mt-3 flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                  Check compatibility <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Share Modal ──────────────────────────────────────────── */}
      {shareOpen && selected && compat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShareOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 font-display">Share Your Match</h3>
              <button onClick={() => setShareOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* The card to capture */}
            <div className="flex justify-center p-4 bg-slate-50">
              <div ref={shareCardRef}>
                <ShareCard me={me} other={selected} compat={compat} />
              </div>
            </div>

            <div className="p-4 space-y-2">
              <button onClick={handleDownload} disabled={downloading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm hover:shadow-md transition-all disabled:opacity-60">
                {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Download as Image
              </button>
              <button onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
                <Copy size={15} />Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
