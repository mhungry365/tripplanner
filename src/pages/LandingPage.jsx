import { Link } from 'react-router-dom'
import { ArrowRight, Map, Shield, Zap, Globe, Star, CheckCircle } from 'lucide-react'

const features = [
  { icon: Map, title: 'Smart Itineraries', desc: 'Day-by-day planning with activities, transport, and accommodation all linked together.', color: 'from-sky-400 to-sky-600' },
  { icon: Globe, title: 'Any Destination', desc: 'Plan trips to 200+ countries. Full timezone, currency, and local info built in.', color: 'from-indigo-400 to-indigo-600' },
  { icon: Zap, title: 'Instant Budget Tracking', desc: 'Real-time budget across all currencies. Know exactly what you\'re spending.', color: 'from-amber-400 to-orange-500' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your travel plans stay yours. Private by default, share only what you want.', color: 'from-emerald-400 to-teal-600' },
]

const destinations = [
  { emoji: '🇯🇵', name: 'Tokyo', country: 'Japan', tag: 'Trending' },
  { emoji: '🇫🇷', name: 'Paris', country: 'France', tag: 'Popular' },
  { emoji: '🇮🇩', name: 'Bali', country: 'Indonesia', tag: 'Trending' },
  { emoji: '🇮🇸', name: 'Reykjavik', country: 'Iceland', tag: 'Unique' },
  { emoji: '🇲🇦', name: 'Marrakech', country: 'Morocco', tag: 'Popular' },
  { emoji: '🇬🇷', name: 'Santorini', country: 'Greece', tag: 'Romantic' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
              <span className="text-lg">🌍</span>
            </div>
            <span className="text-xl font-bold font-display bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">Holidater</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors px-4 py-2">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm py-2">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6 text-center relative">
        <div className="absolute inset-0 bg-gradient-soft opacity-60 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Star size={12} className="fill-current" /> Trip planning, reimagined
          </div>
          <h1 className="text-6xl lg:text-7xl font-bold font-display text-slate-900 leading-tight mb-6">
            Your Journey.<br />
            <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 bg-clip-text text-transparent">
              Your Story.
            </span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            The ultimate trip planner for modern travellers. Build beautiful itineraries, track budgets, discover destinations — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base py-3 px-8">
              Start planning free <ArrowRight size={18} />
            </Link>
            <Link to="/explore" className="btn-secondary inline-flex items-center gap-2 text-base py-3 px-8">
              Explore destinations
            </Link>
          </div>
          <p className="text-sm text-slate-400 mt-4">No credit card required · Free forever</p>
        </div>

        {/* Floating destination cards */}
        <div className="relative max-w-5xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {destinations.map((d, i) => (
            <div key={d.name}
              className="card-hover p-4 text-center animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-3xl mb-2">{d.emoji}</div>
              <div className="text-sm font-bold text-slate-800">{d.name}</div>
              <div className="text-xs text-slate-400">{d.country}</div>
              <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 text-[10px] font-bold">{d.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold font-display text-slate-900 mb-4">Everything you need to travel smarter</h2>
            <p className="text-slate-500 text-lg">Built by travellers, for travellers.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="card text-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mx-auto mb-4 shadow-md`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2 font-display">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-6 animate-float">🌍</div>
          <h2 className="text-4xl font-bold font-display mb-4">Ready for your next adventure?</h2>
          <p className="text-white/70 text-lg mb-8">Join thousands of travellers planning their dream trips on Holidater.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all shadow-lg text-base">
            Create free account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-10 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xl">🌍</span>
          <span className="font-bold font-display text-lg">Holidater</span>
        </div>
        <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Holidater. Travel. Experience. Remember.</p>
      </footer>
    </div>
  )
}
