import { useState } from 'react';
import { useAuthentication } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { loginUser } = useAuthentication();
  const navigate = useNavigate();

  const handleLoginSubmission = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    
    const loginResult = await loginUser(emailAddress, password);
    if (loginResult.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(loginResult.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">NATPAC Travel</h1>
          <p className="auth-subtitle">Welcome back! Please login to your account.</p>
        </div>

        {errorMessage && (
          <div style={{ color: 'var(--danger-red)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLoginSubmission}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="name@example.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="auth-button">Sign In</button>
        </form>

        <div className="auth-switch">
          Don't have an account? 
          <Link to="/signup" className="auth-link">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
