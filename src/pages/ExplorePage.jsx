import { useState, useEffect } from 'react'
import { Search, MapPin, Globe, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ExplorePage() {
  const [destinations, setDestinations] = useState([])
  const [search, setSearch] = useState('')
  const [continent, setContinent] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDests = async () => {
      let q = supabase.from('destinations').select('*').order('popularity_score', { ascending: false })
      if (continent !== 'all') q = q.eq('continent', continent)
      if (search) q = q.or(`city.ilike.%${search}%,country_name.ilike.%${search}%`)
      const { data } = await q.limit(20)
      setDestinations(data || [])
      setLoading(false)
    }
    fetchDests()
  }, [search, continent])

  const continents = ['all','Asia','Europe','Americas','Oceania','Africa','Middle East']

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Explore Destinations</h1>
        <p className="text-slate-500 text-sm mt-1">Discover your next adventure</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search cities or countries..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={continent} onChange={e => setContinent(e.target.value)}>
          {continents.map(c => <option key={c} value={c}>{c === 'all' ? 'All continents' : c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-48 shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {destinations.map(d => (
            <div key={d.id} className="card-hover overflow-hidden p-0">
              <div className="h-28 bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600 flex items-center justify-center text-5xl relative">
                {d.flag_emoji || '🌍'}
                {d.safety_rating >= 5 && (
                  <span className="absolute top-2 right-2 bg-white/20 backdrop-blur text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star size={10} className="fill-current" /> Top
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="font-bold text-slate-900 font-display">{d.city}</div>
                <div className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                  <MapPin size={12} /> {d.country_name}
                </div>
                {d.description && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{d.description}</p>}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-600 font-semibold">{d.currency_symbol} {d.avg_daily_budget_usd || '—'}/day</span>
                  <span className="text-slate-400">{d.timezone?.split('/')[1]?.replace('_',' ')}</span>
                </div>
                {d.best_months?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {d.best_months.slice(0,3).map(m => (
                      <span key={m} className="text-[10px] bg-sky-50 text-sky-600 font-semibold px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
