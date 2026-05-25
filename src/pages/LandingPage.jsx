import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Map, Shield, Zap, Globe, Star, CheckCircle,
  Bot, Plane, Users, Wallet, Compass, BookOpen,
  Instagram, Twitter, Facebook, ChevronDown, Menu, X,
  TrendingUp, Award, Heart
} from 'lucide-react'

const NAV_LINKS = [
  { label: 'Home',    href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Deals',   href: '#deals' },
  { label: 'About',   href: '#about' },
]

const HOW_IT_WORKS = [
  { num: '01', icon: Map,     title: 'Create your trip',     desc: 'Name your destination, set dates and budget. Takes 30 seconds.' },
  { num: '02', icon: Compass, title: 'Plan every detail',    desc: 'Add flights, hotels, activities and notes day-by-day.' },
  { num: '03', icon: Heart,   title: 'Share & inspire',      desc: 'Publish your trip to inspire other travellers in the community.' },
]

const FEATURES = [
  { icon: Bot,      color: 'from-violet-500 to-indigo-600', title: 'AI Travel Assistant',    desc: 'Ask anything — visa info, best time to visit, budget tips. Powered by Gemini.' },
  { icon: Map,      color: 'from-sky-500 to-cyan-600',      title: 'Smart Itineraries',      desc: 'Day-by-day planning with activities, transport and accommodation linked.' },
  { icon: Plane,    color: 'from-blue-500 to-indigo-600',   title: 'Flight & Hotel Search',  desc: 'Compare prices across Google Flights, Skyscanner, Kayak and more.' },
  { icon: Users,    color: 'from-pink-500 to-rose-600',     title: 'Travel Community',       desc: 'Share trip stories, photos and tips with thousands of travellers.' },
  { icon: Wallet,   color: 'from-amber-500 to-orange-600',  title: 'Budget Tracker',         desc: 'Multi-currency budget tracking. Know exactly what you\'re spending.' },
  { icon: Globe,    color: 'from-emerald-500 to-teal-600',  title: 'Destination Guides',     desc: '200+ destinations with safety ratings, local tips and currency info.' },
]

const DESTINATIONS = [
  { city: 'Tokyo',     country: 'Japan',       emoji: '🇯🇵', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80', tag: 'Trending' },
  { city: 'Paris',     country: 'France',      emoji: '🇫🇷', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80', tag: 'Popular' },
  { city: 'Bali',      country: 'Indonesia',   emoji: '🇮🇩', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80', tag: 'Trending' },
  { city: 'Santorini', country: 'Greece',      emoji: '🇬🇷', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80', tag: 'Romantic' },
  { city: 'New York',  country: 'USA',         emoji: '🇺🇸', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80', tag: 'Popular' },
  { city: 'Kyoto',     country: 'Japan',       emoji: '🇯🇵', img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80', tag: 'Culture' },
  { city: 'Iceland',   country: 'Reykjavik',   emoji: '🇮🇸', img: 'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=400&q=80', tag: 'Unique' },
  { city: 'Marrakech', country: 'Morocco',     emoji: '🇲🇦', img: 'https://images.unsplash.com/photo-1597212720158-b9f99d9100f3?w=400&q=80', tag: 'Exotic' },
]

const TOP_DEALS = [
  { emoji: '🏨', brand: 'Booking.com',  title: 'Up to 20% off hotels',       badge: 'Save €50',  url: 'https://www.booking.com/deals.html',  color: 'border-blue-200 bg-blue-50', text: 'text-blue-700' },
  { emoji: '🎒', brand: 'Hostelworld',  title: '10% off hostels worldwide',   badge: 'Save €15',  url: 'https://www.hostelworld.com/deals',    color: 'border-purple-200 bg-purple-50', text: 'text-purple-700' },
  { emoji: '🎭', brand: 'GetYourGuide', title: '10% off tours & experiences', badge: 'Save €30',  url: 'https://www.getyourguide.com',         color: 'border-orange-200 bg-orange-50', text: 'text-orange-700' },
]

const TESTIMONIALS = [
  { name: 'Sarah M.',    country: '🇮🇪 Dublin',   rating: 5, avatar: '👩‍🦱', quote: 'Wanderwall completely changed how I plan trips. The AI assistant gave me a perfect 2-week Japan itinerary in minutes. Absolutely love it!' },
  { name: 'Marco R.',   country: '🇮🇹 Milan',    rating: 5, avatar: '👨‍🦲', quote: 'The budget tracker alone is worth it. I saved over €300 on my Bali trip by comparing hotels and flights directly through the app.' },
  { name: 'Aisha K.',   country: '🇳🇬 Lagos',    rating: 5, avatar: '👩🏾‍💼', quote: 'I\'ve tried every travel app out there. Wanderwall is the only one that feels like it was actually made by someone who travels.' },
]

const STATS = [
  { value: '10,000+', label: 'Trips planned' },
  { value: '150+',    label: 'Destinations' },
  { value: '50+',     label: 'Partner deals' },
  { value: '4.9★',    label: 'User rating' },
]

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow">
              <span className="text-lg">🌍</span>
            </div>
            <span className="text-xl font-bold font-display bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">Wanderwall</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login"    className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-5">Get started free</Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-1 shadow-lg">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="block py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors min-h-[44px] flex items-center">
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link to="/login"    onClick={() => setMobileOpen(false)} className="block w-full text-center py-3 px-4 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Sign in</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary block w-full text-center text-sm py-3">Get started free</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section id="home" className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 px-4 sm:px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-100 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-300/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-sky-200 text-sky-700 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm">
            <Star size={11} className="fill-amber-400 text-amber-400" /> Voted #1 trip planner 2025
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display text-slate-900 leading-[1.1] mb-6">
            Your Journey.<br />
            <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Your Story.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed px-2">
            Plan unforgettable trips, discover hidden gems, and share your adventures with a community of passionate travellers.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link to="/register" className="btn-primary inline-flex items-center justify-center gap-2 text-base py-3.5 px-8 min-h-[52px]">
              Start Planning Free <ArrowRight size={18} />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center gap-2 text-base py-3.5 px-8 min-h-[52px] border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all">
              How it works
            </a>
          </div>
          <p className="text-xs text-slate-400">No credit card required · Free forever</p>
        </div>

        {/* Destination cards */}
        <div className="relative max-w-5xl mx-auto mt-12 w-full overflow-x-auto pb-2 px-4">
          <div className="flex gap-3 sm:grid sm:grid-cols-3 md:grid-cols-6 min-w-max sm:min-w-0">
            {DESTINATIONS.slice(0, 6).map((d, i) => (
              <div key={d.city}
                className="bg-white/90 backdrop-blur border border-slate-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 w-32 sm:w-auto flex-shrink-0"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-2xl mb-1">{d.emoji}</div>
                <div className="text-sm font-bold text-slate-800">{d.city}</div>
                <div className="text-xs text-slate-400 mb-1.5">{d.country}</div>
                <div className="inline-block px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 text-[10px] font-bold">{d.tag}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <a href="#how-it-works" className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors animate-bounce">
          <span className="text-xs font-medium">Scroll</span>
          <ChevronDown size={18} />
        </a>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 mb-3">How Wanderwall works</h2>
            <p className="text-slate-500 text-base sm:text-lg">Plan your perfect trip in 3 simple steps</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {HOW_IT_WORKS.map(step => {
              const Icon = step.icon
              return (
                <div key={step.num} className="text-center group">
                  <div className="relative inline-flex mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:-translate-y-1 transition-all">
                      <Icon size={28} className="text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-display text-slate-800 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 mb-3">Everything you need to travel smarter</h2>
            <p className="text-slate-500 text-base sm:text-lg">Built by travellers, for travellers.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-md`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2 font-display text-base">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS SHOWCASE ──────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 mb-2">Trending destinations</h2>
              <p className="text-slate-500">Where travellers are going right now</p>
            </div>
            <Link to="/register" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors whitespace-nowrap">
              Explore all <ArrowRight size={14} />
            </Link>
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {DESTINATIONS.map(d => (
              <div key={d.city}
                className="relative h-52 sm:h-64 w-44 sm:w-56 flex-shrink-0 rounded-2xl overflow-hidden group shadow-sm hover:shadow-lg transition-all snap-start">
                <img src={d.img} alt={d.city}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/25">
                    {d.tag}
                  </span>
                </div>
                <div className="absolute bottom-4 left-3 right-3">
                  <div className="text-white font-bold font-display leading-tight">{d.city}</div>
                  <div className="text-white/70 text-xs">{d.emoji} {d.country}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEALS ──────────────────────────────────────────────────── */}
      <section id="deals" className="py-20 px-4 sm:px-6 bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-3">Exclusive travel deals</h2>
            <p className="text-white/75 text-base sm:text-lg">Members-only savings on hotels, flights and experiences</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {TOP_DEALS.map(d => (
              <a key={d.brand} href={d.url} target="_blank" rel="noopener noreferrer"
                className="bg-white rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="text-3xl mb-3">{d.emoji}</div>
                <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${d.text}`}>{d.brand}</p>
                <p className="text-slate-800 font-bold text-sm mb-3">{d.title}</p>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${d.color} ${d.text}`}>{d.badge}</span>
              </a>
            ))}
          </div>

          <div className="text-center">
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-7 py-3 rounded-xl hover:bg-white/90 transition-all shadow-lg text-sm">
              View all deals <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 mb-3">Loved by travellers</h2>
            <p className="text-slate-500">See what our community says</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-all">
                <div className="flex items-center gap-0.5 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} className={i <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-xl flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────── */}
      <section id="about" className="py-16 px-4 sm:px-6 bg-gradient-to-r from-sky-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-bold font-display mb-1">{s.value}</div>
                <div className="text-white/70 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-5 animate-float">🌍</div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">Ready for your next adventure?</h2>
          <p className="text-white/60 text-base sm:text-lg mb-8">Join thousands of travellers planning dream trips on Wanderwall. Free forever.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:from-sky-600 hover:to-indigo-700 transition-all shadow-lg text-base">
            Create free account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-white pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-lg">🌍</span>
                </div>
                <span className="text-lg font-bold font-display">Wanderwall</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">Travel. Experience. Remember.</p>
              <div className="flex gap-3">
                {[
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Twitter,   label: 'Twitter/X' },
                  { icon: Facebook,  label: 'Facebook' },
                ].map(s => {
                  const Icon = s.icon
                  return (
                    <a key={s.label} href="#" aria-label={s.label}
                      className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                      <Icon size={16} className="text-slate-300" />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-bold mb-4 text-slate-200">Product</h4>
              <ul className="space-y-2.5">
                {['Features', 'Deals', 'Explore', 'Download App'].map(l => (
                  <li key={l}><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold mb-4 text-slate-200">Company</h4>
              <ul className="space-y-2.5">
                {['About', 'Blog', 'Careers', 'Press'].map(l => (
                  <li key={l}><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-bold mb-4 text-slate-200">Support</h4>
              <ul className="space-y-2.5">
                <li><Link to="/support"  className="text-slate-400 hover:text-white text-sm transition-colors">Help Center</Link></li>
                <li><a href="#"          className="text-slate-400 hover:text-white text-sm transition-colors">Contact Us</a></li>
                <li><Link to="/privacy"  className="text-slate-400 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms"    className="text-slate-400 hover:text-white text-sm transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© {new Date().getFullYear()} Wanderwall Ltd. All rights reserved. Made with ❤️ in Dublin, Ireland.</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link to="/terms"   className="hover:text-slate-300 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
