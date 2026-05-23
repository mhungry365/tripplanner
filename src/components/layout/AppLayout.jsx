import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { LayoutDashboard, Map, Compass, User, LogOut, Heart, Menu, X, Bell, Plus } from 'lucide-react'
import { APP_NAME } from '../../lib/constants'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/feed',      label: 'Feed',      icon: Heart },
  { path: '/explore',   label: 'Explore',   icon: Compass },
  { path: '/trips',     label: 'My Trips',  icon: Map },
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen]         = useState(false)
  const notifRef = useRef(null)
  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (!profile?.id) return

    const fetchNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, title, message, type, is_read, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifications(data || [])
    }
    fetchNotifs()

    // Real-time: new notifications pushed from admin broadcasts
    const channel = supabase
      .channel(`notif-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, ({ new: row }) => {
        setNotifications(prev => [row, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
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
            <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Your Journey. Your Story.</div>
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

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {profile?.full_name?.[0]?.toUpperCase() || 'W'}
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-white h-full flex flex-col shadow-xl">
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:bg-slate-100">
              <X size={18} />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-slate-800 font-display">
              {navItems.find(n => location.pathname.startsWith(n.path))?.label || 'HolidaysDairy'}
            </h1>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead}
                        className="text-xs text-sky-600 hover:text-sky-700 font-semibold">
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

            <Link to="/trips/new" className="btn-primary text-sm py-2 hidden sm:flex items-center gap-1.5">
              <Plus size={16} /> New Trip
            </Link>
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
