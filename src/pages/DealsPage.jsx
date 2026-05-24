import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Tag, ExternalLink, CheckCircle, Loader2, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const DEALS = [
  {
    emoji: '🏨',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-600',
    brand: 'Booking.com',
    brandColor: 'text-blue-700',
    title: 'Up to 20% off selected hotels',
    description: 'Genius members save instantly on millions of properties worldwide. No promo code needed.',
    badge: 'Save up to €50',
    badgeColor: 'bg-blue-100 text-blue-700',
    validUntil: '31 Dec 2025',
    url: 'https://www.booking.com/deals.html',
    exclusive: true,
  },
  {
    emoji: '🎒',
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-600',
    brand: 'Hostelworld',
    brandColor: 'text-purple-700',
    title: '10% off hostels worldwide',
    description: 'Book any hostel globally and save 10%. Perfect for budget travellers and backpackers.',
    badge: 'Save up to €15',
    badgeColor: 'bg-purple-100 text-purple-700',
    validUntil: '30 Jun 2025',
    url: 'https://www.hostelworld.com/deals',
    exclusive: false,
  },
  {
    emoji: '✈️',
    bg: 'bg-cyan-50',
    iconBg: 'bg-cyan-600',
    brand: 'Skyscanner',
    brandColor: 'text-cyan-700',
    title: 'Find cheapest flight days',
    description: 'Use the price calendar to find the cheapest days to fly. Save hundreds on flexible dates.',
    badge: 'Save up to €200',
    badgeColor: 'bg-cyan-100 text-cyan-700',
    validUntil: 'Ongoing',
    url: 'https://www.skyscanner.net/tips-and-inspiration/best-time-to-book',
    exclusive: false,
  },
  {
    emoji: '🏠',
    bg: 'bg-rose-50',
    iconBg: 'bg-rose-500',
    brand: 'Airbnb',
    brandColor: 'text-rose-600',
    title: 'Save on your first stay',
    description: 'New to Airbnb? Get a discount on your first booking when you sign up through Holidater.',
    badge: 'Save up to €40',
    badgeColor: 'bg-rose-100 text-rose-600',
    validUntil: '31 Dec 2025',
    url: 'https://www.airbnb.com/c/refer',
    exclusive: true,
  },
  {
    emoji: '🎭',
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-500',
    brand: 'GetYourGuide',
    brandColor: 'text-orange-600',
    title: '10% off tours & experiences',
    description: 'Discover amazing tours, activities and experiences. Book in advance and save 10%.',
    badge: 'Save up to €30',
    badgeColor: 'bg-orange-100 text-orange-600',
    validUntil: '30 Sep 2025',
    url: 'https://www.getyourguide.com',
    exclusive: false,
  },
  {
    emoji: '🚗',
    bg: 'bg-slate-50',
    iconBg: 'bg-slate-700',
    brand: 'Rentalcars.com',
    brandColor: 'text-slate-700',
    title: '15% off car rentals',
    description: 'Compare hundreds of car rental companies and save 15% on your first booking.',
    badge: 'Save up to €25',
    badgeColor: 'bg-slate-100 text-slate-700',
    validUntil: '31 Aug 2025',
    url: 'https://www.rentalcars.com',
    exclusive: true,
  },
  {
    emoji: '🛡️',
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-600',
    brand: 'TravelInsurance.ie',
    brandColor: 'text-emerald-700',
    title: 'Compare travel insurance',
    description: 'Get the best travel insurance deal for your trip. Compare top providers in seconds.',
    badge: 'Best prices',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    validUntil: 'Ongoing',
    url: 'https://www.travelinsurance.ie',
    exclusive: false,
  },
  {
    emoji: '🗺️',
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-500',
    brand: 'Viator',
    brandColor: 'text-amber-700',
    title: 'Tours from €10',
    description: 'Thousands of tours and activities starting from just €10. Book with free cancellation.',
    badge: 'From €10',
    badgeColor: 'bg-amber-100 text-amber-700',
    validUntil: 'Ongoing',
    url: 'https://www.viator.com',
    exclusive: false,
  },
]

const EMPTY_FORM = {
  business_name: '',
  contact_email: '',
  website: '',
  deal_description: '',
  discount_percentage: '',
  valid_until: '',
}

export default function DealsPage() {
  const [form, setForm]         = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.business_name.trim() || !form.contact_email.trim() || !form.deal_description.trim()) {
      toast.error('Please fill in the required fields')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('partner_deals').insert({
      business_name:      form.business_name.trim(),
      contact_email:      form.contact_email.trim(),
      website:            form.website.trim() || null,
      deal_description:   form.deal_description.trim(),
      discount_percentage: form.discount_percentage ? parseInt(form.discount_percentage) : null,
      valid_until:        form.valid_until || null,
      status:             'pending',
    })
    setSubmitting(false)
    if (error) { toast.error('Failed to submit. Please try again.'); return }
    setSubmitted(true)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="max-w-4xl space-y-10 animate-fade-in">

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 rounded-3xl p-8 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold font-display mb-2">Exclusive Travel Deals</h1>
          <p className="text-white/80 text-base mb-6 max-w-lg mx-auto">
            Book through Holidater and save on hotels, flights and experiences
          </p>
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/25 rounded-full px-5 py-2.5">
            <Users size={16} className="text-white/80" />
            <span className="text-sm font-semibold text-white">Join 10,000+ travellers saving with Holidater deals</span>
          </div>
        </div>
      </div>

      {/* Deals grid */}
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900 mb-5">Featured Deals</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {DEALS.map(deal => (
            <div key={deal.brand} className={`relative rounded-2xl border border-slate-100 overflow-hidden ${deal.bg} shadow-sm hover:shadow-md transition-all`}>
              {deal.exclusive && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                  Exclusive
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${deal.iconBg} flex items-center justify-center text-xl flex-shrink-0`}>
                    {deal.emoji}
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wide ${deal.brandColor}`}>{deal.brand}</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{deal.title}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{deal.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${deal.badgeColor}`}>
                    {deal.badge}
                  </span>
                  <span className="text-[11px] text-slate-400">Valid until {deal.validUntil}</span>
                </div>

                <a href={deal.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                  Book Now <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partner with us */}
      <div className="card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg mb-4">
            <Tag size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">Are you a hotel or business?</h2>
          <h3 className="text-lg font-semibold text-indigo-600 mb-3">Partner with Holidater</h3>
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
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
              {submitting ? 'Submitting…' : 'Submit Your Deal'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
