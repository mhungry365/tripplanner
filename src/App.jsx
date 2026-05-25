import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'
import CookieConsent from './components/CookieConsent'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage from './pages/DashboardPage'
import FeedPage from './pages/FeedPage'
import TripsPage from './pages/TripsPage'
import TripDetailPage from './pages/TripDetailPage'
import NewTripPage from './pages/NewTripPage'
import ExplorePage from './pages/ExplorePage'
import ProfilePage from './pages/ProfilePage'
import CompatibilityPage from './pages/CompatibilityPage'
import PublicProfilePage from './pages/PublicProfilePage'
import MessagesPage from './pages/MessagesPage'
import SupportPage from './pages/SupportPage'
import BookingPage from './pages/BookingPage'
import DealsPage from './pages/DealsPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'
import NotFoundPage from './pages/NotFoundPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg mb-4 animate-pulse-soft">
          <span className="text-3xl">🌍</span>
        </div>
        <p className="text-slate-500 font-medium font-body">Loading Wanderwall...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { initialize } = useAuthStore()
  useEffect(() => { initialize() }, [])

  return (
    <>
    <CookieConsent />
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms"   element={<TermsPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      </Route>

      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/feed"      element={<FeedPage />} />
        <Route path="/trips"     element={<TripsPage />} />
        <Route path="/trips/new" element={<NewTripPage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/explore"        element={<ExplorePage />} />
        <Route path="/compatibility"  element={<CompatibilityPage />} />
        <Route path="/profile"           element={<ProfilePage />} />
        <Route path="/profile/:userId"  element={<PublicProfilePage />} />
        <Route path="/messages"         element={<MessagesPage />} />
        <Route path="/messages/:userId" element={<MessagesPage />} />
        <Route path="/support"   element={<SupportPage />} />
        <Route path="/booking"   element={<BookingPage />} />
        <Route path="/deals"     element={<DealsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  )
}
