import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Heart, MessageCircle, Share2, Image, Send, MapPin, X } from 'lucide-react'
import toast from 'react-hot-toast'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const AVATAR_COLORS = [
  'from-sky-400 to-blue-600',
  'from-pink-400 to-rose-600',
  'from-emerald-400 to-teal-600',
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-600',
  'from-indigo-400 to-cyan-600',
]

function avatarColor(userId) {
  if (!userId) return AVATAR_COLORS[0]
  let h = 0
  for (let i = 0; i < userId.length; i++) h = userId.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function Avatar({ profile, userId, size = 10 }) {
  const color = avatarColor(userId)
  const initial = profile?.full_name?.[0]?.toUpperCase() || 'T'
  const px = size === 10 ? 'w-10 h-10' : 'w-8 h-8'
  return (
    <div className={`${px} rounded-full flex-shrink-0 overflow-hidden`}>
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
        : (
          <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold`}>
            {initial}
          </div>
        )
      }
    </div>
  )
}

function PostCard({ post, currentUserId, onLike }) {
  const name = post.profiles?.full_name || 'Traveller'
  const username = post.profiles?.username

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Avatar profile={post.profiles} userId={post.user_id} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 text-sm">{name}</div>
          <div className="text-xs text-slate-400 truncate">
            {username && <span>@{username} · </span>}
            {post.location_name && <span>📍 {post.location_name} · </span>}
            {timeAgo(post.created_at)}
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="px-4 pb-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Image */}
      {post.image_urls?.length > 0 && (
        <img src={post.image_urls[0]} alt="" className="w-full aspect-video object-cover" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-3 border-t border-slate-50">
        <button
          onClick={() => onLike(post)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all
            ${post._liked ? 'text-rose-500 bg-rose-50' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Heart size={16} className={post._liked ? 'fill-current' : ''} />
          <span>{post.like_count ?? 0}</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all">
          <MessageCircle size={16} />
          <span>{post.comment_count ?? 0}</span>
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.origin + '/feed')
            toast.success('Link copied!')
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all ml-auto"
        >
          <Share2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const { profile } = useAuthStore()
  const [posts, setPosts]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [postText, setPostText]       = useState('')
  const [location, setLocation]       = useState('')
  const [showLocation, setShowLocation] = useState(false)
  const [posting, setPosting]         = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const textareaRef = useRef(null)

  const autoResize = (el) => {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  const fetchPosts = async (uid) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(id, full_name, avatar_url, username)')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) { toast.error('Failed to load posts'); setLoading(false); return }

    let likedSet = new Set()
    if (uid) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', uid)
      likedSet = new Set((likes || []).map(l => l.post_id))
    }

    setPosts((data || []).map(p => ({ ...p, _liked: likedSet.has(p.id) })))
    setLoading(false)
  }

  useEffect(() => {
    let channel
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user?.id || null
      setCurrentUserId(uid)
      await fetchPosts(uid)

      channel = supabase
        .channel('feed-realtime')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        }, async ({ new: row }) => {
          if (row.visibility !== 'public') return
          const { data: prof } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, username')
            .eq('id', row.user_id)
            .single()
          setPosts(prev => {
            if (prev.find(p => p.id === row.id)) return prev
            return [{ ...row, profiles: prof, _liked: false }, ...prev]
          })
        })
        .subscribe()
    }
    init()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  const handlePost = async () => {
    if (!postText.trim() || posting) return
    setPosting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('You must be logged in'); setPosting(false); return }

    const { data: newPost, error } = await supabase
      .from('posts')
      .insert({
        user_id:       user.id,
        content:       postText.trim(),
        visibility:    'public',
        location_name: location.trim() || null,
      })
      .select('*, profiles(id, full_name, avatar_url, username)')
      .single()

    if (error) {
      toast.error('Failed to post: ' + error.message)
    } else {
      toast.success('Post shared! 🌍')
      setPosts(prev => [{ ...newPost, _liked: false }, ...prev])
      setPostText('')
      setLocation('')
      setShowLocation(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
    setPosting(false)
  }

  const handleLike = async (post) => {
    if (!currentUserId) { toast.error('Sign in to like posts'); return }
    const wasLiked = post._liked

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === post.id
        ? { ...p, _liked: !wasLiked, like_count: Math.max(0, (p.like_count ?? 0) + (wasLiked ? -1 : 1)) }
        : p
    ))

    if (wasLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUserId)
      if (error) {
        // Revert
        setPosts(prev => prev.map(p =>
          p.id === post.id ? { ...p, _liked: true, like_count: (p.like_count ?? 0) + 1 } : p
        ))
      }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_id: currentUserId })
      if (error) {
        // Revert
        setPosts(prev => prev.map(p =>
          p.id === post.id ? { ...p, _liked: false, like_count: Math.max(0, (p.like_count ?? 0) - 1) } : p
        ))
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Post creation */}
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <Avatar profile={profile} userId={profile?.id} />
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={postText}
              onChange={e => { setPostText(e.target.value); autoResize(e.target) }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost() }}
              placeholder="Where have you been? Share your travel story..."
              className="w-full text-sm text-slate-700 placeholder-slate-400 resize-none outline-none bg-transparent leading-relaxed overflow-hidden"
              rows={2}
              style={{ minHeight: '48px' }}
            />

            {showLocation && (
              <div className="flex items-center gap-2 mt-2 mb-1">
                <MapPin size={13} className="text-sky-500 flex-shrink-0" />
                <input
                  className="flex-1 text-sm outline-none text-slate-700 placeholder-slate-400 bg-transparent border-b border-slate-200 pb-0.5"
                  placeholder="Add location name..."
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  autoFocus
                />
                <button onClick={() => { setShowLocation(false); setLocation('') }}
                  className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={13} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div className="flex gap-3">
                <button
                  onClick={() => toast('Photo upload coming soon!')}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-500 font-medium transition-colors"
                >
                  <Image size={15} /> Photo
                </button>
                <button
                  onClick={() => setShowLocation(v => !v)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${showLocation ? 'text-sky-500' : 'text-slate-500 hover:text-sky-500'}`}
                >
                  <MapPin size={15} /> Location
                </button>
              </div>
              <button
                onClick={handlePost}
                disabled={!postText.trim() || posting}
                className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:from-sky-600 hover:to-indigo-700 transition-all"
              >
                <Send size={12} /> {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded w-32" />
                  <div className="h-2.5 bg-slate-100 rounded w-48" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">✈️</div>
          <h3 className="font-bold text-slate-800 mb-2">No posts yet</h3>
          <p className="text-slate-500 text-sm">Be the first to share your travel story!</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onLike={handleLike}
          />
        ))
      )}
    </div>
  )
}
