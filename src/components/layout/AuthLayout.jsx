import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="auth-bg flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-700 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          {['🗼','🗽','🏯','🕌','🗺️','⛩️','🌋','🏝️'].map((emoji, i) => (
            <span key={i} className="absolute text-6xl animate-float"
              style={{ top: `${10 + i * 11}%`, left: `${5 + (i % 3) * 30}%`, animationDelay: `${i * 0.8}s` }}>
              {emoji}
            </span>
          ))}
        </div>

        {/* Logo */}
        <Link to="/" className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">
            🌍
          </div>
          <div>
            <div className="text-2xl font-bold font-display">Wanderwall</div>
            <div className="text-xs text-white/60 tracking-widest uppercase">Travel. Experience. Remember.</div>
          </div>
        </Link>

        {/* Hero text */}
        <div className="relative z-10">
          <h2 className="text-5xl font-bold font-display leading-tight mb-6">
            Your next<br />
            <span className="text-amber-300">adventure</span><br />
            starts here.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Plan every detail of your dream trip — from flights and hotels to day-by-day itineraries, budgets, and maps. All in one beautiful place.
          </p>
        </div>

        {/* Stats */}
        <div className="relative flex gap-8">
          {[['20+', 'Destinations'], ['100%', 'Free to start'], ['∞', 'Adventures']].map(([v, l]) => (
            <div key={l}>
              <div className="text-2xl font-bold font-display">{v}</div>
              <div className="text-white/60 text-sm">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-xl">
              🌍
            </div>
            <span className="text-xl font-bold font-display bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">Wanderwall</span>
          </Link>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
