import { Link } from 'react-router-dom';

/* ── Brand Icon ── */
const RouteIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#F5F230"/>
    <circle cx="10" cy="22" r="3" fill="#111111"/>
    <circle cx="22" cy="10" r="3" fill="#111111"/>
    <circle cx="22" cy="10" r="1.2" fill="#F5F230"/>
    <path d="M10 19 C10 14, 22 18, 22 13" stroke="#111111" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="22" cy="10" r="5" stroke="#111111" strokeWidth="1" opacity="0.25" fill="none"/>
  </svg>
);

const FEATURES = [
  {
    emoji: '📡',
    title: 'Passive GPS Tracking',
    desc: 'Records your journeys automatically in the background. No effort required — just carry your phone.',
  },
  {
    emoji: '🤖',
    title: 'AI Mode Detection',
    desc: 'Our Random Forest model identifies your travel mode — walk, car, bus, auto-rickshaw, ferry — instantly.',
  },
  {
    emoji: '✅',
    title: 'One-Tap Validation',
    desc: 'Review the AI prediction and confirm or correct it in under 2 minutes. Your input improves accuracy.',
  },
  {
    emoji: '🗺️',
    title: 'Live Dashboard',
    desc: 'NATPAC scientists see real-time trip heatmaps, O-D matrices, and modal share charts across all 14 districts.',
  },
  {
    emoji: '📴',
    title: 'Works Offline',
    desc: 'GPS data is saved to your device and auto-synced to the cloud when connectivity is restored. No data loss.',
  },
  {
    emoji: '🔒',
    title: 'Privacy First',
    desc: 'Your data is anonymised before any sharing. You can pause or stop tracking anytime from Privacy Settings.',
  },
];

const STEPS = [
  { num: '01', title: 'Register', desc: 'Create a free account and grant GPS permissions. Takes under 2 minutes.' },
  { num: '02', title: 'Travel Normally', desc: 'Go about your day. Routelytics records your journeys silently in the background.' },
  { num: '03', title: 'Validate Trips', desc: "Confirm the AI's mode prediction once you reach your destination." },
  { num: '04', title: 'Contribute to Kerala', desc: 'Your anonymised data helps NATPAC plan better roads, buses, and public transport.' },
];

