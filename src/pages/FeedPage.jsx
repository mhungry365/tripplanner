import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Heart, MessageCircle, Share2, Bookmark, Image, Send, TrendingUp, Users, Zap } from 'lucide-react'

const MOCK_POSTS = [
  {
    id: 1,
    user: { name: 'Alex Rivera', initials: 'AR', color: 'from-sky-400 to-blue-600' },
    location: 'Tokyo, Japan 🇯🇵',
    time: '2h ago',
    content: "Just spent a week in Tokyo and I'm still in awe. The blend of ancient temples and futuristic neon streets is unlike anything I've ever seen. Pro tip: the Tsukiji outer market opens at 5am — freshest sushi you'll ever eat! 🍣",
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    likes: 247,
    comments: 34,
    liked: false,
    saved: false,
  },
  {
    id: 2,
    user: { name: 'Sophie Laurent', initials: 'SL', color: 'from-pink-400 to-rose-600' },
    location: 'Santorini, Greece 🇬🇷',
    time: '5h ago',
    content: "Sunset from Oia is absolutely everything they say it is. 🌅 I've been to a lot of beautiful places but this is next level. Already planning my return trip — who's coming with me?",
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
    likes: 512,
    comments: 67,
    liked: false,
    saved: false,
  },
  {
    id: 3,
    user: { name: 'Kai Nomura', initials: 'KN', color: 'from-emerald-400 to-teal-600' },
    location: 'Bali, Indonesia 🇮🇩',
    time: '1d ago',
    content: "Found this hidden waterfall after a 2-hour hike through the jungle. No crowds, no tourists — just me and the sound of rushing water. This is why I travel 🌿 Never book the touristy spots, always ask the locals!",
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    likes: 189,
    comments: 22,
    liked: false,
    saved: false,
  },
  {
    id: 4,
    user: { name: 'Priya Sharma', initials: 'PS', color: 'from-violet-400 to-purple-600' },
    location: 'Barcelona, Spain 🇪🇸',
    time: '2d ago',
    content: "Gaudí's Sagrada Família made me believe in magic again. Construction started in 1882 and it's still going — some things are worth waiting for. 🏛️ The morning light through the stained glass windows is something else entirely.",
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    likes: 334,
    comments: 41,
    liked: false,
    saved: false,
  },
]

const TABS = [
  { key: 'foryou',    label: 'For You',   icon: Zap },
  { key: 'following', label: 'Following', icon: Users },
  { key: 'trending',  label: 'Trending',  icon: TrendingUp },
]

export default function FeedPage() {
  const { profile } = useAuthStore()
  const [posts, setPosts] = useState(MOCK_POSTS)
  const [activeTab, setActiveTab] = useState('foryou')
  const [postText, setPostText] = useState('')

  const toggleLike = (id) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ))
  }

  const toggleSave = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Post creation */}
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {profile?.full_name?.[0]?.toUpperCase() || 'W'}
          </div>
          <div className="flex-1">
            <textarea
              value={postText}
              onChange={e => setPostText(e.target.value)}
              placeholder="Where have you been? Share your travel story..."
              className="w-full text-sm text-slate-700 placeholder-slate-400 resize-none outline-none bg-transparent leading-relaxed"
              rows={3}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div className="flex gap-3">
                <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-500 font-medium transition-colors">
                  <Image size={15} /> Photo
                </button>
                <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-500 font-medium transition-colors">
                  📍 Location
                </button>
              </div>
              <button
                disabled={!postText.trim()}
                className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:from-sky-600 hover:to-indigo-700 transition-all">
                <Send size={12} /> Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${activeTab === tab.key
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
                }`}>
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Posts */}
      {posts.map(post => (
        <div key={post.id} className="card p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 pb-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${post.user.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
              {post.user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 text-sm">{post.user.name}</div>
              <div className="text-xs text-slate-400 truncate">
                📍 {post.location} · {post.time}
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors px-1 text-base leading-none">···</button>
          </div>

          {/* Content */}
          <p className="px-4 pb-3 text-sm text-slate-700 leading-relaxed">{post.content}</p>

          {/* Image */}
          {post.image && (
            <img src={post.image} alt="" className="w-full aspect-video object-cover" />
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 px-3 py-3">
            <button onClick={() => toggleLike(post.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all
                ${post.liked ? 'text-rose-500 bg-rose-50' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Heart size={16} className={post.liked ? 'fill-current' : ''} />
              <span>{post.likes}</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all">
              <MessageCircle size={16} />
              <span>{post.comments}</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all">
              <Share2 size={16} />
            </button>
            <button onClick={() => toggleSave(post.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium ml-auto transition-all
                ${post.saved ? 'text-sky-500 bg-sky-50' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Bookmark size={16} className={post.saved ? 'fill-current' : ''} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
