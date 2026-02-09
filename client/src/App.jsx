import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthenticationProvider, useAuthentication } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isAuthenticationLoading } = useAuthentication();

  if (isAuthenticationLoading) {
    return <div className="auth-container">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

const DashboardPlaceholder = () => {
  const { currentUser, logoutUser } = useAuthentication();
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <h1 className="auth-title">Welcome, {currentUser.fullName}</h1>
        <p className="auth-subtitle">You are logged in as a {currentUser.userRole}.</p>
        <div style={{ marginTop: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            This is the NATPAC Travel Data Collection Dashboard. 
            More features like trip tracking and maps will be added in the coming weeks.
          </p>
          <button onClick={logoutUser} className="auth-button" style={{ background: 'var(--card-background)' }}>
            Logout
          </button>
        </div>
      </div>
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
                <DashboardPlaceholder />
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
