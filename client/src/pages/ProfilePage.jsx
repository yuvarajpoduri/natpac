import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthentication } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Navigation, CheckCircle, Route, Lock, Eye, EyeOff } from 'lucide-react';

const ProfilePage = () => {
  const { currentUser } = useAuthentication();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const authToken = localStorage.getItem('natpac_token');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/profile/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      setProfileData(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'New password must be at least 6 characters', type: 'error' });
      return;
    }
    setIsPasswordChanging(true);
    setPasswordMessage({ text: '', type: '' });
    try {
      await axios.patch('http://localhost:5000/api/profile/password',
        { currentPassword, newPassword },
        { headers: { 'Authorization': `Bearer ${authToken}` } }
      );
      setPasswordMessage({ text: 'Password updated successfully', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      setPasswordMessage({ text: error.response?.data?.message || 'Failed to update password', type: 'error' });
    } finally {
      setIsPasswordChanging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-pulse" style={{ color: 'var(--text-secondary)' }}>Loading profile...</div>
      </div>
    );
  }

  const initials = profileData?.fullName?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'NA';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Account information and security</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '1rem'
          }}>
            {initials}
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>{profileData?.fullName}</div>
          <span className={`badge ${profileData?.userRole === 'scientist' ? 'badge-success' : 'badge-brand'}`} style={{ fontSize: '0.75rem' }}>
            {profileData?.userRole === 'scientist' ? 'NATPAC Scientist' : 'Citizen User'}
          </span>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Member since {new Date(profileData?.accountCreatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="card">
          <div className="card-label" style={{ marginBottom: '1.25rem' }}><User size={13} /> Account Details</div>
          <div className="stack">
            {[
              { icon: User, label: 'Full Name', value: profileData?.fullName },
              { icon: Mail, label: 'Email', value: profileData?.emailAddress },
              { icon: Shield, label: 'Role', value: profileData?.userRole },
              { icon: Calendar, label: 'Joined', value: new Date(profileData?.accountCreatedAt).toLocaleDateString() }
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <Icon size={15} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {profileData?.statistics && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
          <div className="card">
            <div className="card-label"><Navigation size={13} /> Total Trips</div>
            <div className="stat-value">{profileData.statistics.totalTrips}</div>
          </div>
          <div className="card">
            <div className="card-label"><CheckCircle size={13} /> Validated</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{profileData.statistics.validatedTrips}</div>
          </div>
          <div className="card">
            <div className="card-label"><Navigation size={13} /> Pending</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{profileData.statistics.pendingTrips}</div>
          </div>
          <div className="card">
            <div className="card-label"><Route size={13} /> Distance</div>
            <div className="stat-value">{profileData.statistics.totalDistanceKm} km</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-label" style={{ marginBottom: '1.25rem' }}><Lock size={13} /> Change Password</div>
        <form onSubmit={handlePasswordChange} style={{ maxWidth: '420px' }}>
          <div className="field" style={{ position: 'relative' }}>
            <label>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="field" style={{ position: 'relative' }}>
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                required
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {passwordMessage.text && (
            <div style={{ fontSize: '0.8125rem', color: passwordMessage.type === 'success' ? 'var(--success)' : 'var(--danger)', marginBottom: '0.75rem' }}>
              {passwordMessage.text}
            </div>
          )}
          <button type="submit" className="btn-brand" disabled={isPasswordChanging}>
            {isPasswordChanging ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