const LandingPage = () => (
  <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#111111', background: '#ffffff', minHeight: '100vh' }}>

    {/* ── Top Nav ── */}
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(1rem, 5vw, 3rem)', height: 64,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #F0F0F0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <RouteIcon size={32} />
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>Routelytics</span>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link to="/login" style={{
          padding: '8px 18px', borderRadius: 10,
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
          border: '1.5px solid #E0E0E0', color: '#333333',
          transition: 'border-color 0.15s',
        }}>Login</Link>
        <Link to="/signup" style={{
          padding: '8px 18px', borderRadius: 10,
          fontWeight: 700, fontSize: 14, textDecoration: 'none',
          background: '#F5F230', color: '#111111',
        }}>Get Started</Link>
      </div>
    </nav>

    {/* ── Hero ── */}
    <section style={{
      background: 'linear-gradient(135deg, #111111 0%, #1a1a2e 50%, #16213e 100%)',
      padding: 'clamp(4rem, 12vw, 7rem) clamp(1rem, 5vw, 3rem)',
      textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative gradient blob */}
      <div style={{
        position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
        width: '60vw', height: '60vw', maxWidth: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,242,48,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem',
        background: 'rgba(245,242,48,0.15)', border: '1px solid rgba(245,242,48,0.3)',
        borderRadius: 99, padding: '6px 14px', fontSize: 12, color: '#F5F230', fontWeight: 600,
        letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5F230', display: 'inline-block' }} />
        NATPAC · KSCSTE · Government of Kerala
      </div>

      <h1 style={{
        fontSize: 'clamp(2.2rem, 7vw, 4.5rem)', fontWeight: 900,
        color: '#FFFFFF', lineHeight: 1.08, letterSpacing: '-0.03em',
        marginBottom: '1.25rem',
      }}>
        Kerala's Smart<br />
        <span style={{ color: '#F5F230' }}>Travel Intelligence</span><br />
        Platform
      </h1>

      <p style={{
        fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'rgba(255,255,255,0.65)',
        maxWidth: 580, margin: '0 auto 2.5rem', lineHeight: 1.65,
      }}>
        Join Routelytics to passively record your journeys and contribute to
        evidence-based transport planning across all 14 districts of Kerala.
        Powered by AI. Trusted by NATPAC.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/signup" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '14px 28px', borderRadius: 14,
          background: '#F5F230', color: '#111111',
          fontWeight: 800, fontSize: 15, textDecoration: 'none',
          boxShadow: '0 8px 32px rgba(245,242,48,0.35)',
          transition: 'transform 0.15s',
        }}>
          🚀 Start Contributing
        </Link>
        <Link to="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '14px 28px', borderRadius: 14,
          background: 'transparent', color: 'rgba(255,255,255,0.85)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          fontWeight: 700, fontSize: 15, textDecoration: 'none',
        }}>
          🔑 Scientist Login
        </Link>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex', gap: 'clamp(1.5rem, 5vw, 3.5rem)', justifyContent: 'center',
        marginTop: '3.5rem', flexWrap: 'wrap',
      }}>
        {[
          { value: '14', label: 'Districts of Kerala' },
          { value: '80%+', label: 'AI Mode Accuracy' },
          { value: '0₹', label: 'Cost to Deploy' },
          { value: '∞', label: 'Continuous Data' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 900, color: '#F5F230', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* ── Feature Grid ── */}
    <section style={{ padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 5vw, 3rem)', background: '#FAFAF8' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#AAAAAA', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            PLATFORM CAPABILITIES
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 800, marginTop: 8, letterSpacing: '-0.02em' }}>
            Everything transport planners need
          </h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: '#FFFFFF', borderRadius: 20, padding: '1.5rem',
              border: '1px solid #EBEBEB',
              transition: 'box-shadow 0.18s, transform 0.18s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: 28, marginBottom: '0.75rem' }}>{f.emoji}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: '0.5rem', color: '#111111' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#666666', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── How It Works ── */}
    <section style={{ padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 5vw, 3rem)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#AAAAAA', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            HOW IT WORKS
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 800, marginTop: 8, letterSpacing: '-0.02em' }}>
            Four steps to better transport data
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          {STEPS.map((step) => (
            <div key={step.num} style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: '#F5F230', color: '#111111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, margin: '0 auto 1rem',
              }}>{step.num}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#111111' }}>{step.title}</h3>
              <p style={{ fontSize: 13, color: '#666666', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA Banner ── */}
    <section style={{
      background: '#111111', padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 5vw, 3rem)',
      textAlign: 'center',
    }}>
      <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
        Ready to shape Kerala's transport future?
      </h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: '2rem', maxWidth: 480, margin: '0 auto 2rem' }}>
        Join as a citizen contributor or access the scientist dashboard. Both are free.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/signup" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '14px 28px', borderRadius: 14,
          background: '#F5F230', color: '#111111',
          fontWeight: 800, fontSize: 15, textDecoration: 'none',
        }}>Join as Citizen</Link>
        <Link to="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '14px 28px', borderRadius: 14,
          background: 'transparent', color: '#F5F230',
          border: '1.5px solid #F5F230',
          fontWeight: 700, fontSize: 15, textDecoration: 'none',
        }}>Scientist Access</Link>
      </div>
    </section>

    {/* ── Footer ── */}
    <footer style={{
      background: '#0A0A0A', padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 5vw, 3rem)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <RouteIcon size={24} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#888' }}>Routelytics</span>
      </div>
      <p style={{ fontSize: 12, color: '#555', margin: 0, textAlign: 'center' }}>
        © 2026 NATPAC, KSCSTE, Government of Kerala · Built by Yuvaraj, Vishnu & Yaseen
      </p>
      <div style={{ display: 'flex', gap: 16 }}>
        <Link to="/privacy" style={{ fontSize: 12, color: '#555', textDecoration: 'none' }}>Privacy Policy</Link>
        <Link to="/about" style={{ fontSize: 12, color: '#555', textDecoration: 'none' }}>About</Link>
      </div>
    </footer>
  </div>
);

export default LandingPage;
