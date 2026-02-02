import React, { useState } from 'react';
import { aiService } from '../services/aiService';
import { favoriteService } from '../services/favoriteService';
import toast from 'react-hot-toast';

const Editor: React.FC = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [editType, setEditType] = useState('enhance');
  const [editPrompt, setEditPrompt] = useState('');
  const [editedImage, setEditedImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');

  const editTypes = [
    { value: 'enhance', label: 'Enhance Quality' },
    { value: 'artistic', label: 'Artistic Style' },
    { value: 'professional', label: 'Professional Polish' },
    { value: 'vintage', label: 'Vintage Effect' },
    { value: 'modern', label: 'Modern Style' },
    { value: 'remove-bg', label: 'Remove Background' }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setImageUrl('');
        setEditedImage('');
        setAnalysis('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!imageUrl && !uploadedImage) {
      toast.error('Please provide an image URL or upload an image');
      return;
    }

    setLoading(true);
    try {
      const result = await aiService.editImage({
        imageUrl: imageUrl,
        imageBase64: uploadedImage || undefined,
        editType,
        prompt: editPrompt || `Apply ${editType} enhancement to this image`,
        params: { editType }
      });
      
      setEditedImage(result.editedImage);
      setAnalysis(result.analysis || '');
      toast.success('Image processed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = `pixcraft-edited-${Date.now()}.jpg`;
    link.click();
    toast.success('Image downloaded');
  };

  const handleFavorite = async () => {
    try {
      await favoriteService.addFavorite({
        imageUrl: editedImage,
        prompt: editPrompt,
        type: 'edited',
        metadata: { editType, originalUrl: imageUrl }
      });
      toast.success('Added to favorites');
    } catch (error) {
      toast.error('Failed to add to favorites');
    }
  };

  const currentImage = uploadedImage || imageUrl;

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
            AI Image Editor
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xxl)' }}>
            Enhance and modify your images with AI-powered tools
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Controls Panel */}
          <div className="controls-panel animate-fade-in-up">
            <h3 className="text-lg font-semibold text-primary mb-6">
              Image Source
            </h3>
          
            <div className="form-group">
              <label className="label">Upload Image</label>
              <input
                type="file"
                className="input"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <p className="caption mt-sm">Supported formats: JPG, PNG, WebP. Maximum size: 5MB</p>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-md)', 
              margin: 'var(--spacing-lg) 0',
              color: 'var(--color-text-secondary)'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
            </div>

            <div className="form-group">
              <label className="label">Image URL</label>
              <input
                type="url"
                className="input"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setUploadedImage(null);
                  setEditedImage('');
                  setAnalysis('');
                }}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="form-group">
              <label className="label">Enhancement Type</label>
              <select
                className="input"
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
              >
                {editTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Custom Instructions (Optional)</label>
              <textarea
                className="textarea"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Describe specific modifications you want to apply to the image..."
                rows={3}
              />
              <p className="caption mt-sm">Be specific about colors, objects, styles, or effects you want</p>
            </div>

            <button
              onClick={handleEdit}
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading || (!imageUrl && !uploadedImage)}
            >
              {loading ? 'Processing...' : 'Apply Enhancement'}
            </button>

            {currentImage && (
              <div className="mt-xl">
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Original Image</h3>
                <div style={{ 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <img
                    src={currentImage}
                    alt="Original"
                    style={{ 
                      width: '100%', 
                      maxHeight: '300px', 
                      objectFit: 'contain',
                      background: 'var(--color-background)'
                    }}
                    onError={() => toast.error('Failed to load image')}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="card slide-up">
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Results</h3>
            
            {loading && (
              <div className="flex-center" style={{ 
                padding: 'var(--spacing-xxl)', 
                border: '2px dashed var(--color-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-background)'
              }}>
                <div className="loader"></div>
                <span style={{ marginLeft: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                  Processing image...
                </span>
              </div>
            )}

            {editedImage && !loading && (
              <div>
                <div className="image-item mb-lg">
                  <img src={editedImage} alt="Edited" />
                  <div className="image-actions">
                    <button
                      onClick={handleDownload}
                      className="btn btn-primary"
                    >
                      Download
                    </button>
                    <button
                      onClick={handleFavorite}
                      className="btn btn-secondary"
                    >
                      Add to Favorites
                    </button>
                  </div>
                </div>

                {analysis && (
                  <div style={{ marginTop: 'var(--spacing-xl)' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Processing Summary</h3>
                    <div style={{ 
                      padding: 'var(--spacing-lg)', 
                      backgroundColor: 'var(--color-background)', 
                      borderRadius: '4px',
                      border: '1px solid var(--color-border)',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}>
                      {analysis.split('\n').map((line, index) => (
                        <p key={index} style={{ 
                          marginBottom: line.trim() ? 'var(--spacing-sm)' : 0,
                          color: 'var(--color-text-secondary)'
                        }}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !editedImage && (
              <div className="text-center" style={{ 
                padding: 'var(--spacing-xxl)', 
                color: 'var(--color-text-secondary)',
                border: '2px dashed var(--color-border)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-lg)' }}>✨</div>
                <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                  Ready to enhance
                </h3>
                <p>Upload an image or provide a URL to start processing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;