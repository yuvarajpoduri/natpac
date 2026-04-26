import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthenticationProvider, useAuthentication } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LandingPage from './pages/LandingPage';
import TravelDiary from './pages/TravelDiary';
import ScientistDashboard from './pages/ScientistDashboard';
import TripSimulator from './pages/TripSimulator';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import DataExport from './pages/DataExport';
import SystemHealth from './pages/SystemHealth';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import PersonalStatsDashboard from './pages/PersonalStatsDashboard';
import ScientistFilters from './pages/ScientistFilters';
import PrivacyPage from './pages/PrivacyPage';
import { Menu, X, LogOut } from 'lucide-react';

/* ── Brand Icon — Stylized route connecting two points ── */
const RouteIcon = ({ size = 30, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="32" height="32" rx="8" fill="#F5F230" />
    {/* Origin dot */}
    <circle cx="10" cy="22" r="3" fill="#111111" />
    {/* Destination pin */}
    <circle cx="22" cy="10" r="3" fill="#111111" />
    <circle cx="22" cy="10" r="1.2" fill="#F5F230" />
    {/* Route path */}
    <path
      d="M10 19 C10 14, 22 18, 22 13"
      stroke="#111111"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="0"
      fill="none"
    />
    {/* Pulse ring on destination */}
    <circle cx="22" cy="10" r="5" stroke="#111111" strokeWidth="1" opacity="0.25" fill="none" />
  </svg>
);

const ProtectedRoute = ({ children }) => {
  const { currentUser, isAuthenticationLoading } = useAuthentication();

  if (isAuthenticationLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
        <div style={{ color: '#888888', fontSize: '14px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Loading...</div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/" />;
  return children;
};

const MainLayout = ({ children }) => {
  const { currentUser, logoutUser } = useAuthentication();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();

  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const [pendingCount, setPendingCount] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rl_pending_trips') || '[]').length; } catch { return 0; }
  });

  // Re-check pending count when tab regains focus or goes online
  useEffect(() => {
    const refresh = () => {
      try { setPendingCount(JSON.parse(localStorage.getItem('rl_pending_trips') || '[]').length); } catch {}
    };
    window.addEventListener('focus',  refresh);
    window.addEventListener('online', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh); };
  }, []);

  const navItems = [{ to: '/dashboard', label: 'Dashboard' }];

  if (currentUser.userRole === 'citizen') {
    navItems.push(
      { to: '/diary',    label: 'Travel Diary' },
      { to: '/simulate', label: 'Trip Simulator', badge: pendingCount > 0 ? pendingCount : null },
      { to: '/my-stats', label: 'My Stats' },
    );
  }

  if (currentUser.userRole === 'scientist') {
    navItems.push(
      { to: '/analytics', label: 'Analytics' },
      { to: '/filters', label: 'Data Filters' },        // Feature 7 + 11
      { to: '/export', label: 'Data Export' },
      { to: '/system', label: 'System Monitor' }
    );
  }

  navItems.push(
    { to: '/profile', label: 'My Profile' },
    { to: '/privacy', label: 'Privacy' },              // Feature 10
    { to: '/about', label: 'About' }
  );

  const initials = currentUser.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* ── Fixed Topbar ── */}
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/dashboard" className="topbar-brand">
            <RouteIcon size={30} />
            <span className="topbar-logo-text">Routelytics</span>
          </Link>

          <nav className="desktop-nav">
            {navItems.map(({ to, label, badge }) => (
              <Link
                key={to}
                to={to}
                className={`desktop-nav-link${location.pathname === to ? ' active' : ''}`}
                style={{ position: 'relative' }}
              >
                {label}
                {badge && (
                  <span style={{
                    position: 'absolute', top: -6, right: -10,
                    background: '#F5F230', color: '#111',
                    borderRadius: '50%', width: 16, height: 16,
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}>{badge}</span>
                )}
              </Link>
            ))}
          </nav>

          <div className="desktop-user">
            <div className="avatar avatar-sm">{initials}</div>
            <span className="desktop-user-name">{currentUser.fullName}</span>
            <button className="desktop-logout-btn" onClick={logoutUser} title="Sign out">
              <LogOut size={16} />
            </button>
          </div>

          <button
            className="topbar-menu-btn"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* ── Offline Banner ── */}
      {!isOnline && (
        <div style={{
          background: '#78350F', color: '#FDE68A',
          padding: '8px 16px', textAlign: 'center',
          fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          position: 'sticky', top: 56, zIndex: 90,
        }}>
          <span>📴</span>
          You are offline — GPS tracking continues and trips are saved locally. They'll sync automatically when you reconnect.
        </div>
      )}
      {/* ── Full-Screen Overlay Menu ── */}
      <div className={`fullscreen-menu${isMenuOpen ? ' open' : ''}`}>
        <div className="menu-top-row">
          <RouteIcon size={28} />
          <button
            className="menu-close-btn"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={26} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="menu-nav">
          {navItems.map(({ to, label, badge }) => (
            <Link
              key={to}
              to={to}
              className={`menu-nav-link${location.pathname === to ? ' active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="menu-nav-label">
                {label}
                {badge && (
                  <span style={{
                    background: '#F5F230', color: '#111',
                    borderRadius: 99, padding: '1px 6px',
                    fontSize: 10, fontWeight: 800, marginLeft: 6,
                  }}>{badge}</span>
                )}
              </span>
              {location.pathname === to && <span className="menu-nav-dot" />}
            </Link>
          ))}
        </nav>

        <div className="menu-footer">
          <div className="menu-user">
            <div className="avatar">{initials}</div>
            <div>
              <div className="menu-user-name">{currentUser.fullName}</div>
              <div className="menu-user-role">{currentUser.userRole}</div>
            </div>
          </div>
          <button className="menu-logout-btn" onClick={logoutUser}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="app-main">
        {children}
      </main>
    </>
  );
};

function App() {
  return (
    <AuthenticationProvider>
      <Router>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Shared */}
          <Route path="/dashboard" element={<ProtectedRoute><MainLayout><ScientistDashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
          <Route path="/about"     element={<ProtectedRoute><MainLayout><AboutPage /></MainLayout></ProtectedRoute>} />

          {/* Feature 10: Privacy page */}
          <Route path="/privacy"   element={<ProtectedRoute><MainLayout><PrivacyPage /></MainLayout></ProtectedRoute>} />

          {/* Citizen */}
          <Route path="/diary"    element={<ProtectedRoute><MainLayout><TravelDiary /></MainLayout></ProtectedRoute>} />
          <Route path="/simulate" element={<ProtectedRoute><MainLayout><TripSimulator /></MainLayout></ProtectedRoute>} />

          {/* Feature 2 + 3 + 5 + 8: Personal Stats */}
          <Route path="/my-stats" element={<ProtectedRoute><MainLayout><PersonalStatsDashboard /></MainLayout></ProtectedRoute>} />

          {/* Scientist */}
          <Route path="/analytics" element={<ProtectedRoute><MainLayout><AdvancedAnalytics /></MainLayout></ProtectedRoute>} />

          {/* Feature 7 + 11: Scientist Filters & AI Accuracy */}
          <Route path="/filters" element={<ProtectedRoute><MainLayout><ScientistFilters /></MainLayout></ProtectedRoute>} />

          <Route path="/export" element={<ProtectedRoute><MainLayout><DataExport /></MainLayout></ProtectedRoute>} />
          <Route path="/system" element={<ProtectedRoute><MainLayout><SystemHealth /></MainLayout></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthenticationProvider>
  );
}

export default App;
