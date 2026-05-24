import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Tag, ExternalLink, CheckCircle, Loader2, Users, ShieldCheck, Star, Award } from 'lucide-react'
import toast from 'react-hot-toast'

const DEALS = [
  {
    emoji: '🏨', category: 'Hotels',
    bg: 'bg-blue-50', iconBg: 'bg-blue-600',
    brand: 'Booking.com', brandColor: 'text-blue-700',
    title: 'Up to 20% off selected hotels',
    description: 'Genius members save instantly on millions of properties worldwide. No promo code needed.',
    badge: 'Save up to €50', badgeColor: 'bg-blue-100 text-blue-700',
    validUntil: '31 Dec 2025', url: 'https://www.booking.com/deals.html', exclusive: true,
  },
  {
    emoji: '🎒', category: 'Hotels',
    bg: 'bg-purple-50', iconBg: 'bg-purple-600',
    brand: 'Hostelworld', brandColor: 'text-purple-700',
    title: '10% off hostels worldwide',
    description: 'Book any hostel globally and save 10%. Perfect for budget travellers and backpackers.',
    badge: 'Save up to €15', badgeColor: 'bg-purple-100 text-purple-700',
    validUntil: '30 Jun 2025', url: 'https://www.hostelworld.com/deals', exclusive: false,
  },
  {
    emoji: '✈️', category: 'Flights',
    bg: 'bg-cyan-50', iconBg: 'bg-cyan-600',
    brand: 'Skyscanner', brandColor: 'text-cyan-700',
    title: 'Find cheapest flight days',
    description: 'Use the price calendar to find the cheapest days to fly. Save hundreds on flexible dates.',
    badge: 'Save up to €200', badgeColor: 'bg-cyan-100 text-cyan-700',
    validUntil: 'Ongoing', url: 'https://www.skyscanner.net/tips-and-inspiration/best-time-to-book', exclusive: false,
  },
  {
    emoji: '🏠', category: 'Hotels',
    bg: 'bg-rose-50', iconBg: 'bg-rose-500',
    brand: 'Airbnb', brandColor: 'text-rose-600',
    title: 'Save on your first stay',
    description: 'New to Airbnb? Get a discount on your first booking when you sign up through Holidater.',
    badge: 'Save up to €40', badgeColor: 'bg-rose-100 text-rose-600',
    validUntil: '31 Dec 2025', url: 'https://www.airbnb.com/c/refer', exclusive: true,
  },
  {
    emoji: '🎭', category: 'Experiences',
    bg: 'bg-orange-50', iconBg: 'bg-orange-500',
    brand: 'GetYourGuide', brandColor: 'text-orange-600',
    title: '10% off tours & experiences',
    description: 'Discover amazing tours, activities and experiences. Book in advance and save 10%.',
    badge: 'Save up to €30', badgeColor: 'bg-orange-100 text-orange-600',
    validUntil: '30 Sep 2025', url: 'https://www.getyourguide.com', exclusive: false,
  },
  {
    emoji: '🚗', category: 'Transport',
    bg: 'bg-slate-50', iconBg: 'bg-slate-700',
    brand: 'Rentalcars.com', brandColor: 'text-slate-700',
    title: '15% off car rentals',
    description: 'Compare hundreds of car rental companies and save 15% on your first booking.',
    badge: 'Save up to €25', badgeColor: 'bg-slate-100 text-slate-700',
    validUntil: '31 Aug 2025', url: 'https://www.rentalcars.com', exclusive: true,
  },
  {
    emoji: '🛡️', category: 'Insurance',
    bg: 'bg-emerald-50', iconBg: 'bg-emerald-600',
    brand: 'TravelInsurance.ie', brandColor: 'text-emerald-700',
    title: 'Compare travel insurance',
    description: 'Get the best travel insurance deal for your trip. Compare top providers in seconds.',
    badge: 'Best prices', badgeColor: 'bg-emerald-100 text-emerald-700',
    validUntil: 'Ongoing', url: 'https://www.travelinsurance.ie', exclusive: false,
  },
  {
    emoji: '🗺️', category: 'Experiences',
    bg: 'bg-amber-50', iconBg: 'bg-amber-500',
    brand: 'Viator', brandColor: 'text-amber-700',
    title: 'Tours from €10',
    description: 'Thousands of tours and activities starting from just €10. Book with free cancellation.',
    badge: 'From €10', badgeColor: 'bg-amber-100 text-amber-700',
    validUntil: 'Ongoing', url: 'https://www.viator.com', exclusive: false,
  },
]

const CATEGORIES = ['All', 'Hotels', 'Flights', 'Experiences', 'Transport', 'Insurance']

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'Verified deals',         color: 'text-emerald-600' },
  { icon: Star,        label: 'Best price guarantee',   color: 'text-amber-500' },
  { icon: Award,       label: 'Secure booking',         color: 'text-sky-600' },
]

const EMPTY_FORM = {
  business_name: '', contact_email: '', website: '',
  deal_description: '', discount_percentage: '', valid_until: '',
}

