import { useState } from 'react';
import { useAuthentication } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

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

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-mark">N</div>
          <span className="auth-logo-text">NATPAC Travel</span>
        </div>

        <h1 className="auth-heading">Create account</h1>
        <p className="auth-subheading">Contribute to Kerala's transport future.</p>

        {errorMessage && <div className="auth-error">{errorMessage}</div>}

        <form onSubmit={handleSignupSubmission}>
          <div className="field">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
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
          <div className="field">
            <label>Account Type</label>
            <select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
              <option value="citizen">Citizen User</option>
              <option value="scientist">NATPAC Scientist</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?<Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
