import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'

const SECTIONS = [
  {
    id: 'what-we-collect',
    title: '1. What We Collect',
    content: `We collect the following types of personal data when you use Wanderwall:

**Account Information:** Full name, email address, password (hashed), profile photo, and optional profile details (bio, home city, nationality).

**Trip Data:** Itineraries, destinations, dates, budgets, photos, and notes you create within the app.

**Usage Data:** Pages visited, features used, clicks, session duration, and device information (browser, OS, screen size).

**Communications:** Messages sent to our support team, and if you contact us by email.

**Payment Data:** We do not process payments directly. Booking links redirect to third-party providers (Booking.com, Skyscanner, etc.) who handle payment data under their own privacy policies.`
  },
  {
    id: 'how-we-use',
    title: '2. How We Use Your Data',
    content: `We use your personal data to:

• Provide, operate and improve the Wanderwall service
• Personalise your experience and show relevant destinations and deals
• Send transactional emails (account verification, password reset)
• Send optional marketing emails (only with your consent)
• Analyse usage patterns to improve features and performance
• Respond to support requests
• Comply with legal obligations
• Detect and prevent fraud or abuse

**Legal basis (GDPR):** We process your data under the following lawful bases: Contract performance (providing the service), Legitimate interests (improving the product, preventing fraud), Consent (marketing emails, analytics cookies), and Legal obligation.`
  },
  {
    id: 'cookies',
    title: '3. Cookies & Tracking',
    content: `We use cookies and similar technologies:

**Essential Cookies:** Required for the app to function (authentication session, CSRF protection). Cannot be disabled.

**Analytics Cookies:** We use analytics to understand how users interact with Wanderwall. This data is aggregated and anonymised where possible.

**Marketing Cookies:** Used to measure the effectiveness of our marketing campaigns. Disabled by default — you must opt in.

You can manage your cookie preferences at any time using the Cookie Consent banner or by clearing your browser cookies. See our Cookie Policy for full details.`
  },
  {
    id: 'third-parties',
    title: '4. Third-Party Services',
    content: `We use the following third-party services that may process your data:

• **Supabase** (database and authentication) — EU data processing, GDPR compliant
• **Vercel** (hosting and serverless functions) — US-based, adequacy decisions apply
• **Google Gemini API** (AI travel assistant) — queries are not stored permanently
• **Booking.com, Skyscanner, Airbnb** etc. — when you click "Book Now" you leave Wanderwall and their privacy policy applies

We do not sell your personal data to third parties.`
  },
  {
    id: 'your-rights',
    title: '5. Your Rights (GDPR)',
    content: `Under the General Data Protection Regulation (GDPR), you have the following rights:

• **Right of Access** — Request a copy of the personal data we hold about you
• **Right to Rectification** — Correct inaccurate or incomplete data
• **Right to Erasure** — Request deletion of your personal data ("right to be forgotten")
• **Right to Restrict Processing** — Ask us to limit how we use your data
• **Right to Data Portability** — Receive your data in a machine-readable format
• **Right to Object** — Object to processing based on legitimate interests
• **Right to withdraw Consent** — Withdraw consent at any time for consent-based processing

To exercise any of these rights, email us at **privacy@wanderwall.com**. We will respond within 30 days.`
  },
  {
    id: 'data-retention',
    title: '6. Data Retention',
    content: `We retain your personal data for as long as your account is active or as needed to provide services.

• Account data: Retained until you delete your account
• Trip data: Retained with your account; deleted on account deletion
• Support correspondence: 3 years from last contact
• Analytics data: Aggregated after 26 months
• Legal/compliance records: As required by Irish law (typically 7 years)

You can delete your account at any time from Profile → Settings → Delete Account.`
  },
  {
    id: 'contact',
    title: '7. Contact & DPO',
    content: `**Wanderwall Ltd.**
Registered in Ireland

**Data Protection Officer**
Email: privacy@wanderwall.com
Subject line: "Privacy Request"

**Supervisory Authority**
You have the right to lodge a complaint with the Data Protection Commission (DPC) of Ireland:
Website: www.dataprotection.ie
Phone: +353 (0)761 104 800

**Last updated:** January 2026`
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-600 to-indigo-700 text-white py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-semibold mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Wanderwall
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display">Privacy Policy</h1>
          </div>
          <p className="text-white/75 text-base">Last updated: January 2026 · Wanderwall Ltd., Dublin, Ireland</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col lg:flex-row gap-10">
        {/* Table of contents */}
        <aside className="lg:w-60 flex-shrink-0">
          <div className="sticky top-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Contents</p>
            <nav className="space-y-1">
              {SECTIONS.map(s => (
                <a key={s.id} href={`#${s.id}`}
                  className="block text-sm text-slate-600 hover:text-sky-600 py-1.5 px-2 rounded-lg hover:bg-sky-50 transition-colors leading-tight">
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-10">
          <p className="text-slate-600 leading-relaxed">
            This Privacy Policy explains how Wanderwall Ltd. ("Wanderwall", "we", "us") collects, uses, and protects your personal data when you use our trip planning application. We are committed to protecting your privacy and complying with the EU General Data Protection Regulation (GDPR).
          </p>

          {SECTIONS.map(s => (
            <section key={s.id} id={s.id}>
              <h2 className="text-xl font-bold font-display text-slate-900 mb-4 pb-2 border-b border-slate-100">{s.title}</h2>
              <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                {s.content.split('\n').filter(Boolean).map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-bold text-slate-800">{line.replace(/\*\*/g, '')}</p>
                  }
                  if (line.startsWith('•')) {
                    return <p key={i} className="pl-4">{line}</p>
                  }
                  if (line.includes('**')) {
                    const parts = line.split(/\*\*/)
                    return (
                      <p key={i}>
                        {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-slate-800">{p}</strong> : p)}
                      </p>
                    )
                  }
                  return <p key={i}>{line}</p>
                })}
              </div>
            </section>
          ))}
        </main>
      </div>

      <footer className="border-t border-slate-100 py-8 px-4 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} Wanderwall Ltd. · <Link to="/terms" className="hover:text-slate-600">Terms of Service</Link> · <Link to="/" className="hover:text-slate-600">Back to app</Link></p>
      </footer>
    </div>
  )
}
