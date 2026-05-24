import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Loader2, Plane, Hotel, Bot, RotateCcw, X } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Booking partner configs ─────────────────────────────────────────────────

const FLIGHT_PARTNERS = [
  { name: 'Google Flights', bg: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    home: 'https://www.google.com/travel/flights',
    url:  (f,t,d) => `https://www.google.com/travel/flights?q=Flights+from+${encodeURIComponent(f)}+to+${encodeURIComponent(t)}+on+${d}` },
  { name: 'Skyscanner',     bg: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200',
    home: 'https://www.skyscanner.net',
    url:  (f,t,d) => `https://www.skyscanner.net/transport/flights/${encodeURIComponent(f)}/${encodeURIComponent(t)}/${d?.replace(/-/g,'')}/` },
  { name: 'Kayak',          bg: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200',
    home: 'https://www.kayak.com',
    url:  (f,t,d) => `https://www.kayak.com/flights/${encodeURIComponent(f)}-${encodeURIComponent(t)}/${d}` },
  { name: 'Momondo',        bg: 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200',
    home: 'https://www.momondo.com',
    url:  (f,t,d) => `https://www.momondo.com/flight-search/${encodeURIComponent(f)}-${encodeURIComponent(t)}/${d}` },
  { name: 'Ryanair',        bg: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-200',
    home: 'https://www.ryanair.com',
    url:  (f,t,d) => `https://www.ryanair.com/gb/en/trip/flights/select?ADT=1&TEEN=0&CHD=0&INF=0&DateIn=&DateOut=${d}&Destination=${encodeURIComponent(t)}&Origin=${encodeURIComponent(f)}` },
  { name: 'Aer Lingus',     bg: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
    home: 'https://www.aerlingus.com',
    url:  (f,t,d) => `https://www.aerlingus.com/flight-information/flight-search/?flightSearchWidgetOW=true&departureAirportName=${encodeURIComponent(f)}&arrivalAirportName=${encodeURIComponent(t)}&departureDate=${d}` },
]

const HOTEL_PARTNERS = [
  { name: 'Booking.com',  bg: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200',
    home: 'https://www.booking.com',
    url:  (dest,ci,co,g) => `https://www.booking.com/search.html?ss=${encodeURIComponent(dest)}&checkin=${ci}&checkout=${co}&group_adults=${g}&no_rooms=1` },
  { name: 'Airbnb',       bg: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200',
    home: 'https://www.airbnb.com',
    url:  (dest,ci,co,g) => `https://www.airbnb.com/s/${encodeURIComponent(dest)}/homes?checkin=${ci}&checkout=${co}&adults=${g}` },
  { name: 'Hotels.com',   bg: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
    home: 'https://www.hotels.com',
    url:  (dest,ci,co,g) => `https://www.hotels.com/search.do?q-destination=${encodeURIComponent(dest)}&q-check-in=${ci}&q-check-out=${co}&q-rooms=1&q-room-0-adults=${g}` },
  { name: 'Expedia',      bg: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200',
    home: 'https://www.expedia.com',
    url:  (dest,ci,co,g) => `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(dest)}&startDate=${ci}&endDate=${co}&adults=${g}` },
  { name: 'Hostelworld',  bg: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
    home: 'https://www.hostelworld.com',
    url:  (dest,ci,co) => `https://www.hostelworld.com/search?search_keywords=${encodeURIComponent(dest)}&date_from=${ci}&date_to=${co}` },
]

const SUGGESTIONS = [
  'Best time to visit Japan?',
  'Cheapest way Dublin to Bali',
  'Visa requirements for Nepal',
  'Budget hotels in Paris',
  'Direct flights from Dublin',
  'Is travel insurance necessary?',
]


// ─── AI Chat Component ────────────────────────────────────────────────────────

