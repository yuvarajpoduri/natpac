import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthenticationProvider, useAuthentication } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
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

  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

const MainLayout = ({ children }) => {
  const { currentUser, logoutUser } = useAuthentication();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const navItems = [{ to: '/dashboard', label: 'Dashboard' }];

  if (currentUser.userRole === 'citizen') {
    navItems.push(
      { to: '/diary', label: 'Travel Diary' },
      { to: '/simulate', label: 'Trip Simulator' },
      { to: '/my-stats', label: 'My Stats' }           // Feature 2 + 3 + 5 + 8
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

          <button
            className="topbar-menu-btn"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

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
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`menu-nav-link${location.pathname === to ? ' active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="menu-nav-label">{label}</span>
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

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthenticationProvider>
  );
}

export default App;
