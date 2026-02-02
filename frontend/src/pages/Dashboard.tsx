import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const quickActions = [
    { 
      title: 'AI Orchestrator', 
      description: 'Natural language AI requests',
      icon: '🤖', 
      link: '/generate',
      primary: true
    },
    { 
      title: 'Generate Images', 
      description: 'Create images from text prompts',
      icon: '🎨', 
      link: '/generate'
    },
    { 
      title: 'Edit Images', 
      description: 'Enhance and modify existing images',
      icon: '✨', 
      link: '/editor'
    },
    { 
      title: 'My Favorites', 
      description: 'View saved creations',
      icon: '❤️', 
      link: '/favorites'
    },
  ];

  const recentStats = [
    { label: 'Images Generated', value: '24', trend: '+12%' },
    { label: 'Images Edited', value: '8', trend: '+5%' },
    { label: 'Favorites Saved', value: '16', trend: '+8%' },
    { label: 'Projects Created', value: '6', trend: '+2%' },
  ];

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header fade-in">
          <h1 className="dashboard-welcome-title">
            Welcome back, {user?.name}
          </h1>
          <p className="dashboard-welcome-subtitle">
            What would you like to create today?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-quick-actions animate-fade-in-up">
        <h2 className="text-gradient-primary mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-2">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.link} style={{ textDecoration: 'none' }}>
              <div className={`dashboard-action-card ${action.primary ? 'primary' : ''}`}>
                <div className="dashboard-action-icon">
                  {action.icon}
                </div>
                <div>
                  <h3 className="dashboard-action-title">
                    {action.title}
                  </h3>
                  <p className="dashboard-action-description">
                    {action.description}
                  </p>
                  {action.primary && (
                    <div className="badge badge-primary mt-3">
                      New Feature
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="dashboard-stats-grid animate-fade-in-up">
        <h2 className="text-gradient-primary mb-6">
          Activity Overview
        </h2>
        <div className="grid grid-4">
          {recentStats.map((stat, index) => (
            <div key={index} className="dashboard-stat-card">
              <div className="dashboard-stat-value">
                {stat.value}
              </div>
              <div className="dashboard-stat-label">
                {stat.label}
              </div>
              <div className="dashboard-stat-trend">
                {stat.trend}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ animation: 'fadeInUp 0.8s ease-out 0.6s both' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <h2 style={{
            background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Recent Activity
          </h2>
          <Link to="/favorites" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              color: 'var(--color-primary)',
              padding: '8px 16px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              View All
            </button>
          </Link>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--border-radius-lg)',
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          color: 'var(--color-text-secondary)'
        }}>
          <i className="bi bi-clock" style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}></i>
          <p>No recent activity yet. Start creating to see your projects here!</p>
        </div>
      </div>

      {/* Admin Access */}
      {user?.role === 'admin' && (
        <div style={{ marginTop: 'var(--spacing-xxl)', animation: 'fadeInUp 0.8s ease-out 0.8s both' }}>
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--border-radius-lg)',
            padding: 'var(--spacing-xl)'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ 
                  color: '#EF4444', 
                  marginBottom: 'var(--spacing-sm)',
                  fontWeight: '600'
                }}>
                  Administrator Access
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Manage users, view system statistics, and monitor application health
                </p>
              </div>
              <Link to="/admin" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#EF4444',
                  padding: '8px 16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  Admin Panel
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;