function AIChat() {
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const q = (text || input).trim()
    if (!q || loading) return

    const userMsg = { role: 'user', content: q }
    const history = [...messages.slice(-18), userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Server error ${res.status}`)
      }

      const data = await res.json()
      const reply = data.text || 'Sorry, I could not get a response.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      toast.error('AI error: ' + err.message)
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Bot size={16} className="text-white" />
          </div>
          AI Travel Assistant
        </h2>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
            <RotateCcw size={12} /> Clear
          </button>
        )}
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Ask me anything about travel — flights, hotels, visas, tips:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full hover:bg-violet-100 transition-colors font-medium">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat history */}
      {messages.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                  <Bot size={12} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                ${m.role === 'user'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-tr-sm'
                  : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <Bot size={12} className="text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-1 border-t border-slate-100">
        <input
          ref={inputRef}
          className="input flex-1 text-sm"
          placeholder="Ask me anything about your trip..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="btn-primary px-3 disabled:opacity-40"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const [searchParams] = useSearchParams()

  // Pre-fill from trip URL params
  const [from,        setFrom]        = useState('')
  const [to,          setTo]          = useState(searchParams.get('destination') || '')
  const [depDate,     setDepDate]     = useState(searchParams.get('checkin') || '')
  const [retDate,     setRetDate]     = useState(searchParams.get('checkout') || '')
  const [oneWay,      setOneWay]      = useState(false)
  const [passengers,  setPassengers]  = useState(1)
  const [cabinClass,  setCabinClass]  = useState('Economy')

  const [hotelDest,   setHotelDest]   = useState(searchParams.get('destination') || '')
  const [checkin,     setCheckin]     = useState(searchParams.get('checkin') || '')
  const [checkout,    setCheckout]    = useState(searchParams.get('checkout') || '')
  const [guests,      setGuests]      = useState(2)
  const [rooms,       setRooms]       = useState(1)

  const searchFlights = () => {
    if (!from.trim() || !to.trim()) { toast.error('Enter origin and destination'); return }
    if (!depDate)                    { toast.error('Select a departure date'); return }
    window.open(FLIGHT_PARTNERS[0].url(from, to, depDate), '_blank', 'noopener')
  }

  const openPartnerFlight = (partner) => {
    const url = (from.trim() && to.trim())
      ? partner.url(from, to, depDate || '')
      : partner.home
    window.open(url, '_blank', 'noopener')
  }

  const searchHotels = () => {
    if (!hotelDest.trim()) { toast.error('Enter a destination'); return }
    if (!checkin)          { toast.error('Select check-in date'); return }
    if (!checkout)         { toast.error('Select check-out date'); return }
    window.open(HOTEL_PARTNERS[0].url(hotelDest, checkin, checkout, guests), '_blank', 'noopener')
  }

  const openPartnerHotel = (partner) => {
    const url = hotelDest.trim()
      ? partner.url(hotelDest, checkin || '', checkout || '', guests)
      : partner.home
    window.open(url, '_blank', 'noopener')
  }

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900">Flights &amp; Hotels</h1>
        <p className="text-slate-500 text-sm mt-1">Search and compare across all major booking sites</p>
      </div>

      {/* AI Assistant */}
      <AIChat />

      {/* ─── Flights ─────────────────────────────────────────────── */}
      <div className="card space-y-5">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Plane size={15} className="text-white" />
          </div>
          Search Flights
        </h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">From</label>
            <input className="input" placeholder="Dublin (DUB)" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input className="input" placeholder="Tokyo (TYO)" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div>
            <label className="label">Departure date</label>
            <input type="date" className="input" value={depDate} onChange={e => setDepDate(e.target.value)} />
          </div>
          <div>
            <label className="label flex items-center gap-2">
              Return date
              <button onClick={() => setOneWay(v => !v)}
                className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${oneWay ? 'bg-slate-200 text-slate-600' : 'bg-sky-100 text-sky-700'}`}>
                {oneWay ? 'One way' : 'Return'}
              </button>
            </label>
            <input type="date" className="input disabled:opacity-40" value={retDate}
              onChange={e => setRetDate(e.target.value)} disabled={oneWay} />
          </div>
          <div>
            <label className="label">Passengers</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setPassengers(p => Math.max(1, p - 1))}
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold min-h-[44px] min-w-[44px]">−</button>
              <span className="w-8 text-center font-semibold text-slate-800">{passengers}</span>
              <button onClick={() => setPassengers(p => Math.min(9, p + 1))}
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold min-h-[44px] min-w-[44px]">+</button>
            </div>
          </div>
          <div>
            <label className="label">Cabin class</label>
            <select className="input" value={cabinClass} onChange={e => setCabinClass(e.target.value)}>
              {['Economy', 'Premium Economy', 'Business', 'First'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={searchFlights} className="btn-primary w-full py-3 text-sm sm:text-base font-bold flex items-center justify-center gap-2 min-h-[48px]">
          <Plane size={18} /> Search Flights on Google Flights
        </button>

        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Also search on</p>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap gap-2">
            {FLIGHT_PARTNERS.slice(1).map(p => (
              <button key={p.name} onClick={() => openPartnerFlight(p)}
                className={`text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl border transition-colors min-h-[44px] ${p.bg}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Hotels ──────────────────────────────────────────────── */}
      <div className="card space-y-5">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
            <Hotel size={15} className="text-white" />
          </div>
          Search Hotels
        </h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Destination</label>
            <input className="input" placeholder="Paris, France" value={hotelDest} onChange={e => setHotelDest(e.target.value)} />
          </div>
          <div>
            <label className="label">Check-in</label>
            <input type="date" className="input" value={checkin} onChange={e => setCheckin(e.target.value)} />
          </div>
          <div>
            <label className="label">Check-out</label>
            <input type="date" className="input" value={checkout} onChange={e => setCheckout(e.target.value)} />
          </div>
          <div>
            <label className="label">Guests</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setGuests(g => Math.max(1, g - 1))}
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold min-h-[44px] min-w-[44px]">−</button>
              <span className="w-8 text-center font-semibold text-slate-800">{guests}</span>
              <button onClick={() => setGuests(g => Math.min(20, g + 1))}
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold min-h-[44px] min-w-[44px]">+</button>
            </div>
          </div>
          <div>
            <label className="label">Rooms</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setRooms(r => Math.max(1, r - 1))}
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold min-h-[44px] min-w-[44px]">−</button>
              <span className="w-8 text-center font-semibold text-slate-800">{rooms}</span>
              <button onClick={() => setRooms(r => Math.min(10, r + 1))}
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold min-h-[44px] min-w-[44px]">+</button>
            </div>
          </div>
        </div>

        <button onClick={searchHotels} className="w-full py-3 text-sm sm:text-base font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-md min-h-[48px]">
          <Hotel size={18} /> Search Hotels on Booking.com
        </button>

        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Also search on</p>
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {HOTEL_PARTNERS.slice(1).map(p => (
              <button key={p.name} onClick={() => openPartnerHotel(p)}
                className={`text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl border transition-colors min-h-[44px] ${p.bg}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
