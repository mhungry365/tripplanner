import { useState, useEffect } from 'react'
import { HelpCircle, Send, CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const SUBJECTS = [
  'Technical Issue',
  'Bug Report',
  'Account Issue',
  'Feature Request',
  'Other',
]

const statusConfig = {
  open:     { label: 'Open',     color: 'bg-red-100 text-red-600',       icon: AlertCircle },
  pending:  { label: 'Pending',  color: 'bg-yellow-100 text-yellow-600', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-600',   icon: CheckCircle },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function SupportPage() {
  const [subject, setSubject]   = useState(SUBJECTS[0])
  const [message, setMessage]   = useState('')
  const [sending, setSending]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [tickets, setTickets]   = useState([])
  const [loadingTickets, setLoadingTickets] = useState(true)

  const fetchTickets = async () => {
    setLoadingTickets(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingTickets(false); return }
    const { data } = await supabase
      .from('support_tickets')
      .select('id, subject, message, status, admin_response, responded_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setTickets(data || [])
    setLoadingTickets(false)
  }

  useEffect(() => { fetchTickets() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) { toast.error('Please enter a message'); return }
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('You must be logged in'); setSending(false); return }

    const { error } = await supabase.from('support_tickets').insert({
      user_id:  user.id,
      subject:  subject,
      message:  message.trim(),
      status:   'open',
      priority: 'normal',
    })

    if (error) {
      toast.error('Failed to submit: ' + error.message)
    } else {
      setSubmitted(true)
      setMessage('')
      setSubject(SUBJECTS[0])
      fetchTickets()
      setTimeout(() => setSubmitted(false), 6000)
    }
    setSending(false)
  }

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900">Help &amp; Support</h1>
        <p className="text-slate-500 text-sm mt-1">Have a question or problem? We're here to help.</p>
      </div>

      {/* Submit form */}
      <div className="card space-y-5">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <HelpCircle size={16} className="text-sky-500" />
          Submit a Request
        </h2>

        {submitted ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle size={28} className="text-green-500" />
            </div>
            <p className="font-semibold text-slate-800 mb-1">Message sent!</p>
            <p className="text-slate-500 text-sm">We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <select
                className="input"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              >
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
              <textarea
                className="input resize-none"
                rows={5}
                placeholder="Describe your issue or question in detail..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            <button type="submit" disabled={sending}
              className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <Send size={14} />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>

      {/* Ticket history */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-slate-400" />
          Your Previous Requests
        </h2>

        {loadingTickets ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-slate-50" />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="card text-center py-10">
            <MessageSquare size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No requests submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => {
              const cfg = statusConfig[t.status] || statusConfig.open
              const Icon = cfg.icon
              return (
                <div key={t.id} className="card space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge text-xs flex items-center gap-1 ${cfg.color}`}>
                          <Icon size={10} />{cfg.label}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">{t.subject}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.message}</p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(t.created_at)}</span>
                  </div>

                  {t.admin_response && (
                    <div className="bg-sky-50 rounded-xl px-4 py-3 border border-sky-100">
                      <p className="text-xs font-semibold text-sky-700 mb-1">Support replied:</p>
                      <p className="text-sm text-slate-700">{t.admin_response}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(t.responded_at)}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
