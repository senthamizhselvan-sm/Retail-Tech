import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await userService.updateProfile({ name, avatar });
      updateUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="fade-in">
          <h1 style={{ 
            marginBottom: 'var(--spacing-sm)',
            background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Profile Settings
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xxl)' }}>
            Manage your account information and security settings
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xxl)', maxWidth: '1000px' }}>
          {/* Profile Information */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--border-radius-lg)',
            padding: 'var(--spacing-xl)',
            animation: 'fadeInUp 0.8s ease-out 0.2s both'
          }}>
            <h2 style={{ 
              marginBottom: 'var(--spacing-xl)',
              background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Profile Information
            </h2>
          
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  value={user?.email || ''}
                  disabled
                  style={{ backgroundColor: 'var(--color-background)', cursor: 'not-allowed' }}
                />
                <p className="caption mt-sm">Email address cannot be modified</p>
              </div>

              <div className="form-group">
                <label className="label">Avatar URL</label>
                <input
                  type="url"
                  className="input"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="caption mt-sm">Provide a URL to your profile image</p>
              </div>

              {avatar && (
                <div className="form-group">
                  <label className="label">Avatar Preview</label>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-lg)',
                    padding: 'var(--spacing-lg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-background)'
                  }}>
                    <img
                      src={avatar}
                      alt="Avatar preview"
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--color-border)',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64/E1E1E1/5F5F5F?text=?';
                      }}
                    />
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                        {name || 'User Name'}
                      </p>
                      <p className="caption">{user?.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="label">Account Role</label>
                <input
                  type="text"
                  className="input"
                  value={user?.role || 'User'}
                  disabled
                  style={{ backgroundColor: 'var(--color-background)', cursor: 'not-allowed' }}
                />
                <p className="caption mt-sm">Role is assigned by system administrators</p>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Updating Profile...' : 'Update Profile'}
              </button>
            </form>
          </div>

          {/* Security Settings */}
          <div className="card slide-up">
            <h2 style={{ marginBottom: 'var(--spacing-xl)' }}>
              Security Settings
            </h2>
            
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="label">Current Password</label>
                <input
                  type="password"
                  className="input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">New Password</label>
                <input
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <p className="caption mt-sm">Password must be at least 6 characters long</p>
              </div>

              <div className="form-group">
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>

            {/* Theme Preferences */}
            <div style={{ 
              marginTop: 'var(--spacing-xxl)', 
              paddingTop: 'var(--spacing-xl)',
              borderTop: '1px solid var(--color-border)'
            }}>
              <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Appearance</h3>
              
              <div className="form-group">
                <label className="label">Theme Preference</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                  <button
                    onClick={() => setTheme('light')}
                    className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-sm)',
                      justifyContent: 'center'
                    }}
                  >
                    <span>☀️</span>
                    Light Theme
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-sm)',
                      justifyContent: 'center'
                    }}
                  >
                    <span>🌙</span>
                    Dark Theme
                  </button>
                </div>
                <p className="caption mt-sm">
                  Theme preference is saved locally and will persist across sessions
                </p>
              </div>
            </div>

            {/* Account Information */}
            <div style={{ 
              marginTop: 'var(--spacing-xxl)', 
              paddingTop: 'var(--spacing-xl)',
              borderTop: '1px solid var(--color-border)'
            }}>
              <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Account Information</h3>
              
              <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="caption">Account Created</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>
                    {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="caption">Last Login</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>
                    {(user as any)?.lastLogin ? new Date((user as any).lastLogin).toLocaleDateString() : 'Current session'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="caption">Account Status</span>
                  <span className="status-success">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;