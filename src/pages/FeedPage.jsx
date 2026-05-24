import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { uploadPostMedia } from '../lib/storage'
import {
  Heart, MessageCircle, Share2, Image, Send, MapPin, X, Loader2,
  MoreHorizontal, Trash2, Users, Globe,
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ─── helpers ──────────────────────────────────────────────────────────── */

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

const COLORS = ['from-sky-400 to-blue-600','from-pink-400 to-rose-600','from-emerald-400 to-teal-600','from-violet-400 to-purple-600','from-amber-400 to-orange-600','from-indigo-400 to-cyan-600']
function avatarColor(id) {
  if (!id) return COLORS[0]
  let h = 0; for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h<<5)-h)
  return COLORS[Math.abs(h) % COLORS.length]
}

function Avatar({ profile, userId, size = 10 }) {
  const cls = size === 10 ? 'w-10 h-10' : size === 8 ? 'w-8 h-8' : 'w-7 h-7'
  const txt = size === 10 ? 'text-sm' : 'text-xs'
  const initial = profile?.full_name?.[0]?.toUpperCase() || 'T'
  return (
    <div className={`${cls} rounded-full flex-shrink-0 overflow-hidden`}>
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
        : <div className={`w-full h-full bg-gradient-to-br ${avatarColor(userId)} flex items-center justify-center text-white ${txt} font-bold`}>{initial}</div>
      }
    </div>
  )
}

async function sendNotif(userId, title, message, actionUrl = '/feed') {
  try {
    await supabase.rpc('send_social_notification', {
      p_user_id: userId, p_title: title, p_message: message, p_action_url: actionUrl,
    })
  } catch {}
}

/* ─── PostCard ─────────────────────────────────────────────────────────── */

