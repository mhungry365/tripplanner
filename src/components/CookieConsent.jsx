import { useState, useEffect } from 'react'
import { X, Cookie, ChevronDown, ChevronUp } from 'lucide-react'

const STORAGE_KEY = 'holidater_cookie_consent'

export default function CookieConsent() {
  const [visible,  setVisible]  = useState(false)
  const [modal,    setModal]    = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [prefs, setPrefs] = useState({ analytics: true, marketing: false })

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setTimeout(() => setVisible(true), 1000)
  }, [])

  const save = (accepted) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted, prefs, timestamp: Date.now() }))
    setVisible(false)
    setModal(false)
  }

  const acceptAll = () => {
    setPrefs({ analytics: true, marketing: true })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, prefs: { analytics: true, marketing: true }, timestamp: Date.now() }))
    setVisible(false)
    setModal(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Cookie size={20} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm mb-1">We use cookies 🍪</p>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                We use cookies to enhance your experience, analyse traffic, and personalise content.
                By continuing, you agree to our{' '}
                <a href="/privacy" className="text-sky-600 underline hover:text-sky-700">Cookie Policy</a>.
              </p>
            </div>
            <button onClick={() => setVisible(false)} className="text-slate-400 hover:text-slate-600 flex-shrink-0 p-1">
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={acceptAll}
              className="btn-primary flex-1 py-2.5 text-sm justify-center">
              Accept All
            </button>
            <button onClick={() => setModal(true)}
              className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors">
              Manage Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {modal && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-slate-800">Cookie Preferences</h3>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Essential */}
              <div className="flex items-start justify-between gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-800 text-sm mb-1">Essential Cookies</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Required for the app to function. Cannot be disabled.</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-11 h-6 rounded-full bg-emerald-500 flex items-center justify-end px-1 cursor-not-allowed">
                    <div className="w-4 h-4 rounded-full bg-white shadow" />
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-800 text-sm mb-1">Analytics Cookies</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Help us understand how visitors use the app to improve it.</p>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                  className={`flex-shrink-0 w-11 h-6 rounded-full flex items-center px-1 transition-colors ${prefs.analytics ? 'bg-sky-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-800 text-sm mb-1">Marketing Cookies</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Used to show relevant ads and offers based on your interests.</p>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, marketing: !p.marketing }))}
                  className={`flex-shrink-0 w-11 h-6 rounded-full flex items-center px-1 transition-colors ${prefs.marketing ? 'bg-sky-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-2">
              <button onClick={() => save(true)}
                className="btn-primary flex-1 py-2.5 text-sm justify-center">
                Save Preferences
              </button>
              <button onClick={acceptAll}
                className="flex-1 py-2.5 text-sm font-semibold bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200">
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
