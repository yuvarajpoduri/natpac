import { useState } from 'react';
import { useAuthentication } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('citizen');
  const [errorMessage, setErrorMessage] = useState('');
  const { registerUser } = useAuthentication();
  const navigate = useNavigate();

  const handleSignupSubmission = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    
    const signupResult = await registerUser(fullName, emailAddress, password, userRole);
    if (signupResult.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(signupResult.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">NATPAC Join</h1>
          <p className="auth-subtitle">Contribute to Kerala's transport future.</p>
        </div>

        {errorMessage && (
          <div style={{ color: 'var(--danger-red)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSignupSubmission}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
            />
          </div>
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
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select 
              className="form-input"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
            >
              <option value="citizen">Citizen User</option>
              <option value="scientist">NATPAC Scientist</option>
            </select>
          </div>
          <button type="submit" className="auth-button">Create Account</button>
        </form>

        <div className="auth-switch">
          Already have an account? 
          <Link to="/login" className="auth-link">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
