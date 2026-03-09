import { useState } from 'react';
import { useAuthentication } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

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

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-mark">N</div>
          <span className="auth-logo-text">NATPAC Travel</span>
        </div>

        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-subheading">Sign in to your account to continue.</p>

        {errorMessage && <div className="auth-error">{errorMessage}</div>}

        <form onSubmit={handleLoginSubmission}>
          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?<Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