export default function DealsPage() {
  const [category,      setCategory]      = useState('All')
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [submitting,    setSubmitting]    = useState(false)
  const [submitted,     setSubmitted]     = useState(false)
  const [partnerDeals,  setPartnerDeals]  = useState([])

  useEffect(() => {
    supabase.from('partner_deals')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => setPartnerDeals(data || []))
  }, [])

  const filtered = category === 'All' ? DEALS : DEALS.filter(d => d.category === category)
  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.business_name.trim() || !form.contact_email.trim() || !form.deal_description.trim()) {
      toast.error('Please fill in the required fields')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('partner_deals').insert({
      business_name:       form.business_name.trim(),
      contact_email:       form.contact_email.trim(),
      website:             form.website.trim() || null,
      deal_description:    form.deal_description.trim(),
      discount_percentage: form.discount_percentage ? parseInt(form.discount_percentage) : null,
      valid_until:         form.valid_until || null,
      status:              'pending',
    })
    setSubmitting(false)
    if (error) { toast.error('Failed to submit. Please try again.'); return }
    setSubmitted(true)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="max-w-5xl space-y-8 sm:space-y-10 animate-fade-in">

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-white text-center relative overflow-hidden w-full">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative w-full">
          <div className="text-3xl sm:text-5xl mb-3">🎉</div>
          <h1 className="text-xl sm:text-3xl font-bold font-display mb-2 break-words">Exclusive Travel Deals</h1>
          <p className="text-white/80 text-xs sm:text-base mb-4 max-w-lg mx-auto">
            Book through Holidater and save on hotels, flights and experiences
          </p>
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/25 rounded-full px-3 py-2 max-w-full">
            <Users size={13} className="text-white/80 flex-shrink-0" />
            <span className="text-xs font-semibold text-white truncate">Join 10,000+ travellers saving with Holidater deals</span>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {TRUST_BADGES.map(b => {
          const Icon = b.icon
          return (
            <div key={b.label} className="card text-center py-3 sm:py-5 px-1 sm:px-2">
              <Icon size={20} className={`${b.color} mx-auto mb-1.5`} />
              <p className="text-[10px] sm:text-sm font-semibold text-slate-700 leading-tight">{b.label}</p>
            </div>
          )
        })}
      </div>

      {/* Featured Partner Deals (from Supabase) */}
      {partnerDeals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-slate-900 font-display">Featured Partner Deals</span>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{partnerDeals.length} live</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {partnerDeals.map(deal => (
              <div key={deal.id} className="relative rounded-2xl border border-emerald-100 overflow-hidden bg-emerald-50 shadow-sm hover:shadow-md transition-all">
                <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide z-10">
                  Partner
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl flex-shrink-0">🤝</div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{deal.business_name}</p>
                      {deal.discount_percentage && (
                        <p className="text-sm font-bold text-slate-800">{deal.discount_percentage}% off</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed line-clamp-3">{deal.deal_description}</p>
                  <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                    {deal.discount_percentage && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">Save {deal.discount_percentage}%</span>
                    )}
                    {deal.valid_until && (
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        Until {new Date(deal.valid_until).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  {deal.website ? (
                    <a href={deal.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors min-h-[44px]">
                      Book Now <ExternalLink size={13} />
                    </a>
                  ) : (
                    <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-500 min-h-[44px]">
                      Contact for details
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm font-bold text-slate-700 font-display">Curated Deals</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all min-h-[44px] ${
                category === c
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Deals grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(deal => (
          <div key={deal.brand} className={`relative rounded-2xl border border-slate-100 overflow-hidden ${deal.bg} shadow-sm hover:shadow-md transition-all`}>
            {deal.exclusive && (
              <div className="absolute top-3 right-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide z-10">
                Exclusive
              </div>
            )}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${deal.iconBg} flex items-center justify-center text-xl flex-shrink-0`}>
                  {deal.emoji}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-wide ${deal.brandColor}`}>{deal.brand}</p>
                  <p className="text-sm font-bold text-slate-800 leading-tight line-clamp-1">{deal.title}</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed line-clamp-3">{deal.description}</p>

              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${deal.badgeColor}`}>{deal.badge}</span>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">Until {deal.validUntil}</span>
              </div>

              <a href={deal.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm min-h-[44px]">
                Book Now <ExternalLink size={13} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-slate-500 font-semibold">No deals in this category yet</p>
          <p className="text-slate-400 text-sm mt-1">Check back soon!</p>
        </div>
      )}

      {/* Partner with us */}
      <div className="card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg mb-4">
            <Tag size={24} className="text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mb-2">Are you a hotel or business?</h2>
          <h3 className="text-base font-semibold text-indigo-600 mb-3">Partner with Holidater</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Reach thousands of travellers planning their next trip. List your exclusive deal and grow your bookings.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Deal submitted!</h3>
            <p className="text-slate-500 text-sm">Thanks! We'll review your deal and get back to you within 24 hours.</p>
            <button onClick={() => setSubmitted(false)}
              className="mt-5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
              Submit another deal
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Business name <span className="text-red-400">*</span></label>
                <input className="input" placeholder="Acme Hotels" value={form.business_name} onChange={set('business_name')} />
              </div>
              <div>
                <label className="label">Contact email <span className="text-red-400">*</span></label>
                <input className="input" type="email" placeholder="hello@yourhotel.com" value={form.contact_email} onChange={set('contact_email')} />
              </div>
            </div>
            <div>
              <label className="label">Website</label>
              <input className="input" placeholder="https://www.yourhotel.com" value={form.website} onChange={set('website')} />
            </div>
            <div>
              <label className="label">Deal description <span className="text-red-400">*</span></label>
              <textarea className="input resize-none" rows={3} placeholder="Describe your deal, what travellers get, and any conditions..." value={form.deal_description} onChange={set('deal_description')} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Discount (%)</label>
                <input className="input" type="number" min="1" max="100" placeholder="e.g. 20" value={form.discount_percentage} onChange={set('discount_percentage')} />
              </div>
              <div>
                <label className="label">Valid until</label>
                <input className="input" type="date" value={form.valid_until} onChange={set('valid_until')} />
              </div>
            </div>
            <button type="submit" disabled={submitting}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60 min-h-[48px]">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
              {submitting ? 'Submitting…' : 'Submit Your Deal'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
