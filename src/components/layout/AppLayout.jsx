import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { LayoutDashboard, Map, Compass, User, LogOut, Heart, Menu, X, Bell, Plus, HelpCircle, Plane, Tag, Search, Settings, ChevronDown } from 'lucide-react'
import { APP_NAME } from '../../lib/constants'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/feed',      label: 'Feed',      icon: Heart },
  { path: '/explore',   label: 'Explore',   icon: Compass },
  { path: '/trips',     label: 'My Trips',  icon: Map },
  { path: '/booking',   label: 'Booking',   icon: Plane },
  { path: '/deals',     label: 'Deals 🎉',  icon: Tag },
  { path: '/profile',   label: 'Profile',   icon: User },
]

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function AppLayout() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { profile, signOut } = useAuthStore()
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [avatarOpen,   setAvatarOpen]   = useState(false)
  const [headerShadow, setHeaderShadow] = useState(false)
  const avatarRef = useRef(null)

  // Notifications
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen]         = useState(false)
  const notifRef = useRef(null)
  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    let channel

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      console.log('notifications:', data, 'error:', error)
      setNotifications(data || [])

      // Real-time: new notifications pushed from admin broadcasts
      channel = supabase
        .channel(`notif-${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, ({ new: row }) => {
          setNotifications(prev => [row, ...prev])
        })
        .subscribe()
    }

    init()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current  && !notifRef.current.contains(e.target))  setNotifOpen(false)
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Header shadow on scroll
  useEffect(() => {
    const handler = () => setHeaderShadow(window.scrollY > 4)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const markRead = async (notif) => {
    if (notif.is_read) return
    await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ is_read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/')
  }

  const NavLink = ({ item }) => {
    const Icon = item.icon
    const active = location.pathname === item.path ||
      (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
    return (
      <Link to={item.path} onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
          ${active
            ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
          }`}>
        <Icon size={18} />
        {item.label}
      </Link>
    )
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-100">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
            <span className="text-xl">🌍</span>
          </div>
          <div>
            <div className="text-lg font-bold font-display bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              {APP_NAME}
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Travel. Experience. Remember.</div>
          </div>
        </Link>
      </div>

      <div className="px-4 pt-4">
        <Link to="/trips/new"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:from-sky-600 hover:to-indigo-700">
          <Plus size={16} />
          New Trip
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => <NavLink key={item.path} item={item} />)}
      </nav>

      <div className="px-4 pb-2">
        <Link to="/support" onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
            ${location.pathname === '/support'
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}>
          <HelpCircle size={18} />
          Help &amp; Support
        </Link>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                  {profile?.full_name?.[0]?.toUpperCase() || 'W'}
                </div>
              )
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{profile?.full_name}</p>
            <p className="text-xs text-slate-400 truncate capitalize">{profile?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={handleSignOut} className="text-slate-400 hover:text-red-500 transition-colors" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 fixed top-0 left-0 h-full z-30">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-white h-full flex flex-col shadow-2xl sidebar-slide">
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X size={18} />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className={`bg-white border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-20 transition-shadow duration-200 ${headerShadow ? 'shadow-md' : ''}`}>
          {/* Hamburger (mobile) */}
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0">
            <Menu size={20} />
          </button>

          {/* Page title (desktop) */}
          <div className="hidden lg:block flex-shrink-0">
            <h1 className="text-lg font-bold text-slate-800 font-display">
              {navItems.find(n => location.pathname.startsWith(n.path))?.label?.replace(' 🎉','') || 'Holidater'}
            </h1>
          </div>

          {/* Search bar (desktop center) */}
          <div className="hidden sm:flex flex-1 max-w-sm mx-auto">
            <div className="relative w-full">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 placeholder:text-slate-400 transition-all"
                placeholder="Search destinations, trips..."
                onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { navigate(`/explore?q=${encodeURIComponent(e.target.value.trim())}`); e.target.value = '' } }}
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-sky-600 hover:text-sky-700 font-semibold">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="text-center py-10">
                        <Bell size={24} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <button key={n.id} onClick={() => markRead(n)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 ${!n.is_read ? 'bg-sky-50/60' : ''}`}>
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-sky-500' : 'bg-slate-200'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* New Trip button */}
            <Link to="/trips/new" className="btn-primary text-sm py-2 px-3 hidden sm:flex items-center gap-1.5 min-h-[40px]">
              <Plus size={15} /> New Trip
            </Link>

            {/* Avatar dropdown */}
            <div className="relative" ref={avatarRef}>
              <button onClick={() => setAvatarOpen(v => !v)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px]">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                        {profile?.full_name?.[0]?.toUpperCase() || 'W'}
                      </div>
                  }
                </div>
                <ChevronDown size={13} className="text-slate-400 hidden sm:block" />
              </button>

              {avatarOpen && (
                <div className="absolute right-0 top-14 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden py-1">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 truncate">{profile?.full_name}</p>
                    <p className="text-xs text-slate-400 truncate capitalize">{profile?.role?.replace('_', ' ')}</p>
                  </div>
                  {[
                    { to: '/profile', icon: User,       label: 'My Profile' },
                    { to: '/profile', icon: Settings,   label: 'Settings' },
                    { to: '/support', icon: HelpCircle, label: 'Help & Support' },
                  ].map(item => {
                    const Icon = item.icon
                    return (
                      <Link key={item.label} to={item.to} onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <Icon size={15} className="text-slate-400" />
                        {item.label}
                      </Link>
                    )
                  })}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