function PostCard({ post, currentUserId, myProfile, onLike, onDelete, onCommentAdded, likeAnimating }) {
  const [commentsOpen,    setCommentsOpen]    = useState(false)
  const [comments,        setComments]        = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText,     setCommentText]     = useState('')
  const [submitting,      setSubmitting]      = useState(false)
  const [menuOpen,        setMenuOpen]        = useState(false)
  const [showAll,         setShowAll]         = useState(false)
  const menuRef = useRef(null)

  const name   = post.profiles?.full_name || 'Traveller'
  const uname  = post.profiles?.username
  const isOwn  = post.user_id === currentUserId
  const toProf = isOwn ? '/profile' : `/profile/${post.user_id}`

  useEffect(() => {
    if (!menuOpen) return
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const loadComments = async () => {
    setCommentsLoading(true)
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles(id,full_name,avatar_url,username)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setCommentsLoading(false)
  }

  const toggleComments = () => {
    if (!commentsOpen) loadComments()
    setCommentsOpen(v => !v)
  }

  const submitComment = async () => {
    if (!commentText.trim() || submitting || !currentUserId) return
    setSubmitting(true)
    const text = commentText.trim()
    setCommentText('')
    const { data: nc, error } = await supabase
      .from('post_comments')
      .insert({ post_id: post.id, user_id: currentUserId, content: text })
      .select('*, profiles(id,full_name,avatar_url,username)')
      .single()
    if (!error) {
      setComments(prev => [...prev, nc])
      onCommentAdded?.(post.id)
      await supabase.from('posts').update({ comment_count: (post.comment_count || 0) + 1 }).eq('id', post.id)
      if (post.user_id !== currentUserId) {
        sendNotif(post.user_id, `💬 ${myProfile?.full_name || 'Someone'} commented on your post`,
          text.length > 80 ? text.slice(0, 80) + '…' : text)
      }
    } else { setCommentText(text); toast.error('Failed to comment') }
    setSubmitting(false)
  }

  const deleteComment = async (cid) => {
    setComments(prev => prev.filter(c => c.id !== cid))
    await supabase.from('post_comments').delete().eq('id', cid)
  }

  const images  = (post.image_urls || []).filter(u => !/\.(mp4|webm|ogg|mov)(\?|$)/i.test(u))
  const video   = (post.image_urls || []).find(u => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(u))
  const visible = showAll ? comments : comments.slice(-3)

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link to={toProf}><Avatar profile={post.profiles} userId={post.user_id}/></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={toProf} className="font-semibold text-slate-900 text-sm hover:text-sky-600 transition-colors">{name}</Link>
            {uname && <span className="text-xs text-slate-400">@{uname}</span>}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 flex-wrap">
            {post.location_name && <><MapPin size={10} className="text-sky-400"/><span>{post.location_name}</span><span>·</span></>}
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(v => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <MoreHorizontal size={16}/>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-1 overflow-hidden">
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/feed`); toast.success('Link copied!'); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <Share2 size={13}/> Copy link
              </button>
              {isOwn && (
                <button onClick={() => { onDelete(post.id); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={13}/> Delete post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="px-4 pb-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Media */}
      {video && <video src={video} controls className="w-full max-h-96 bg-black" preload="metadata"/>}
      {images.length === 1 && <img src={images[0]} alt="" className="w-full aspect-video object-cover"/>}
      {images.length === 2 && (
        <div className="grid grid-cols-2 gap-0.5">
          {images.map((img,i) => <img key={i} src={img} alt="" className="w-full aspect-square object-cover"/>)}
        </div>
      )}
      {images.length >= 3 && (
        <div className="grid grid-cols-2 gap-0.5">
          {images.slice(0,4).map((img,i) => (
            <div key={i} className="relative aspect-square">
              <img src={img} alt="" className="w-full h-full object-cover"/>
              {i === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                  +{images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-t border-slate-50">
        <button onClick={() => onLike(post)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all select-none
            ${post._liked ? 'text-rose-500 bg-rose-50' : 'text-slate-500 hover:bg-slate-50'}
            ${likeAnimating ? 'heart-bounce' : ''}`}>
          <Heart size={16} className={post._liked ? 'fill-current' : ''}/>
          <span>{post.like_count ?? 0}</span>
        </button>
        <button onClick={toggleComments}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all
            ${commentsOpen ? 'text-sky-600 bg-sky-50' : 'text-slate-500 hover:bg-slate-50'}`}>
          <MessageCircle size={16}/>
          <span>{post.comment_count ?? 0}</span>
        </button>
        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/feed`); toast.success('Link copied!') }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all ml-auto">
          <Share2 size={16}/>
        </button>
      </div>

      {/* Comments */}
      {commentsOpen && (
        <div className="border-t border-slate-50 px-4 pb-4 pt-3 space-y-3">
          {commentsLoading ? (
            <div className="flex justify-center py-3"><Loader2 size={15} className="animate-spin text-slate-400"/></div>
          ) : (
            <>
              {comments.length > 3 && !showAll && (
                <button onClick={() => setShowAll(true)}
                  className="text-xs text-sky-600 font-semibold hover:text-sky-700 transition-colors">
                  View all {comments.length} comments
                </button>
              )}
              <div className="space-y-2.5">
                {visible.map(c => (
                  <div key={c.id} className="flex items-start gap-2 group">
                    <Avatar profile={c.profiles} userId={c.user_id} size={7}/>
                    <div className="flex-1 min-w-0">
                      <div className="bg-slate-50 rounded-2xl px-3 py-2 inline-block max-w-full">
                        <span className="text-xs font-semibold text-slate-800">{c.profiles?.full_name || 'Traveller'} </span>
                        <span className="text-xs text-slate-600 break-words">{c.content}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 px-1">
                        <span className="text-[10px] text-slate-400">{timeAgo(c.created_at)}</span>
                        {c.user_id === currentUserId && (
                          <button onClick={() => deleteComment(c.id)}
                            className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-1">No comments yet. Be first!</p>
                )}
              </div>
            </>
          )}
          {currentUserId ? (
            <div className="flex items-center gap-2 pt-1">
              <Avatar profile={myProfile} userId={currentUserId} size={7}/>
              <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-full px-3 py-1.5 border border-slate-200 focus-within:border-sky-400 transition-colors">
                <input
                  className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                  placeholder="Add a comment…"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
                />
                <button onClick={submitComment} disabled={!commentText.trim() || submitting}
                  className="text-sky-500 disabled:text-slate-300 hover:text-sky-600 transition-colors flex-shrink-0">
                  {submitting ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center">
              <Link to="/login" className="text-sky-600 font-semibold">Sign in</Link> to comment
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── SuggestedUser ────────────────────────────────────────────────────── */

function SuggestedUser({ user, followingIds, onFollow }) {
  const following = followingIds.has(user.id)
  return (
    <div className="flex items-center gap-2.5">
      <Link to={`/profile/${user.id}`} className="flex-shrink-0">
        <Avatar profile={user} userId={user.id} size={8}/>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${user.id}`} className="text-xs font-semibold text-slate-800 block truncate hover:text-sky-600 transition-colors">
          {user.full_name}
        </Link>
        <p className="text-[10px] text-slate-400 truncate">{user.travel_personality || 'Traveller'}</p>
      </div>
      <button onClick={() => onFollow(user)}
        className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
          following
            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:shadow-md'
        }`}>
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}

/* ─── FeedPage ─────────────────────────────────────────────────────────── */

export default function FeedPage() {
  const { profile } = useAuthStore()

  const [activeTab,     setActiveTab]     = useState('all')
  const [posts,         setPosts]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [postText,      setPostText]      = useState('')
  const [location,      setLocation]      = useState('')
  const [showLocation,  setShowLocation]  = useState(false)
  const [mediaFile,     setMediaFile]     = useState(null)
  const [mediaPreview,  setMediaPreview]  = useState(null)
  const [posting,       setPosting]       = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [likeAnim,      setLikeAnim]      = useState(new Set())
  const [followingIds,  setFollowingIds]  = useState(new Set())
  const [suggested,     setSuggested]     = useState([])
  const [pendingPosts,  setPendingPosts]  = useState([])
  const [showBanner,    setShowBanner]    = useState(false)

  const textareaRef  = useRef(null)
  const mediaRef     = useRef(null)
  const followingRef = useRef(new Set())

  const autoResize = el => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }

  /* ── fetch helpers ── */

  const getFollowing = async (uid) => {
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', uid)
    const ids = new Set((data || []).map(f => f.following_id))
    setFollowingIds(ids); followingRef.current = ids
    return ids
  }

  const fetchPosts = async (uid, tab, fIds) => {
    setLoading(true)
    let q = supabase
      .from('posts')
      .select('*, profiles(id,full_name,avatar_url,username)')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(30)

    if (tab === 'following') {
      const ids = [...(fIds || followingRef.current)]
      if (!ids.length) { setPosts([]); setLoading(false); return }
      q = q.in('user_id', ids)
    }

    const { data, error } = await q
    if (error) { toast.error('Failed to load posts'); setLoading(false); return }

    let liked = new Set()
    if (uid) {
      const { data: lk } = await supabase.from('post_likes').select('post_id').eq('user_id', uid)
      liked = new Set((lk || []).map(l => l.post_id))
    }
    setPosts((data || []).map(p => ({ ...p, _liked: liked.has(p.id) })))
    setLoading(false)
  }

  const fetchSuggested = async (uid, fIds) => {
    const { data } = await supabase
      .from('profiles')
      .select('id,full_name,avatar_url,username,travel_personality')
      .neq('id', uid)
      .limit(30)
    const pool = (data || []).filter(p => !fIds.has(p.id))
    setSuggested(pool.sort(() => Math.random() - 0.5).slice(0, 5))
  }

  /* ── init + realtime ── */

  useEffect(() => {
    let chan
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user?.id || null
      setCurrentUserId(uid)
      const fIds = uid ? await getFollowing(uid) : new Set()
      await fetchPosts(uid, 'all', fIds)
      if (uid) fetchSuggested(uid, fIds)

      chan = supabase.channel('feed-rt')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async ({ new: row }) => {
          if (row.visibility !== 'public' || row.user_id === uid) return
          const { data: prof } = await supabase.from('profiles').select('id,full_name,avatar_url,username').eq('id', row.user_id).single()
          setPendingPosts(prev => [{ ...row, profiles: prof, _liked: false }, ...prev])
          setShowBanner(true)
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, ({ new: row }) => {
          setPosts(prev => prev.map(p => p.id === row.id
            ? { ...p, like_count: row.like_count, comment_count: row.comment_count }
            : p))
        })
        .subscribe()
    }
    init()
    return () => { if (chan) supabase.removeChannel(chan) }
  }, [])

  /* ── tab change ── */

  const changeTab = (tab) => {
    setActiveTab(tab)
    fetchPosts(currentUserId, tab, followingRef.current)
  }

  /* ── show pending ── */

  const showPending = () => {
    setPosts(prev => {
      const ids = new Set(prev.map(p => p.id))
      return [...pendingPosts.filter(p => !ids.has(p.id)), ...prev]
    })
    setPendingPosts([]); setShowBanner(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ── post creation ── */

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 50*1024*1024) { toast.error('Max 50 MB'); return }
    if (mediaPreview) URL.revokeObjectURL(mediaPreview)
    setMediaFile(file); setMediaPreview(URL.createObjectURL(file)); e.target.value = ''
  }

  const removeMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview)
    setMediaFile(null); setMediaPreview(null)
  }

  const handlePost = async () => {
    if (!postText.trim() || posting) return
    setPosting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sign in to post'); setPosting(false); return }

    let imageUrls = []
    if (mediaFile) {
      try { imageUrls = [await uploadPostMedia(mediaFile, user.id)] }
      catch (err) { toast.error('Upload failed: ' + err.message); setPosting(false); return }
    }

    const { data: np, error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content: postText.trim(), visibility: 'public', location_name: location.trim() || null, image_urls: imageUrls })
      .select('*, profiles(id,full_name,avatar_url,username)')
      .single()

    if (error) { toast.error(error.message) }
    else {
      toast.success('Posted! 🌍')
      setPosts(prev => [{ ...np, _liked: false }, ...prev])
      setPostText(''); setLocation(''); setShowLocation(false); removeMedia()
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }
    setPosting(false)
  }

  /* ── like ── */

  const handleLike = async (post) => {
    if (!currentUserId) { toast.error('Sign in to like'); return }
    const was = post._liked

    setLikeAnim(prev => new Set([...prev, post.id]))
    setTimeout(() => setLikeAnim(prev => { const n = new Set(prev); n.delete(post.id); return n }), 300)

    setPosts(prev => prev.map(p =>
      p.id === post.id ? { ...p, _liked: !was, like_count: Math.max(0, (p.like_count||0) + (was ? -1 : 1)) } : p
    ))

    if (was) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      await supabase.from('posts').update({ like_count: Math.max(0, (post.like_count||0) - 1) }).eq('id', post.id)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
      await supabase.from('posts').update({ like_count: (post.like_count||0) + 1 }).eq('id', post.id)
      if (post.user_id !== currentUserId) {
        sendNotif(post.user_id, `❤️ ${profile?.full_name||'Someone'} liked your post`,
          post.content.slice(0, 80))
      }
    }
  }

  /* ── delete ── */

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return
    setPosts(prev => prev.filter(p => p.id !== postId))
    await supabase.from('posts').delete().eq('id', postId)
    toast.success('Deleted')
  }

  /* ── follow ── */

  const handleFollow = async (user) => {
    if (!currentUserId) { toast.error('Sign in to follow'); return }
    const isFollowing = followingRef.current.has(user.id)

    const next = new Set(followingRef.current)
    if (isFollowing) {
      next.delete(user.id)
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', user.id)
    } else {
      next.add(user.id)
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: user.id })
      sendNotif(user.id, `👤 ${profile?.full_name||'Someone'} started following you`,
        'They are now following your travel adventures!', `/profile/${currentUserId}`)
    }
    followingRef.current = next
    setFollowingIds(new Set(next))
  }

  /* ── comment count ── */

  const handleCommentAdded = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: (p.comment_count||0)+1 } : p))
  }

  /* ── render ── */

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <input ref={mediaRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect}/>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_268px] gap-5 items-start">
        {/* ── Feed column ── */}
        <div className="space-y-4 min-w-0">

          {/* Create post */}
          <div className="card p-4">
            <div className="flex items-start gap-3">
              <Avatar profile={profile} userId={profile?.id}/>
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={postText}
                  onChange={e => { setPostText(e.target.value); autoResize(e.target) }}
                  onKeyDown={e => { if (e.key==='Enter' && (e.metaKey||e.ctrlKey)) handlePost() }}
                  placeholder="Where have you been? Share your travel story…"
                  className="w-full text-sm text-slate-700 placeholder-slate-400 resize-none outline-none bg-transparent leading-relaxed overflow-hidden"
                  rows={2} style={{ minHeight:'48px' }}
                />
                {showLocation && (
                  <div className="flex items-center gap-2 mt-2 mb-1">
                    <MapPin size={13} className="text-sky-500 flex-shrink-0"/>
                    <input className="flex-1 text-sm outline-none text-slate-700 placeholder-slate-400 bg-transparent border-b border-slate-200 pb-0.5"
                      placeholder="Add location…" value={location} onChange={e => setLocation(e.target.value)} autoFocus/>
                    <button onClick={() => { setShowLocation(false); setLocation('') }} className="text-slate-400 hover:text-slate-600"><X size={13}/></button>
                  </div>
                )}
                {mediaPreview && (
                  <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-200">
                    {mediaFile?.type.startsWith('video/')
                      ? <video src={mediaPreview} controls className="w-full max-h-48 bg-black"/>
                      : <img src={mediaPreview} alt="" className="w-full max-h-48 object-cover"/>}
                    <button onClick={removeMedia}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
                      <X size={14}/>
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex gap-3">
                    <button onClick={() => mediaRef.current?.click()}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${mediaFile?'text-sky-500':'text-slate-500 hover:text-sky-500'}`}>
                      <Image size={15}/> Photo/Video
                    </button>
                    <button onClick={() => setShowLocation(v => !v)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${showLocation?'text-sky-500':'text-slate-500 hover:text-sky-500'}`}>
                      <MapPin size={15}/> Location
                    </button>
                  </div>
                  <button onClick={handlePost} disabled={!postText.trim()||posting}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:from-sky-600 hover:to-indigo-700 transition-all">
                    {posting ? <Loader2 size={12} className="animate-spin"/> : <Send size={12}/>}
                    {posting ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
            {[
              { key:'all',       label:'All Posts',  icon: Globe },
              { key:'following', label:'Following',  icon: Users },
            ].map(t => {
              const Icon = t.icon
              return (
                <button key={t.key} onClick={() => changeTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all
                    ${activeTab===t.key ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Icon size={14}/> {t.label}
                </button>
              )
            })}
          </div>

          {/* New posts banner */}
          {showBanner && (
            <button onClick={showPending}
              className="w-full bg-sky-500 text-white text-sm font-semibold py-2.5 rounded-2xl hover:bg-sky-600 transition-colors flex items-center justify-center gap-2 shadow-md">
              ✨ {pendingPosts.length} new post{pendingPosts.length > 1 ? 's' : ''} — tap to load
            </button>
          )}

          {/* Posts list */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_,i) => (
                <div key={i} className="card p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100"/>
                    <div className="flex-1 space-y-1.5"><div className="h-3 bg-slate-100 rounded w-32"/><div className="h-2.5 bg-slate-100 rounded w-48"/></div>
                  </div>
                  <div className="space-y-2"><div className="h-3 bg-slate-100 rounded w-full"/><div className="h-3 bg-slate-100 rounded w-3/4"/></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="card text-center py-16">
              {activeTab === 'following' ? (
                <>
                  <div className="text-5xl mb-4">👥</div>
                  <h3 className="font-bold text-slate-800 mb-2">No posts from people you follow</h3>
                  <p className="text-slate-500 text-sm mb-4">Follow some travellers to see their posts here.</p>
                  <button onClick={() => changeTab('all')} className="btn-primary text-sm px-4 py-2 inline-flex">Discover travellers</button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">✈️</div>
                  <h3 className="font-bold text-slate-800 mb-2">No posts yet</h3>
                  <p className="text-slate-500 text-sm">Be the first to share your travel story!</p>
                </>
              )}
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post}
                currentUserId={currentUserId} myProfile={profile}
                onLike={handleLike} onDelete={handleDelete}
                onCommentAdded={handleCommentAdded}
                likeAnimating={likeAnim.has(post.id)}/>
            ))
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="hidden lg:block sticky top-24 space-y-4">
          <div className="card p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
              <Users size={14} className="text-sky-500"/> Travellers to Follow
            </h3>
            {suggested.length === 0 ? (
              <p className="text-xs text-slate-400">No suggestions right now.</p>
            ) : (
              <div className="space-y-3">
                {suggested.map(u => (
                  <SuggestedUser key={u.id} user={u} followingIds={followingIds} onFollow={handleFollow}/>
                ))}
              </div>
            )}
            <Link to="/explore?tab=travellers" className="block mt-4 text-xs text-sky-600 font-semibold text-center hover:text-sky-700 transition-colors">
              See more travellers →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
