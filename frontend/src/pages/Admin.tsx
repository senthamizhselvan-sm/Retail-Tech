import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalGenerations: number;
  totalEdits: number;
  totalFavorites: number;
}

const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'users'>('stats');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, statsData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getStats(),
      ]);
      setUsers(usersData);
      setStats(statsData.stats);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await adminService.updateUser(userId, { isActive: !currentStatus });
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: !currentStatus } : user
      ));
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await adminService.deleteUser(userId);
      setUsers(users.filter(user => user._id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '50vh' }}>
        <div className="loader"></div>
      </div>
    );
  }

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
            Administration Panel
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xxl)' }}>
            Manage users and monitor system performance
          </p>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xxl)' }}>
            <button
              onClick={() => setActiveTab('stats')}
              style={{
                background: activeTab === 'stats' 
                  ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                color: activeTab === 'stats' ? '#FFFFFF' : 'var(--color-primary)',
                padding: '12px 24px',
                borderRadius: '20px',
                border: activeTab === 'stats' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              System Statistics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                background: activeTab === 'users' 
                  ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                color: activeTab === 'users' ? '#FFFFFF' : 'var(--color-primary)',
                padding: '12px 24px',
                borderRadius: '20px',
                border: activeTab === 'users' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              User Management
            </button>
          </div>
        </div>

        {activeTab === 'stats' && stats && (
          <div className="slide-up">
            <h2 style={{ marginBottom: 'var(--spacing-xl)' }}>System Statistics</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-3 mb-xxl">
              <div className="card text-center">
                <h3 style={{ fontSize: '32px', color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
                  {stats.totalUsers}
                </h3>
                <p style={{ fontWeight: 600 }}>Total Users</p>
                <p className="caption">{stats.activeUsers} active</p>
              </div>
              
              <div className="card text-center">
                <h3 style={{ fontSize: '32px', color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
                  {stats.totalGenerations}
                </h3>
                <p style={{ fontWeight: 600 }}>Images Generated</p>
                <p className="caption">Total creations</p>
              </div>
              
              <div className="card text-center">
                <h3 style={{ fontSize: '32px', color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
                  {stats.totalEdits}
                </h3>
                <p style={{ fontWeight: 600 }}>Images Edited</p>
                <p className="caption">Processing requests</p>
              </div>
            </div>

            {/* Detailed Stats Table */}
            <div className="card">
              <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Detailed Metrics</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Count</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Total Users</td>
                    <td>{stats.totalUsers}</td>
                    <td><span className="status-success">Active</span></td>
                  </tr>
                  <tr>
                    <td>Active Users</td>
                    <td>{stats.activeUsers}</td>
                    <td><span className="status-success">Online</span></td>
                  </tr>
                  <tr>
                    <td>Images Generated</td>
                    <td>{stats.totalGenerations}</td>
                    <td><span className="status-processing">Processing</span></td>
                  </tr>
                  <tr>
                    <td>Images Edited</td>
                    <td>{stats.totalEdits}</td>
                    <td><span className="status-processing">Processing</span></td>
                  </tr>
                  <tr>
                    <td>Favorites Saved</td>
                    <td>{stats.totalFavorites}</td>
                    <td><span className="status-success">Stored</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="slide-up">
            <div className="flex-between mb-xl">
              <h2>User Management</h2>
              <div className="status-processing">
                {users.length} total users
              </div>
            </div>

            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td style={{ fontWeight: 600 }}>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span style={{ 
                          color: user.role === 'admin' ? 'var(--color-error)' : 'var(--color-text-secondary)',
                          fontWeight: user.role === 'admin' ? 600 : 400
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.isActive ? (
                          <span className="status-success">Active</span>
                        ) : (
                          <span className="status-error">Inactive</span>
                        )}
                      </td>
                      <td className="caption">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                          <button
                            onClick={() => handleToggleActive(user._id, user.isActive)}
                            className={user.isActive ? 'btn btn-destructive' : 'btn btn-secondary'}
                            style={{ fontSize: '12px', padding: '0 var(--spacing-md)' }}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="btn btn-destructive"
                              style={{ fontSize: '12px', padding: '0 var(--spacing-md)' }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;