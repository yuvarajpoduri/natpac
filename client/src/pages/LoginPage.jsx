import { useState } from 'react';
import { useAuthentication } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
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
      setErrorMessage(loginResult.message);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
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
          
          <h1 className="login-heading">Hey,<br/>Login Now!</h1>
          
          <div className="login-tabs">
            <span className="tab-muted">I Am A Old User</span>
            <span className="tab-slash">/</span>
            <Link to="/signup" className="tab-active">Create New</Link>
          </div>

          {errorMessage && <div className="login-error">{errorMessage}</div>}

          <form className="login-form" onSubmit={handleLoginSubmission}>
            <div className="input-wrapper">
              <input
                type="text"
                className="input-field"
                placeholder="Dstudio_Agency"
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

            <div className="login-options">
              <span className="tab-muted">Forget Password?</span>
              <span className="tab-slash">/</span>
              <Link to="/reset-password" className="tab-active">Reset</Link>
            </div>

            <button type="submit" className="login-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Login Now'}
            </button>
          </form>

          <button type="button" className="skip-btn" onClick={handleSkip}>
            Skip Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
