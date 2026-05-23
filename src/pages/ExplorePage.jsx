import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Star, X, Calendar, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

const CONTINENTS = [
  { key: 'all',      label: 'All' },
  { key: 'Asia',     label: 'Asia' },
  { key: 'Europe',   label: 'Europe' },
  { key: 'Americas', label: 'Americas' },
  { key: 'Oceania',  label: 'Oceania' },
  { key: 'Africa',   label: 'Africa' },
]

const CONTINENT_GRADIENT = {
  Asia:         'linear-gradient(135deg, #f97316, #dc2626)',
  Europe:       'linear-gradient(135deg, #3b82f6, #6d28d9)',
  Americas:     'linear-gradient(135deg, #10b981, #0891b2)',
  Africa:       'linear-gradient(135deg, #f59e0b, #ea580c)',
  Oceania:      'linear-gradient(135deg, #06b6d4, #2563eb)',
  'Middle East':'linear-gradient(135deg, #d97706, #dc2626)',
  default:      'linear-gradient(135deg, #6366f1, #8b5cf6)',
}

function StarRating({ rating, white = false }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11}
          className={i <= rating
            ? 'fill-amber-400 text-amber-400'
            : white ? 'text-white/30' : 'text-slate-300'
          }
        />
      ))}
    </div>
  )
}

export default function ExplorePage() {
  const [destinations, setDestinations] = useState([])
  const [search, setSearch] = useState('')
  const [continent, setContinent] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const fetchDests = async () => {
      setLoading(true)
      let q = supabase.from('destinations').select('id,city,country_name,continent,flag_emoji,description,cover_image_url,budget_level,safety_rating,popularity_score,best_months,visa_required').order('popularity_score', { ascending: false })
      if (continent !== 'all') q = q.eq('continent', continent)
      if (search) q = q.or(`city.ilike.%${search}%,country_name.ilike.%${search}%`)
      const { data } = await q.limit(20)
      setDestinations(data || [])
      setLoading(false)
    }
    fetchDests()
  }, [search, continent])

  const trendingIds = new Set(destinations.slice(0, 5).map(d => d.id))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Explore Destinations</h1>
        <p className="text-slate-500 text-sm mt-1">Discover your next adventure</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Search cities or countries..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Continent tabs */}
      <div className="flex gap-2 flex-wrap">
        {CONTINENTS.map(c => (
          <button key={c.key} onClick={() => setContinent(c.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
              ${continent === c.key
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 shimmer rounded-2xl" />
          ))}
        </div>
      ) : destinations.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🌍</div>
          <p className="text-slate-500 font-medium">No destinations found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {destinations.map(d => (
            <button key={d.id} onClick={() => setSelected(d)}
              className="relative h-64 rounded-2xl overflow-hidden group cursor-pointer text-left shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: d.cover_image_url
                    ? `url(${d.cover_image_url})`
                    : (CONTINENT_GRADIENT[d.continent] || CONTINENT_GRADIENT.default),
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {trendingIds.has(d.id) && (
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
                  <TrendingUp size={10} /> Trending
                </div>
              )}

              <div className="absolute top-3 right-3 text-2xl drop-shadow-md">
                {d.flag_emoji}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="text-white font-bold text-lg font-display leading-tight">{d.city}</div>
                <div className="text-white/70 text-sm mb-2">{d.country_name}</div>
                <div className="flex items-center justify-between">
                  <StarRating rating={d.safety_rating} white />
                  <span className="text-white/90 text-xs font-semibold bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    ${d.avg_daily_budget_usd}/day
                  </span>
                </div>
                {d.best_months?.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {d.best_months.slice(0, 2).map(m => (
                      <span key={m} className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Destination modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            {/* Hero */}
            <div className="relative h-56 sm:h-72 flex-shrink-0">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: selected.cover_image_url
                    ? `url(${selected.cover_image_url})`
                    : (CONTINENT_GRADIENT[selected.continent] || CONTINENT_GRADIENT.default),
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-5">
                <div className="text-4xl mb-1">{selected.flag_emoji}</div>
                <h2 className="text-3xl font-bold font-display text-white">{selected.city}</h2>
                <p className="text-white/80 text-sm">{selected.country_name} · {selected.continent}</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {selected.description && (
                <p className="text-slate-600 leading-relaxed">{selected.description}</p>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold font-display text-slate-900">${selected.avg_daily_budget_usd}</div>
                  <div className="text-xs text-slate-500 mt-0.5">avg/day</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="flex justify-center mb-1">
                    <StarRating rating={selected.safety_rating} />
                  </div>
                  <div className="text-xs text-slate-500">safety</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold font-display text-slate-900">{selected.popularity_score}</div>
                  <div className="text-xs text-slate-500 mt-0.5">popularity</div>
                </div>
              </div>

              {selected.best_months?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Calendar size={14} /> Best time to visit
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.best_months.map(m => (
                      <span key={m} className="text-sm bg-sky-50 text-sky-700 font-medium px-3 py-1 rounded-full">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap text-sm">
                {selected.visa_required && (
                  <span className="bg-amber-50 text-amber-700 font-medium px-3 py-1 rounded-full">Visa required</span>
                )}
                {selected.currency_code && (
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                    {selected.currency_code} {selected.currency_symbol}
                  </span>
                )}
                {selected.language && (
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{selected.language}</span>
                )}
              </div>

              <Link to="/trips/new" onClick={() => setSelected(null)}
                className="block w-full btn-primary text-center py-3 text-base font-bold rounded-xl">
                ✈️ Plan a trip here
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
