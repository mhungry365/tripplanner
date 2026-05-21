import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Users, Map, Globe, Shield, Search, Ban, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const { profile } = useAuthStore()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [{ data: usersData }, { count: tripCount }, { count: destCount }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('trips').select('*', { count: 'exact', head: true }),
      supabase.from('destinations').select('*', { count: 'exact', head: true }),
    ])
    setUsers(usersData || [])
    setStats({ users: usersData?.length || 0, trips: tripCount || 0, destinations: destCount || 0 })
    setLoading(false)
  }

  const updateUserStatus = async (userId, status) => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', userId)
    if (error) toast.error('Failed to update user')
    else { toast.success(`User ${status}`); fetchData() }
  }

  const updateUserRole = async (userId, role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) toast.error('Failed to update role')
    else { toast.success('Role updated'); fetchData() }
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white shadow-md">
          <Shield size={20} />
        </div>
        <div>
          <h1 className="section-title">Admin Panel</h1>
          <p className="text-slate-500 text-sm">Super admin: {profile?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: stats.users, icon: Users, color: 'from-sky-400 to-sky-600' },
          { label: 'Total Trips', value: stats.trips, icon: Map, color: 'from-indigo-400 to-indigo-600' },
          { label: 'Destinations', value: stats.destinations, icon: Globe, color: 'from-emerald-400 to-teal-600' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-sm`}>
                <Icon size={18} className="text-white" />
              </div>
              <div className="text-3xl font-bold font-display text-slate-900">{s.value ?? '—'}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Users table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 font-display">All Users</h3>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9 py-2 text-sm" placeholder="Search users..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['User','Email','Role','Status','Joined','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400">Loading...</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.full_name?.[0]?.toUpperCase() || 'W'}
                      </div>
                      <span className="font-semibold text-slate-800">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 capitalize">
                      {['traveller','admin','super_admin'].map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${
                      u.status === 'active' ? 'bg-green-100 text-green-700' :
                      u.status === 'suspended' ? 'bg-amber-100 text-amber-700' :
                      u.status === 'banned' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {u.status !== 'active' ? (
                        <button onClick={() => updateUserStatus(u.id, 'active')}
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Activate">
                          <CheckCircle size={14} />
                        </button>
                      ) : u.id !== profile?.id ? (
                        <button onClick={() => updateUserStatus(u.id, 'suspended')}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Suspend">
                          <Ban size={14} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
