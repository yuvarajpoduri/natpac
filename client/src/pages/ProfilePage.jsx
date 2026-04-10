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
        <div className="loading-pulse" style={{ fontSize: '13px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Loading profile...</div>
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

      {/* Avatar + Name Section */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: 'var(--card-gap, 20px)' }}>
        <div className="avatar avatar-lg">
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{profileData?.fullName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className={`badge ${profileData?.userRole === 'scientist' ? 'badge-info' : 'badge-brand'}`}>
              {profileData?.userRole === 'scientist' ? 'Scientist' : 'Citizen'}
            </span>
            <span style={{ fontSize: '12px', color: '#999999' }}>
              Member since {new Date(profileData?.accountCreatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="card" style={{ marginBottom: 'var(--card-gap, 20px)' }}>
        <div className="card-label"><User size={12} /> Account Details</div>
        <div className="stack">
          {[
            { icon: User, label: 'Full Name', value: profileData?.fullName },
            { icon: Mail, label: 'Email', value: profileData?.emailAddress },
            { icon: Shield, label: 'Role', value: profileData?.userRole },
            { icon: Calendar, label: 'Joined', value: new Date(profileData?.accountCreatedAt).toLocaleDateString() }
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#F5F5F3', borderRadius: '12px' }}>
              <Icon size={16} style={{ color: '#111111', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: '#999999', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '15px', fontWeight: 500, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {profileData?.statistics && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="card">
            <div className="card-label"><Navigation size={12} /> Total Trips</div>
            <div className="stat-value">{profileData.statistics.totalTrips}</div>
          </div>
          <div className="card">
            <div className="card-label"><CheckCircle size={12} /> Validated</div>
            <div className="stat-value" style={{ color: '#34D399' }}>{profileData.statistics.validatedTrips}</div>
          </div>
          <div className="card">
            <div className="card-label"><Navigation size={12} /> Pending</div>
            <div className="stat-value">{profileData.statistics.pendingTrips}</div>
          </div>
          <div className="card">
            <div className="card-label"><Route size={12} /> Distance</div>
            <div className="stat-value">{profileData.statistics.totalDistanceKm} km</div>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="card">
        <div className="card-label"><Lock size={12} /> Change Password</div>
        <form onSubmit={handlePasswordChange}>
          <div className="field">
            <label>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#999999', cursor: 'pointer', padding: '4px' }}>
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="field">
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#999999', cursor: 'pointer', padding: '4px' }}>
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {passwordMessage.text && (
            <div style={{ fontSize: '13px', color: passwordMessage.type === 'success' ? '#34D399' : '#E24B4A', marginBottom: '12px', fontWeight: 500 }}>
              {passwordMessage.text}
            </div>
          )}
          <button type="submit" className="btn-brand" style={{ width: '100%', justifyContent: 'center' }} disabled={isPasswordChanging}>
            {isPasswordChanging ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
