import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
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
        <div className="text-center mb-8">
          <h1 className="text-gradient-primary mb-2">
            Welcome Back
          </h1>
          <p className="text-secondary">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Don't have an account?{' '}
            <Link 
              to="/register" 
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
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;