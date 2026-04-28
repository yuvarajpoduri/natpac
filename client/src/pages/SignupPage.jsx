import { useState } from 'react';
import { useAuthentication } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';

const CONSENT_TEXT = `By creating an account on Routelytics, you agree to allow NATPAC to collect your travel data through this application. Your data will be:

• Anonymised before being displayed in the research dashboard
• Used solely for transportation planning and research purposes
• Protected and stored securely

You may pause or stop data collection at any time using the Privacy Settings in your account.`;

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userRole, setUserRole] = useState('citizen');
  const [consentGiven, setConsentGiven] = useState(false);
  const [showFullConsent, setShowFullConsent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerUser } = useAuthentication();
  const navigate = useNavigate();

  const handleSignupSubmission = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (!consentGiven) {
      setErrorMessage('You must read and accept the data collection consent to register.');
      return;
    }

    setIsSubmitting(true);
    const signupResult = await registerUser(fullName, emailAddress, password, userRole);
    setIsSubmitting(false);
    if (signupResult.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(signupResult.message || 'Registration failed. Please try again.');
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
          
          <h1 className="login-heading">Join<br/>Routelytics!</h1>
          
          <div className="login-tabs">
            <Link to="/login" className="tab-muted">Already a member</Link>
            <span className="tab-slash">/</span>
            <span className="tab-active">Create Account</span>
          </div>

          {errorMessage && <div className="login-error">{errorMessage}</div>}

          <form className="login-form" onSubmit={handleSignupSubmission}>
            <div className="input-wrapper">
              <input
                id="signup-name"
                type="text"
                className="input-field"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="input-wrapper">
              <input
                id="signup-email"
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
                id="signup-password"
                type="password"
                className="input-field"
                placeholder="Password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="input-wrapper">
              <input
                id="signup-confirm-password"
                type="password"
                className="input-field"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="input-wrapper" style={{ display: 'none' }}>
              <select
                id="signup-role"
                className="input-field"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
              >
                <option value="citizen">Citizen User (Data Provider)</option>
              </select>
            </div>

            {/* Consent Section */}
            <div style={{
              background: '#F8F8F8',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              padding: '0.875rem',
              marginBottom: '0.75rem'
            }}>
              <p style={{ fontSize: '11px', color: '#666', lineHeight: 1.6, marginBottom: '0.5rem', whiteSpace: 'pre-line' }}>
                {showFullConsent ? CONSENT_TEXT : `${CONSENT_TEXT.substring(0, 115)}...`}
              </p>
              <button 
                type="button" 
                onClick={() => setShowFullConsent(!showFullConsent)} 
                style={{ background: 'none', border: 'none', color: '#111', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: '0.75rem', textDecoration: 'underline' }}>
                {showFullConsent ? 'Show Less' : 'Show Full'}
              </button>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer' }}>
                <input
                  id="signup-consent"
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  style={{ marginTop: '2px', flexShrink: 0, width: 16, height: 16, cursor: 'pointer', accentColor: '#111' }}
                />
                <span style={{ fontSize: '12px', color: '#333', fontWeight: 500, lineHeight: 1.5 }}>
                  I have read and agree to the data collection terms above.
                </span>
              </label>
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              className="login-btn"
              disabled={isSubmitting || !consentGiven}
              style={{ opacity: !consentGiven ? 0.6 : 1 }}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', marginTop: '1rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#111', fontWeight: 600, textDecoration: 'none' }}>
              Login now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
