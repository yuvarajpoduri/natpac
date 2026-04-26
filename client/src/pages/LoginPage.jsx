import { useState } from 'react';
import { useAuthentication } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginUser } = useAuthentication();
  const navigate = useNavigate();

  const handleLoginSubmission = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    const loginResult = await loginUser(emailAddress, password);
    setIsSubmitting(false);
    if (loginResult.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(loginResult.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-frame">
        <div className="login-content">
          <div className="login-brand-row">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#F5F230"/>
              <circle cx="10" cy="22" r="3" fill="#111111"/>
              <circle cx="22" cy="10" r="3" fill="#111111"/>
              <circle cx="22" cy="10" r="1.2" fill="#F5F230"/>
              <path d="M10 19 C10 14, 22 18, 22 13" stroke="#111111" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <circle cx="22" cy="10" r="5" stroke="#111111" strokeWidth="1" opacity="0.25" fill="none"/>
            </svg>
            <span className="login-brand-text">Routelytics</span>
          </div>
          
          <h1 className="login-heading">Welcome<br/>Back!</h1>
          
          <div className="login-tabs">
            <span className="tab-muted">Returning User</span>
            <span className="tab-slash">/</span>
            <Link to="/signup" className="tab-active">Create Account</Link>
          </div>

          {errorMessage && <div className="login-error">{errorMessage}</div>}

          <form className="login-form" onSubmit={handleLoginSubmission}>
            <div className="input-wrapper">
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="Email Address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                autoComplete="email"
                required
              />
              {emailAddress && (
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13L9 17L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>

            <div className="input-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-icon"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="login-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Login Now'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', marginTop: '1rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#111', fontWeight: 600, textDecoration: 'none' }}>
              Sign up free
            </Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#aaa', marginTop: '0.75rem', lineHeight: 1.5 }}>
            For NATPAC scientists: use the credentials provided by your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
