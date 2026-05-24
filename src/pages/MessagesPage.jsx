import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Send, Loader2, MessageCircle, ArrowLeft, Search } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

/* ─── helpers ──────────────────────────────────────────────────────────── */

const COLORS = ['from-sky-400 to-blue-600','from-pink-400 to-rose-600','from-emerald-400 to-teal-600','from-violet-400 to-purple-600','from-amber-400 to-orange-600','from-indigo-400 to-cyan-600']
function avatarColor(id) {
  if (!id) return COLORS[0]
  let h = 0; for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h<<5)-h)
  return COLORS[Math.abs(h) % COLORS.length]
}

function Avatar({ profile, userId, size = 10 }) {
  const cls = size === 10 ? 'w-10 h-10' : size === 9 ? 'w-9 h-9' : 'w-8 h-8'
  const initial = profile?.full_name?.[0]?.toUpperCase() || '?'
  return (
    <div className={`${cls} rounded-full flex-shrink-0 overflow-hidden`}>
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
        : <div className={`w-full h-full bg-gradient-to-br ${avatarColor(userId)} flex items-center justify-center text-white text-sm font-bold`}>{initial}</div>
      }
    </div>
  )
}

function timeShort(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s/60)}m`
  if (s < 86400) return `${Math.floor(s/3600)}h`
  if (s < 7*86400) return `${Math.floor(s/86400)}d`
  return format(new Date(d), 'MMM d')
}

/* ─── Component ────────────────────────────────────────────────────────── */

export default function MessagesPage() {
  const { userId: paramUserId } = useParams()
  const { profile: myProfile }  = useAuthStore()
  const navigate                = useNavigate()

  const [convos,        setConvos]        = useState([])
  const [convosLoading, setConvosLoading] = useState(true)
  const [selectedId,    setSelectedId]    = useState(paramUserId || null)
  const [selectedUser,  setSelectedUser]  = useState(null)
  const [messages,      setMessages]      = useState([])
  const [msgsLoading,   setMsgsLoading]   = useState(false)
  const [input,         setInput]         = useState('')
  const [sending,       setSending]       = useState(false)
  const [meId,          setMeId]          = useState(null)
  const [search,        setSearch]        = useState('')

  const bottomRef      = useRef(null)
  const inputRef       = useRef(null)
  const selectedIdRef  = useRef(null)
  const meIdRef        = useRef(null)

  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])
  useEffect(() => { meIdRef.current = meId }, [meId])

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)

  /* ── init ── */

  useEffect(() => {
    let chan
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setMeId(user.id)
      meIdRef.current = user.id
      await loadConvos(user.id)

      if (paramUserId && paramUserId !== user.id) {
        await openConvo(paramUserId, user.id)
      }

      chan = supabase.channel(`msgs-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
          async ({ new: msg }) => {
            if (msg.sender_id === selectedIdRef.current) {
              setMessages(prev => [...prev, msg])
              scrollBottom()
              await supabase.from('messages').update({ is_read: true }).eq('id', msg.id)
            }
            loadConvos(meIdRef.current)
          })
        .subscribe()
    }
    init()
    return () => { if (chan) supabase.removeChannel(chan) }
  }, [])

  /* ── load conversations ── */

  const loadConvos = async (uid) => {
    setConvosLoading(true)
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: false })
      .limit(300)

    if (!msgs?.length) { setConvos([]); setConvosLoading(false); return }

    // Group by conversation partner (latest message per partner)
    const map = new Map()
    msgs.forEach(m => {
      const otherId = m.sender_id === uid ? m.receiver_id : m.sender_id
      if (!map.has(otherId)) map.set(otherId, m)
    })

    const otherIds = [...map.keys()]
    const { data: profiles } = await supabase
      .from('profiles').select('id,full_name,avatar_url,username').in('id', otherIds)
    const profMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))

    const unread = {}
    msgs.forEach(m => {
      if (m.receiver_id === uid && !m.is_read) {
        const sid = m.sender_id
        unread[sid] = (unread[sid] || 0) + 1
      }
    })

    setConvos([...map.entries()].map(([otherId, lastMsg]) => ({
      otherUser:   profMap[otherId] || { id: otherId, full_name: 'Unknown' },
      lastMsg,
      unreadCount: unread[otherId] || 0,
    })))
    setConvosLoading(false)
  }

  /* ── open conversation ── */

  const openConvo = async (otherId, uid = meId) => {
    setSelectedId(otherId)
    selectedIdRef.current = otherId
    setMsgsLoading(true)
    navigate(`/messages/${otherId}`, { replace: true })

    const { data: prof } = await supabase
      .from('profiles').select('id,full_name,avatar_url,username').eq('id', otherId).single()
    setSelectedUser(prof)

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${uid || meId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${uid || meId})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setMsgsLoading(false)

    // Mark received messages as read
    await supabase.from('messages').update({ is_read: true })
      .eq('sender_id', otherId).eq('receiver_id', uid || meId).eq('is_read', false)

    // Reset unread in convos
    setConvos(prev => prev.map(c => c.otherUser.id === otherId ? { ...c, unreadCount: 0 } : c))

    scrollBottom()
    inputRef.current?.focus()
  }

  /* ── send message ── */

  const sendMessage = async () => {
    if (!input.trim() || sending || !selectedId || !meId) return
    setSending(true)
    const text = input.trim(); setInput('')

    const { data: msg, error } = await supabase
      .from('messages')
      .insert({ sender_id: meId, receiver_id: selectedId, content: text })
      .select().single()

    if (error) { setInput(text); toast.error('Failed to send') }
    else {
      setMessages(prev => [...prev, msg])
      scrollBottom()
      loadConvos(meId)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  /* ── filtered convos ── */

  const filteredConvos = search
    ? convos.filter(c => c.otherUser.full_name?.toLowerCase().includes(search.toLowerCase()))
    : convos

  const totalUnread = convos.reduce((s, c) => s + c.unreadCount, 0)

  /* ── render ── */

  return (
    <div className="animate-fade-in h-[calc(100vh-8rem)] flex gap-0 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 -m-4 sm:-m-6">

      {/* ── Left: conversation list ── */}
      <div className={`flex flex-col border-r border-slate-100 bg-white
        ${selectedId ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 flex-shrink-0`}>

        {/* Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800 font-display flex items-center gap-2">
              <MessageCircle size={18} className="text-sky-500"/>
              Messages
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </h2>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className="input pl-9 py-2 text-sm" placeholder="Search conversations…"
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {convosLoading ? (
            <div className="space-y-1 p-2">
              {[...Array(4)].map((_,i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0"/>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded w-24"/>
                    <div className="h-2.5 bg-slate-100 rounded w-36"/>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-5xl mb-3">💬</div>
              <p className="font-semibold text-slate-700 text-sm">No messages yet</p>
              <p className="text-slate-400 text-xs mt-1">Follow and connect with travellers to start chatting.</p>
              <Link to="/explore?tab=travellers"
                className="mt-4 inline-flex btn-primary text-xs px-4 py-2">
                Find travellers
              </Link>
            </div>
          ) : (
            <div className="py-1">
              {filteredConvos.map(({ otherUser, lastMsg, unreadCount }) => (
                <button key={otherUser.id}
                  onClick={() => openConvo(otherUser.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    selectedId === otherUser.id ? 'bg-sky-50 border-r-2 border-sky-500' : ''
                  }`}>
                  <div className="relative">
                    <Avatar profile={otherUser} userId={otherUser.id}/>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9' : unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                        {otherUser.full_name}
                      </span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{timeShort(lastMsg.created_at)}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                      {lastMsg.sender_id === meId ? 'You: ' : ''}{lastMsg.content}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: chat thread ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${selectedId ? 'flex' : 'hidden sm:flex'}`}>
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-center px-8">
            <div>
              <div className="text-6xl mb-4">💬</div>
              <h3 className="font-bold text-slate-700 font-display text-lg mb-2">Your messages</h3>
              <p className="text-slate-400 text-sm">Select a conversation or start a new one by visiting a traveller's profile.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
              <button onClick={() => { setSelectedId(null); navigate('/messages', { replace: true }) }}
                className="sm:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors mr-0.5">
                <ArrowLeft size={18}/>
              </button>
              {selectedUser ? (
                <>
                  <Link to={`/profile/${selectedUser.id}`}>
                    <Avatar profile={selectedUser} userId={selectedUser.id} size={9}/>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${selectedUser.id}`}
                      className="font-semibold text-slate-900 text-sm hover:text-sky-600 transition-colors block truncate">
                      {selectedUser.full_name}
                    </Link>
                    {selectedUser.username && (
                      <p className="text-xs text-slate-400">@{selectedUser.username}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse"/>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {msgsLoading ? (
                <div className="flex justify-center pt-8">
                  <Loader2 size={20} className="animate-spin text-slate-300"/>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">👋</div>
                  <p className="text-slate-500 text-sm font-medium">Start the conversation!</p>
                  <p className="text-slate-400 text-xs mt-1">Send a message to {selectedUser?.full_name || 'this traveller'}.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.sender_id === meId
                  const showTime = i === 0 || (new Date(msg.created_at) - new Date(messages[i-1].created_at)) > 5*60*1000
                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <div className="text-center text-[10px] text-slate-400 my-2">
                          {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <div className="mr-2 mt-1">
                            <Avatar profile={selectedUser} userId={selectedId} size={8}/>
                          </div>
                        )}
                        <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-3 bg-white">
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2 border border-slate-200 focus-within:border-sky-400 transition-colors">
                <input
                  ref={inputRef}
                  className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                  placeholder="Type a message…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-full flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md transition-all flex-shrink-0">
                  {sending ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
