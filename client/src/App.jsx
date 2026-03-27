import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthenticationProvider, useAuthentication } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TravelDiary from './pages/TravelDiary';
import ScientistDashboard from './pages/ScientistDashboard';
import TripSimulator from './pages/TripSimulator';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import DataExport from './pages/DataExport';
import { LayoutDashboard, BookOpen, Activity, LogOut, Menu, BarChart3, Download } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isAuthenticationLoading } = useAuthentication();

  if (isAuthenticationLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

const SidebarContent = ({ currentUser, logoutUser, onClose }) => {
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
  ];

  if (currentUser.userRole === 'citizen') {
    navItems.push(
      { to: '/diary', icon: BookOpen, label: 'Travel Diary' },
      { to: '/simulate', icon: Activity, label: 'Trip Simulator' }
    );
  }

  if (currentUser.userRole === 'scientist') {
    navItems.push(
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/export', icon: Download, label: 'Data Export' }
    );
  }

  const initials = currentUser.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">N</div>
        <div>
          <div className="sidebar-brand-name">NATPAC</div>
          <div className="sidebar-brand-tag">Travel Intelligence</div>
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        <div className="sidebar-section-label">Menu</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`nav-link${location.pathname === to ? ' active' : ''}`}
            onClick={onClose}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="user-name">{currentUser.fullName}</div>
            <div className="user-role">{currentUser.userRole}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={logoutUser}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </>
  );
};

const MainLayout = ({ children }) => {
  const { currentUser, logoutUser } = useAuthentication();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitles = {
    '/dashboard': 'Dashboard',
    '/diary': 'Travel Diary',
    '/simulate': 'Trip Simulator',
    '/analytics': 'Analytics',
    '/export': 'Data Export'
  };

  return (
    <div className="app-layout">
      <div className={`sidebar-overlay${isSidebarOpen ? '' : ' hidden'}`} onClick={() => setIsSidebarOpen(false)} />

      <aside className={`sidebar${isSidebarOpen ? ' open' : ''}`}>
        <SidebarContent
          currentUser={currentUser}
          logoutUser={logoutUser}
          onClose={() => setIsSidebarOpen(false)}
        />
      </aside>

      <div className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="sidebar-brand-mark" style={{ width: 26, height: 26, fontSize: '0.75rem' }}>N</div>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
            {pageTitles[location.pathname] || 'NATPAC'}
          </span>
        </div>
      </div>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthenticationProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout><ScientistDashboard /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/diary"
            element={
              <ProtectedRoute>
                <MainLayout><TravelDiary /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/simulate"
            element={
              <ProtectedRoute>
                <MainLayout><TripSimulator /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <MainLayout><AdvancedAnalytics /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/export"
            element={
              <ProtectedRoute>
                <MainLayout><DataExport /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthenticationProvider>
  );
}

export default App;
