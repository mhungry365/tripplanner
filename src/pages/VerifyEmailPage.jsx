// VerifyEmailPage
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail size={36} className="text-sky-500" />
        </div>
        <h1 className="text-2xl font-bold font-display text-slate-900 mb-3">Verify your email</h1>
        <p className="text-slate-500 mb-6">Please check your inbox and click the verification link to activate your Holidater account.</p>
        <Link to="/login" className="btn-primary inline-flex">Go to Sign In</Link>
      </div>
    </div>
  )
}
