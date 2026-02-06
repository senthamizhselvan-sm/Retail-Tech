import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);
  const [showMarketingMenu, setShowMarketingMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container flex-between">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h2 style={{ 
            background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            fontWeight: '700'
          }}>
            VendorVoice GPT
          </h2>
        </Link>

        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
          {user ? (
            <>
              <Link 
                to="/business-home" 
                style={{ 
                  color: 'var(--color-text-primary)', 
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                🏠 Business Home
              </Link>

              {/* Business Operating System Dropdown */}
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowBusinessMenu(true)}
                onMouseLeave={() => setShowBusinessMenu(false)}
              >
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🏢 Business OS ▼
                </button>
                
                {showBusinessMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)',
                    padding: 'var(--spacing-sm)',
                    minWidth: '200px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}>
                    <Link to="/daily-assistant" style={{ display: 'block', padding: '8px 12px', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>
                      📊 Daily Assistant
                    </Link>
                    <Link to="/offer-planning" style={{ display: 'block', padding: '8px 12px', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>
                      📅 Offer Planning
                    </Link>
                    <Link to="/customer-communication" style={{ display: 'block', padding: '8px 12px', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>
                      💬 Customer Communication
                    </Link>
                    <Link to="/competitor-awareness" style={{ display: 'block', padding: '8px 12px', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>
                      🎯 Competitor Awareness
                    </Link>
                    <Link to="/brand-memory" style={{ display: 'block', padding: '8px 12px', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>
                      🏪 Brand Memory
                    </Link>
                    <Link to="/sales-reflection" style={{ display: 'block', padding: '8px 12px', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>
                      📈 Sales Reflection
                    </Link>
                    <Link to="/vendor-assistant" style={{ display: 'block', padding: '8px 12px', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>
                      🤖 AI Assistant
                    </Link>
                  </div>
                )}
              </div>

              {/* Marketing Tools Dropdown */}
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowMarketingMenu(true)}
                onMouseLeave={() => setShowMarketingMenu(false)}
              >
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🎨 Marketing ▼
                </button>
                
                {showMarketingMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)',
                    padding: 'var(--spacing-sm)',
                    minWidth: '180px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}>
                    <Link to="/generate" style={{ display: 'block', padding: '8px 12px', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>
                      ✨ Generate Images
                    </Link>
                    <Link to="/poster-studio" style={{ display: 'block', padding: '8px 12px', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>
                      🎨 Poster Studio
                    </Link>
                    <Link to="/editor" style={{ display: 'block', padding: '8px 12px', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>
                      ✏️ Edit Images
                    </Link>
                    <Link to="/favorites" style={{ display: 'block', padding: '8px 12px', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>
                      ❤️ Favorites
                    </Link>
                  </div>
                )}
              </div>

              {user.role === 'admin' && (
                <Link 
                  to="/admin" 
                  style={{ 
                    color: 'var(--color-text-primary)', 
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  ⚙️ Admin
                </Link>
              )}
              
              <div style={{ 
                borderLeft: '1px solid var(--color-border)', 
                paddingLeft: 'var(--spacing-lg)',
                display: 'flex',
                gap: 'var(--spacing-md)',
                alignItems: 'center'
              }}>
                <Link 
                  to="/profile" 
                  style={{ 
                    color: 'var(--color-text-primary)', 
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  👤 Profile
                </Link>
                <ThemeToggle showLabel={false} size="small" />
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <ThemeToggle showLabel={false} size="small" />
              <Link 
                to="/login" 
                style={{ 
                  color: 'var(--color-text-primary)', 
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Login
              </Link>
              <Link to="/register">
                <button className="btn btn-primary">
                  Register
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;