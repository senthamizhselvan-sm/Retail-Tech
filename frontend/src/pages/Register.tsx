import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const getPasswordStrength = (pass: string): { strength: string; color: string } => {
    if (pass.length === 0) return { strength: '', color: '' };
    if (pass.length < 6) return { strength: 'Weak', color: 'var(--color-error)' };
    if (pass.length < 10) return { strength: 'Medium', color: '#FF8C00' };
    if (pass.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)) {
      return { strength: 'Strong', color: '#107C10' };
    }
    return { strength: 'Medium', color: '#FF8C00' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-xl">
          <h1 style={{ 
            marginBottom: 'var(--spacing-sm)',
            background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Join PixCraft AI today
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
            {passwordStrength.strength && (
              <div style={{ 
                marginTop: 'var(--spacing-sm)',
                fontSize: '12px',
                color: passwordStrength.color,
                fontWeight: 600
              }}>
                Password strength: {passwordStrength.strength}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="label">Confirm Password</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              marginBottom: 'var(--spacing-lg)',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              color: '#FFFFFF',
              padding: '14px 28px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center">
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Already have an account?{' '}
            <Link 
              to="/login" 
              style={{ 
                color: 'var(--color-primary)', 
                textDecoration: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;