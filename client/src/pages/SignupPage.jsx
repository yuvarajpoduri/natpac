import { useState } from 'react';
import { useAuthentication } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('citizen');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerUser } = useAuthentication();
  const navigate = useNavigate();

  const handleSignupSubmission = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    const signupResult = await registerUser(fullName, emailAddress, password, userRole);
    setIsSubmitting(false);
    if (signupResult.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(signupResult.message);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-frame" style={{ height: 'auto', minHeight: '600px' }}>
        <div className="login-content" style={{ paddingBottom: '40px' }}>
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
          
          <h1 className="login-heading" style={{ fontSize: '42px', marginBottom: '30px' }}>Welcome,<br/>Join Us!</h1>
          
          <div className="login-tabs">
            <Link to="/login" className="tab-muted" style={{ textDecoration: 'none' }}>I Am A Old User</Link>
            <span className="tab-slash">/</span>
            <span className="tab-active">Create New</span>
          </div>

          {errorMessage && <div className="login-error">{errorMessage}</div>}

          <form className="login-form" onSubmit={handleSignupSubmission} style={{ gap: '12px' }}>
            <div className="input-wrapper">
              <input
                type="text"
                className="input-field"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="input-wrapper">
              <input
                type="email"
                className="input-field"
                placeholder="Email Address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
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
                type="password"
                className="input-field"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-wrapper">
              <select 
                className="input-field" 
                value={userRole} 
                onChange={(e) => setUserRole(e.target.value)}
                style={{ appearance: 'none' }}
              >
                <option value="citizen">Citizen User</option>
                <option value="scientist">Scientist</option>
              </select>
              <div className="input-icon" style={{ pointerEvents: 'none', background: 'transparent', boxShadow: 'none' }}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={isSubmitting} style={{ marginTop: '10px' }}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ flex: 1 }}></div>

          <button type="button" className="skip-btn" onClick={handleSkip} style={{ marginTop: '30px' }}>
            Skip Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
