import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const perks = ['Free forever plan', 'Unlimited destinations', 'Budget tracking', 'Collaborative trips']

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle } = useAuthStore()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error } = await signUp(form)
    if (error) {
      toast.error(error.message || 'Registration failed')
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  if (done) return (
    <div className="text-center animate-slide-up">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-bold font-display text-slate-900 mb-3">Check your email!</h2>
      <p className="text-slate-500 mb-2">We sent a verification link to</p>
      <p className="font-semibold text-slate-800 mb-6">{form.email}</p>
      <p className="text-sm text-slate-400 mb-6">Click the link in your email to activate your account, then sign in.</p>
      <Link to="/login" className="btn-primary inline-flex items-center gap-2">
        <ArrowRight size={16} /> Go to sign in
      </Link>
    </div>
  )

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h2 className="text-3xl font-bold font-display text-slate-900 mb-2">Start your journey</h2>
        <p className="text-slate-500">Create your free Wanderwall account</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {perks.map(p => (
          <div key={p} className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
            {p}
          </div>
        ))}
      </div>

      <button onClick={signInWithGoogle}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all mb-5">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Sign up with Google
      </button>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-4 text-sm text-slate-400">or with email</span></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input type="text" className="input" placeholder="Mingmar Sherpa" required
            value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
        </div>
        <div>
          <label className="label">Email address</label>
          <input type="email" className="input" placeholder="you@example.com" required
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} className="input pr-12" placeholder="Min. 6 characters" required
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          {loading
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><ArrowRight size={18} /> Create free account</>
          }
        </button>

        <p className="text-xs text-slate-400 text-center">
          By registering you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>

      <p className="text-center text-sm text-slate-500 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700">Sign in</Link>
      </p>
    </div>
  )
}
