import { Link } from 'react-router-dom'
import { FileText, ArrowLeft } from 'lucide-react'

const SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing or using Holidater ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.

These Terms constitute a legally binding agreement between you and Holidater Ltd., a company registered in Ireland. We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance.`
  },
  {
    id: 'services',
    title: '2. Description of Services',
    content: `Holidater provides a web-based trip planning platform that allows users to:

• Create and manage travel itineraries
• Track travel budgets in multiple currencies
• Search and compare flights and hotels via third-party partners
• Share travel experiences with the Holidater community
• Access AI-powered travel advice via our chat assistant
• View curated travel deals from our partners

We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.`
  },
  {
    id: 'accounts',
    title: '3. User Accounts',
    content: `**Registration:** You must provide accurate information when creating an account. You must be at least 16 years old to use Holidater.

**Security:** You are responsible for maintaining the confidentiality of your password. Notify us immediately at support@holidater.com if you suspect unauthorised access.

**One account per person:** Each user may maintain one account. Creating multiple accounts to circumvent restrictions is prohibited.

**Account deletion:** You may delete your account at any time. We will delete your personal data as described in our Privacy Policy.`
  },
  {
    id: 'content',
    title: '4. User Content',
    content: `**Your content:** You retain ownership of content you create (trip plans, photos, posts). By posting to the community feed, you grant Holidater a non-exclusive, royalty-free licence to display and distribute that content within the Service.

**Content standards:** All content must comply with our Community Guidelines. You must not post:
• Illegal, harmful, or offensive content
• Content that infringes third-party intellectual property
• Spam, misinformation, or misleading travel advice
• Personal data of others without consent

**Removal:** We reserve the right to remove content that violates these standards.`
  },
  {
    id: 'prohibited',
    title: '5. Prohibited Uses',
    content: `You agree not to:

• Use the Service for any unlawful purpose
• Attempt to gain unauthorised access to our systems
• Scrape, crawl, or extract data from the Service without permission
• Use automated bots or scripts to interact with the Service
• Reverse engineer, decompile, or disassemble any part of the Service
• Interfere with or disrupt the Service or servers connected to it
• Impersonate any person or entity
• Use the Service to send spam or unsolicited messages
• Use the AI assistant to generate harmful, illegal, or misleading content

Violation may result in immediate account suspension.`
  },
  {
    id: 'third-party',
    title: '6. Third-Party Links & Bookings',
    content: `Holidater contains links to third-party booking sites (Booking.com, Skyscanner, Airbnb, etc.). When you click these links, you leave Holidater and enter a third-party service.

We are not responsible for: the accuracy of third-party pricing or availability, any transactions made on third-party sites, or the third party's privacy practices.

Deals displayed on Holidater are provided in good faith but we make no guarantees of availability or pricing.`
  },
  {
    id: 'liability',
    title: '7. Limitation of Liability',
    content: `To the maximum extent permitted by Irish law:

• Holidater is provided "as is" without warranties of any kind
• We do not guarantee the accuracy of travel information, deals, or AI-generated advice
• We are not liable for any indirect, incidental, or consequential damages
• Our total liability to you shall not exceed €100 or the amount you paid us in the 12 months preceding the claim, whichever is greater
• We are not liable for losses caused by third-party booking sites, airlines, or hotels

Nothing in these Terms limits liability for death, personal injury, or fraudulent misrepresentation.`
  },
  {
    id: 'governing-law',
    title: '8. Governing Law',
    content: `These Terms are governed by and construed in accordance with the laws of Ireland. Any disputes arising from these Terms or your use of Holidater shall be subject to the exclusive jurisdiction of the courts of Ireland.

If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force.

**Consumer rights:** Nothing in these Terms affects your statutory rights as a consumer under Irish and EU consumer protection law.

**Contact for legal matters:**
Holidater Ltd.
Email: legal@holidater.com
Last updated: January 2026`
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Holidater
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display">Terms of Service</h1>
          </div>
          <p className="text-white/60 text-base">Last updated: January 2026 · Holidater Ltd., Dublin, Ireland</p>
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
            Please read these Terms of Service carefully before using Holidater. These terms govern your use of our trip planning platform and related services.
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
        <p>© {new Date().getFullYear()} Holidater Ltd. · <Link to="/privacy" className="hover:text-slate-600">Privacy Policy</Link> · <Link to="/" className="hover:text-slate-600">Back to app</Link></p>
      </footer>
    </div>
  )
}
