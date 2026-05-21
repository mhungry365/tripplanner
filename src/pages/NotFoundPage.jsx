import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-pink-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 animate-float">🗺️</div>
        <h1 className="text-6xl font-bold font-display text-slate-900 mb-2">404</h1>
        <h2 className="text-2xl font-bold font-display text-slate-700 mb-4">You're off the map!</h2>
        <p className="text-slate-500 mb-8">This page doesn't exist — but there are plenty of real destinations waiting for you.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <Home size={16} /> Go Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
