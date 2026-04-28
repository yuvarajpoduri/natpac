import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Shield, Smartphone, MapPin, BarChart3, ChevronRight, Activity, Globe } from 'lucide-react';

/* ── Brand Icon ── */
const RouteIcon = ({ size = 40, color = "#F5F230" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill={color}/>
    <circle cx="10" cy="22" r="3" fill="#111111"/>
    <circle cx="22" cy="10" r="3" fill="#111111"/>
    <circle cx="22" cy="10" r="1.2" fill={color}/>
    <path d="M10 19 C10 14, 22 18, 22 13" stroke="#111111" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="22" cy="10" r="5" stroke="#111111" strokeWidth="1" opacity="0.25" fill="none"/>
  </svg>
);

const FEATURES = [
  {
    icon: Smartphone,
    title: 'Automatic Trip Recording',
    desc: 'Simply carry your phone. Our app seamlessly recognizes your journeys without any manual effort.',
    color: '#3B82F6'
  },
  {
    icon: Activity,
    title: 'Smart Journey Detection',
    desc: 'Our advanced system instantly identifies your mode of transport, whether you are walking, driving, or taking the bus.',
    color: '#10B981'
  },
  {
    icon: MapPin,
    title: 'Interactive Travel Diary',
    desc: 'Review your complete travel history, discover your personal travel patterns, and see your daily distances.',
    color: '#8B5CF6'
  },
  {
    icon: Globe,
    title: 'Statewide Impact',
    desc: 'Your anonymised travel patterns help design better roads, safer pathways, and smarter public transport.',
    color: '#D97706'
  },
];

const LandingPage = () => {
  const [stats, setStats] = useState({ tripsCaptured: '100K+' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/analytics/public`);
        if (res.data.status === 'success') {
          setStats({
            tripsCaptured: res.data.data.tripsCaptured > 0 ? res.data.data.tripsCaptured.toLocaleString() : '100K+'
          });
        }
      } catch (err) {
        console.error('Failed to fetch public stats', err);
      }
    };
    fetchStats();
  }, []);

  return (
  <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#0F172A', background: '#F8FAFC', minHeight: '100vh', overflowX: 'hidden' }}>

    {/* ── Top Nav ── */}
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(1.5rem, 5vw, 4rem)', height: 72,
      background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <RouteIcon size={36} color="#F5F230" />
        <span style={{ fontSize: 20, fontWeight: 800, color: '#111111', letterSpacing: '-0.03em' }}>Routelytics</span>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Link to="/login" style={{
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
          color: '#475569', transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#111111'}
        onMouseLeave={e => e.currentTarget.style.color = '#475569'}
        >Log In</Link>
        <Link to="/signup" style={{
          padding: '10px 22px', borderRadius: 99,
          fontWeight: 700, fontSize: 14, textDecoration: 'none',
          background: '#F5F230', color: '#111111',
          boxShadow: '0 4px 14px rgba(245, 242, 48, 0.3)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 242, 48, 0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 242, 48, 0.3)'; }}
        >Get Started</Link>
      </div>
    </nav>

    {/* ── Hero ── */}
    <section style={{
      position: 'relative',
      padding: 'clamp(8rem, 15vh, 12rem) clamp(1.5rem, 5vw, 4rem) 6rem',
      textAlign: 'center',
      background: '#FFFFFF',
      overflow: 'hidden',
    }}>
      {/* Decorative gradient blobs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '10%',
        width: '60vw', height: '60vw', maxWidth: 800, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 242, 48, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%',
        width: '50vw', height: '50vw', maxWidth: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 242, 48, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '2rem',
          background: '#FEFCE8', border: '1px solid #FEF08A',
          borderRadius: 99, padding: '6px 16px', fontSize: 13, color: '#A16207', fontWeight: 700,
        }}>
          <Shield size={14} /> Official Initiative by Govt. of Kerala
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800,
          color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.03em',
          marginBottom: '1.5rem',
        }}>
          Shape the future of<br />
          <span style={{ color: '#EAB308' }}>transportation in Kerala.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)', color: '#475569',
          maxWidth: 640, margin: '0 auto 2.5rem', lineHeight: 1.6,
        }}>
          Join a state-wide movement to build smarter, safer, and more efficient transport systems. 
          Your everyday journeys help planners design the cities of tomorrow.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '16px 36px', borderRadius: 99,
            background: '#F5F230', color: '#111111',
            fontWeight: 700, fontSize: 16, textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(245, 242, 48, 0.25)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(245, 242, 48, 0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 242, 48, 0.25)'; }}
          >
            Start Contributing <ChevronRight size={18} />
          </Link>
        </div>

        {/* Floating Stats */}
        <div style={{
          display: 'flex', gap: 'clamp(1rem, 4vw, 4rem)', justifyContent: 'center',
          marginTop: '5rem', flexWrap: 'wrap',
          background: 'rgba(255, 255, 255, 0.8)', padding: '2rem',
          borderRadius: 24, border: '1px solid #F1F5F9',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04)',
          backdropFilter: 'blur(10px)',
        }}>
          {[
            { value: '14', label: 'Districts Covered', color: '#EAB308' },
            { value: stats.tripsCaptured, label: 'Journeys Recorded', color: '#EAB308' },
            { value: '100%', label: 'Privacy Protected', color: '#EAB308' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '0 1rem' }}>
              <div style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 14, color: '#64748B', fontWeight: 600, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Feature Grid ── */}
    <section style={{ padding: 'clamp(4rem, 10vw, 7rem) clamp(1.5rem, 5vw, 4rem)', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            A seamless experience.
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#64748B', maxWidth: 600, margin: '0 auto' }}>
            Everything you need to review your travel history and contribute to your city, beautifully designed and easy to use.
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} style={{
                background: '#FFFFFF', borderRadius: 24, padding: '2rem',
                border: '1px solid #F1F5F9',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'; }}
              >
                <div style={{ 
                  width: 56, height: 56, borderRadius: 16, background: `${f.color}15`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' 
                }}>
                  <Icon size={28} color={f.color} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: '0.75rem', color: '#0F172A' }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* ── CTA Banner ── */}
    <section style={{
      margin: '0 clamp(1.5rem, 5vw, 4rem) 4rem',
      background: 'linear-gradient(135deg, #111111 0%, #1A1A1A 100%)',
      borderRadius: 32, padding: '4rem 2rem',
      textAlign: 'center', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.1 }}>
        <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#F5F230" d="M45.7,-76.4C58.9,-69.3,69.1,-55.3,77.5,-41.2C85.9,-27.1,92.5,-13.6,91.8,-0.4C91.1,12.8,83.1,25.6,74.7,38.1C66.3,50.6,57.5,62.8,45.4,71.7C33.3,80.6,18,86.2,2.4,82.4C-13.2,78.6,-28.5,65.4,-41.8,54.8C-55.1,44.2,-66.4,36.2,-74.6,24.8C-82.8,13.4,-87.9,-1.4,-84.9,-14.8C-81.9,-28.2,-70.8,-40.2,-58.5,-48.5C-46.2,-56.8,-32.7,-61.4,-19.6,-66.9C-6.5,-72.4,6.2,-78.8,20.2,-78C34.2,-77.2,45.7,-76.4,45.7,-76.4Z" transform="translate(100 100)" />
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#FFFFFF', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Ready to make an impact?
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: '2.5rem', maxWidth: 500, margin: '0 auto 2.5rem' }}>
          Join thousands of citizens helping to shape the future of Kerala. It takes less than 2 minutes to get started.
        </p>
        <Link to="/signup" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '18px 40px', borderRadius: 99,
          background: '#F5F230', color: '#111111',
          fontWeight: 700, fontSize: 16, textDecoration: 'none',
          boxShadow: '0 10px 25px rgba(245,242,48,0.15)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >Create your account</Link>
      </div>
    </section>

    {/* ── Footer ── */}
    <footer style={{
      background: '#FFFFFF', padding: '2rem clamp(1.5rem, 5vw, 4rem)',
      borderTop: '1px solid #F1F5F9',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <RouteIcon size={24} color="#F5F230" />
        <span style={{ fontSize: 15, fontWeight: 800, color: '#111111' }}>Routelytics</span>
      </div>
      <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, textAlign: 'center' }}>
        © 2026 Developed for state transport planning. All rights reserved.
      </p>
      <div style={{ display: 'flex', gap: 24 }}>
        <Link to="/privacy" style={{ fontSize: 13, fontWeight: 500, color: '#64748B', textDecoration: 'none' }}>Privacy</Link>
        <Link to="/about" style={{ fontSize: 13, fontWeight: 500, color: '#64748B', textDecoration: 'none' }}>Terms</Link>
      </div>
    </footer>
  </div>
  );
};

export default LandingPage;
