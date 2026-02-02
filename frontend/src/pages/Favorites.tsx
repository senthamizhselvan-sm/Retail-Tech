import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { favoriteService } from '../services/favoriteService';
import toast from 'react-hot-toast';

interface Favorite {
  _id: string;
  imageUrl: string;
  prompt?: string;
  type: string;
  metadata?: any;
  createdAt: string;
}

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await favoriteService.getFavorites();
      setFavorites(data);
    } catch (error) {
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (imageUrl: string, id: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `pixcraft-favorite-${id}.jpg`;
    link.click();
    toast.success('Image downloaded');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove from favorites?')) return;

    try {
      await favoriteService.removeFavorite(id);
      setFavorites(favorites.filter((f) => f._id !== id));
      toast.success('Removed from favorites');
    } catch (error) {
      toast.error('Failed to remove favorite');
    }
  };

  const filteredFavorites = favorites.filter(favorite => {
    const matchesFilter = filter === 'all' || favorite.type === filter;
    const matchesSearch = !searchTerm || 
      (favorite.prompt && favorite.prompt.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const favoriteTypes = ['all', ...Array.from(new Set(favorites.map(f => f.type)))];

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
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <div>
              <h1 style={{ 
                marginBottom: 'var(--spacing-sm)',
                background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                My Favorites
              </h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {favorites.length} saved {favorites.length === 1 ? 'image' : 'images'}
              </p>
            </div>
            <Link to="/generate" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                color: '#FFFFFF',
                padding: '12px 24px',
                borderRadius: '20px',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
              }}
              >
                Create New
              </button>
            </Link>
          </div>

          {/* Filters and Search */}
          {favorites.length > 0 && (
            <div className="card mb-xl">
              <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Filter & Search</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Search Images</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search by prompt or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Filter by Category</label>
                  <select
                    className="input"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    {favoriteTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Categories' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {(searchTerm || filter !== 'all') && (
                <div style={{ 
                  marginTop: 'var(--spacing-lg)', 
                  paddingTop: 'var(--spacing-lg)',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)'
                }}>
                  <span className="caption">
                    Showing {filteredFavorites.length} of {favorites.length} images
                  </span>
                  {(searchTerm || filter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilter('all');
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', height: '32px', padding: '0 var(--spacing-md)' }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {favorites.length === 0 ? (
            <div className="card text-center slide-up" style={{ padding: 'var(--spacing-xxl)' }}>
              <div style={{ fontSize: '64px', marginBottom: 'var(--spacing-lg)' }}>❤️</div>
              <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                No favorites yet
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                Start generating images and save your best creations here
              </p>
              <Link to="/generate">
                <button className="btn btn-primary">
                  Generate Your First Image
                </button>
              </Link>
            </div>
          ) : filteredFavorites.length === 0 ? (
            <div className="card text-center slide-up" style={{ padding: 'var(--spacing-xxl)' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-lg)' }}>🔍</div>
              <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                No matches found
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                No images match your current search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                className="btn btn-secondary"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="image-gallery slide-up">
              {filteredFavorites.map((favorite) => (
                <div key={favorite._id} className="image-item">
                  <img
                    src={favorite.imageUrl}
                    alt="Favorite"
                    style={{ 
                      width: '100%', 
                      maxHeight: '300px', 
                      objectFit: 'contain',
                      background: 'var(--color-background)'
                    }}
                  />
                  <div style={{ padding: 'var(--spacing-md)' }}>
                    {favorite.prompt && (
                      <p style={{
                        fontSize: '14px',
                        marginBottom: 'var(--spacing-sm)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--color-text-primary)'
                      }}>
                        {favorite.prompt}
                      </p>
                    )}
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: 'var(--spacing-sm)', 
                      marginBottom: 'var(--spacing-md)',
                      flexWrap: 'wrap'
                    }}>
                      <span className="status-processing">
                        {favorite.type}
                      </span>
                      {favorite.metadata?.style && (
                        <span className="status-success">
                          {favorite.metadata.style}
                        </span>
                      )}
                      {favorite.metadata?.size && (
                        <span style={{ 
                          fontSize: '12px', 
                          color: 'var(--color-text-secondary)',
                          padding: 'var(--spacing-xs) var(--spacing-sm)',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '4px'
                        }}>
                          {favorite.metadata.size}
                        </span>
                      )}
                    </div>

                    <div className="caption mb-md">
                      Saved: {new Date(favorite.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <button
                        onClick={() => handleDownload(favorite.imageUrl, favorite._id)}
                        className="btn btn-primary"
                        style={{ flex: 1, fontSize: '12px', padding: '0 var(--spacing-md)' }}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(favorite._id)}
                        className="btn btn-destructive"
                        style={{ fontSize: '12px', padding: '0 var(--spacing-md)' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Collection Statistics */}
          {favorites.length > 0 && (
            <div className="card mt-xxl">
              <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Collection Overview</h3>
              <div className="grid grid-4">
                <div className="text-center">
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 600, 
                    color: 'var(--color-primary)', 
                    marginBottom: 'var(--spacing-sm)' 
                  }}>
                    {favorites.length}
                  </div>
                  <p className="caption">Total Images</p>
                </div>
                <div className="text-center">
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 600, 
                    color: 'var(--color-primary)', 
                    marginBottom: 'var(--spacing-sm)' 
                  }}>
                    {favorites.filter(f => f.type === 'generated').length}
                  </div>
                  <p className="caption">AI Generated</p>
                </div>
                <div className="text-center">
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 600, 
                    color: 'var(--color-primary)', 
                    marginBottom: 'var(--spacing-sm)' 
                  }}>
                    {favorites.filter(f => f.type === 'edited').length}
                  </div>
                  <p className="caption">AI Edited</p>
                </div>
                <div className="text-center">
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 600, 
                    color: 'var(--color-primary)', 
                    marginBottom: 'var(--spacing-sm)' 
                  }}>
                    {favoriteTypes.length - 1}
                  </div>
                  <p className="caption">Categories</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Favorites;