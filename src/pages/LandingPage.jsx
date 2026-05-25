import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const DESTINATIONS = [
  { name: "Santorini", country: "Greece", count: "1,847", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=85&auto=format&fit=crop" },
  { name: "Kyoto", country: "Japan", count: "2,341", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=85&auto=format&fit=crop" },
  { name: "Amalfi Coast", country: "Italy", count: "983", image: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1200&q=85&auto=format&fit=crop" },
  { name: "Bali", country: "Indonesia", count: "3,102", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85&auto=format&fit=crop" },
  { name: "Patagonia", country: "Argentina", count: "412", image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=85&auto=format&fit=crop" },
  { name: "Morocco", country: "Africa", count: "1,204", image: "https://images.unsplash.com/photo-1539020140153-e479b8d22a8a?w=1200&q=85&auto=format&fit=crop" },
];

const FEATURES = [
  { icon: "🧬", title: "Your Travel DNA", desc: "Spotify Wrapped for travel. Badges, scores, and a unique identity that evolves with every trip you take.", img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&q=80&auto=format&fit=crop" },
  { icon: "🔥", title: "Find Your Match", desc: "Our compatibility algorithm finds travellers who move the same way you do — not just anyone, your people.", img: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=500&q=80&auto=format&fit=crop" },
  { icon: "🤖", title: "AI Trip Companion", desc: "Visa checklists, packing lists, countdown timers, and destination intel. Your AI co-pilot for every trip.", img: "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=500&q=80&auto=format&fit=crop" },
];

function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [start, target, duration]);
  return count;
}

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [countersVisible, setCountersVisible] = useState(false);
  const counterRef = useRef(null);

  const travellers = useCounter(24817, 2200, countersVisible);
  const trips = useCounter(8432, 2000, countersVisible);
  const destinations = useCounter(194, 1800, countersVisible);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setCountersVisible(true); }, { threshold: 0.3 });
    if (counterRef.current) obs.observe(counterRef.current);
    return () => obs.disconnect();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: "#fff", color: "#1a1a2e", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .grad-text { background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 13px 26px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 10px; transition: opacity .2s, transform .2s; }
        .btn-primary:hover { opacity: .9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: .7; cursor: not-allowed; }
        .btn-secondary { background: #f8f8ff; color: #6366f1; border: 1.5px solid #e0e0ff; padding: 13px 22px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background .2s; text-decoration: none; display: inline-flex; align-items: center; }
        .btn-secondary:hover { background: #f0f0ff; }
        .feat-card { background: #fff; border: 1.5px solid #f0f0f5; border-radius: 20px; overflow: hidden; transition: box-shadow .2s, transform .2s; }
        .feat-card:hover { box-shadow: 0 12px 40px rgba(99,102,241,.12); transform: translateY(-4px); }
        .feat-card img { transition: transform .5s; display: block; width: 100%; height: 100%; object-fit: cover; }
        .feat-card:hover img { transform: scale(1.04); }
        .dest-card { border-radius: 16px; overflow: hidden; position: relative; cursor: pointer; }
        .dest-card img { transition: transform .4s; display: block; width: 100%; height: 100%; object-fit: cover; }
        .dest-card:hover img { transform: scale(1.04); }
        .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: pulse-g 2s infinite; display: inline-block; flex-shrink: 0; }
        @keyframes pulse-g { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.4)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,0)} }
        .nav-link { font-size: 14px; color: #6b7280; text-decoration: none; font-weight: 500; transition: color .2s; }
        .nav-link:hover { color: #6366f1; }
        .foot-link { font-size: 13px; color: #9ca3af; text-decoration: none; transition: color .2s; }
        .foot-link:hover { color: #6366f1; }
        @media(max-width:768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-visual { display: none !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .dest-grid { grid-template-columns: 1fr 1fr !important; }
          .compat-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
          h1 { font-size: 36px !important; }
          .stats-row { flex-direction: column; gap: 24px; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 48px", borderBottom: "1px solid #f0f0f5", background: "#fff", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16 }}>🌍</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#1a1a2e", letterSpacing: "-0.02em" }}>Wanderwall</div>
            <div style={{ fontSize: 9, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" }}>Travel. Experience. Remember.</div>
          </div>
        </div>
        <div className="nav-links" style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <a href="/explore" className="nav-link">Explore</a>
          <a href="/deals" className="nav-link">Deals</a>
          <a href="/feed" className="nav-link">Community</a>
        </div>
        <button onClick={handleLogin} className="btn-primary" style={{ padding: "10px 20px", fontSize: 14 }} disabled={loading}>
          <GoogleIcon /> Sign in with Google
        </button>
      </nav>

      {/* HERO */}
      <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", padding: "72px 48px 0", maxWidth: 1200, margin: "0 auto" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0f0ff", border: "1px solid #e0e0ff", color: "#6366f1", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 100, marginBottom: 24 }}>
            <span className="live-dot" /> 24,817 travellers online now
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#1a1a2e", marginBottom: 20 }}>
            Travel. Experience.<br /><span className="grad-text">Remember.</span>
          </h1>
          <p style={{ fontSize: 17, color: "#6b7280", lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
            Discover your travel identity, find travellers who match your vibe, and book the trip you've been putting off since forever.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 40, flexWrap: "wrap" }}>
            <button onClick={handleLogin} className="btn-primary" disabled={loading}>
              <GoogleIcon /> {loading ? "Getting ready…" : "Continue with Google"}
            </button>
            <a href="/explore" className="btn-secondary">Explore first →</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex" }}>
              {["photo-1494790108377-be9c29b29330","photo-1507003211169-0a1dd7228f2d","photo-1438761681033-6461ffad8d80","photo-1472099645785-5658abf4ff4e"].map((id, i) => (
                <img key={id} src={`https://images.unsplash.com/${id}?w=60&q=80&auto=format&fit=crop&crop=face`} alt="" style={{ width: 32, height: 32, borderRadius: "50%", border: "2.5px solid #fff", objectFit: "cover", marginLeft: i > 0 ? -10 : 0 }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: "#6b7280" }}>Join <strong style={{ color: "#1a1a2e" }}>24,817</strong> explorers already on Wanderwall</span>
          </div>
        </div>
        <div className="hero-visual" style={{ position: "relative" }}>
          <img src={DESTINATIONS[0].image} alt="Santorini" style={{ width: "100%", height: 420, objectFit: "cover", borderRadius: 20, display: "block" }} />
          <div style={{ position: "absolute", bottom: -20, left: -20, background: "white", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🌍</div>
            <div><div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>Trips planned today</div><div style={{ fontSize: 15, color: "#1a1a2e", fontWeight: 700 }}>1,204 trips</div></div>
          </div>
          <div style={{ position: "absolute", top: 20, right: -16, background: "white", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", padding: "14px 20px" }}>
            <div style={{ fontSize: 28, fontWeight: 700, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>92%</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Travel compatibility</div>
            <div style={{ height: 6, background: "#f0f0ff", borderRadius: 3, marginTop: 8, width: 120, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(to right,#6366f1,#8b5cf6)", borderRadius: 3, width: "92%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div ref={counterRef} style={{ background: "#f8f8ff", borderTop: "1px solid #f0f0f5", borderBottom: "1px solid #f0f0f5", padding: "48px", marginTop: 80 }}>
        <div className="stats-row" style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {[{ n: travellers, l: "Travellers exploring" }, { n: trips, l: "Trips planned" }, { n: destinations, l: "Destinations mapped" }].map((s, i) => (
            <div key={s.l} style={{ display: "contents" }}>
              {i > 0 && <div style={{ width: 1, height: 48, background: "#e5e7eb", flexShrink: 0 }} />}
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.n.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4, fontWeight: 500 }}>{s.l}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ padding: "80px 48px", background: "#fafafa" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6366f1", marginBottom: 12 }}>Everything you need</p>
            <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", color: "#1a1a2e", marginBottom: 12 }}>Built for real travellers</h2>
            <p style={{ fontSize: 16, color: "#6b7280", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>From solo backpackers to luxury nomads — Wanderwall is the social layer your travel life has been missing.</p>
          </div>
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feat-card">
                <div style={{ height: 200, overflow: "hidden" }}>
                  <img src={f.img} alt={f.title} />
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontSize: 20 }}>{f.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>{f.title}</div>
                  <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COMPATIBILITY */}
      <div style={{ padding: "80px 48px" }}>
        <div className="compat-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div style={{ borderRadius: 20, overflow: "hidden", height: 400, position: "relative" }}>
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80&auto=format&fit=crop" alt="Friends travelling" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))" }} />
            <div style={{ position: "absolute", bottom: 24, left: 24, background: "white", borderRadius: 16, padding: "16px 20px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: 36, fontWeight: 700, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>92%</div>
              <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>Travel compatibility score</div>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6366f1", marginBottom: 12 }}>Travel Compatibility</p>
            <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", color: "#1a1a2e", marginBottom: 16 }}>Who do you <span className="grad-text">travel like?</span></h2>
            <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, marginBottom: 28 }}>Our algorithm analyses your travel style, pace, budget, and vibe — then finds the people you'd actually want to travel with.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
              {["Match on travel pace, budget & style", "Find others going to the same destination", "Message, follow, and plan trips together"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#4b5563" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {t}
                </div>
              ))}
            </div>
            <button onClick={handleLogin} className="btn-primary" disabled={loading}>Discover your travel match</button>
          </div>
        </div>
      </div>

      {/* DESTINATIONS */}
      <div style={{ padding: "80px 48px", background: "#fafafa" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6366f1", marginBottom: 8 }}>Live on Wanderwall</p>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: "#1a1a2e", letterSpacing: "-0.02em", margin: 0 }}>Where everyone's going</h2>
            </div>
            <a href="/explore" style={{ fontSize: 13, fontWeight: 600, color: "#6366f1", textDecoration: "none" }}>View all destinations →</a>
          </div>
          <div className="dest-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {DESTINATIONS.map((d, i) => (
              <div key={d.name} className="dest-card" style={{ height: (i === 0 || i === 3) ? 260 : 190 }}>
                <img src={d.image} alt={d.name} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,26,46,0.75) 0%, transparent 55%)" }} />
                <div style={{ position: "absolute", bottom: 16, left: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>{d.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 3, fontWeight: 500 }}>
                    <span className="live-dot" style={{ width: 6, height: 6 }} /> {d.count} travellers
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ padding: "80px 48px", textAlign: "center", background: "linear-gradient(135deg, #f0f0ff 0%, #faf0ff 100%)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6366f1", marginBottom: 16 }}>Your next adventure awaits</p>
        <h2 style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.03em", color: "#1a1a2e", marginBottom: 16 }}>Stop dreaming.<br /><span className="grad-text">Start going.</span></h2>
        <p style={{ fontSize: 16, color: "#6b7280", maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.7 }}>Join thousands of travellers already discovering, connecting, and exploring on Wanderwall.</p>
        <button onClick={handleLogin} className="btn-primary" style={{ margin: "0 auto" }} disabled={loading}>
          <GoogleIcon /> {loading ? "Getting ready…" : "Join Wanderwall — it's free"}
        </button>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 14 }}>No credit card. No commitment. Just travel.</p>
      </div>

      {/* FOOTER */}
      <footer style={{ padding: "36px 48px", borderTop: "1px solid #f0f0f5", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>Wanderwall 🌍</div>
        <div style={{ display: "flex", gap: 28 }}>
          {[["Privacy Policy", "/privacy"], ["Terms", "/terms"], ["Help & Support", "/support"], ["About", "/about"]].map(([l, h]) => (
            <a key={l} href={h} className="foot-link">{l}</a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#d1d5db" }}>© {new Date().getFullYear()} Wanderwall. Travel differently.</div>
      </footer>
    </div>
  );
}
