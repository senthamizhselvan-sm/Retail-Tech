import React, { useState } from 'react';
import { aiService } from '../services/aiService';
import { favoriteService } from '../services/favoriteService';
import toast from 'react-hot-toast';
import VoiceInput from '../components/VoiceInput';

const Generate: React.FC = () => {
  const [mode, setMode] = useState<'orchestrator' | 'generate' | 'edit'>('orchestrator');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('1024x1024');
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  // Image upload/edit states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState('');

  // Orchestrator states
  const [naturalRequest, setNaturalRequest] = useState('');
  const [refinedRequest, setRefinedRequest] = useState('');
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);

  const styles = ['realistic', 'artistic', 'cartoon', 'abstract', 'photographic'];
  const sizes = ['512x512', '1024x1024', '1024x1792', '1792x1024'];

  // Voice input handlers
  const handleNaturalRequestVoice = (transcript: string, append: boolean = false) => {
    if (append) {
      setNaturalRequest(prev => prev ? `${prev} ${transcript}` : transcript);
    } else {
      setNaturalRequest(transcript);
    }
  };

  const handlePromptVoice = (transcript: string, append: boolean = false) => {
    if (append) {
      setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
    } else {
      setPrompt(transcript);
    }
  };

  const handleEditPromptVoice = (transcript: string, append: boolean = false) => {
    if (append) {
      setEditPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
    } else {
      setEditPrompt(transcript);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await aiService.generateImage({ prompt, style, size, count });
      setImages(result.images);
      toast.success('Images generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate images');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `pixcraft-${Date.now()}-${index}.jpg`;
    link.click();
    toast.success('Image downloaded!');
  };

  const handleFavorite = async (imageUrl: string) => {
    try {
      await favoriteService.addFavorite({
        imageUrl,
        prompt,
        type: 'generated',
        metadata: { style, size },
      });
      toast.success('Added to favorites!');
    } catch (error) {
      toast.error('Failed to add to favorites');
    }
  };

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
        setEditedImage(null);
        setAnalysis('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    setLoading(true);
    try {
      const result = await aiService.editImage({
        imageUrl: '',
        imageBase64: uploadedImage,
        editType: 'enhance',
        prompt: editPrompt,
        params: { style, size },
      });
      setEditedImage(result.editedImage);
      setAnalysis(result.analysis || '');
      toast.success('Image processed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to edit image');
    } finally {
      setLoading(false);
    }
  };

  const handleOrchestratorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalRequest.trim()) {
      toast.error('Please enter your request');
      return;
    }

    setLoading(true);
    setProcessingSteps([]);
    setRefinedRequest('');
    setImages([]);

    try {
      toast.loading('Processing your request...', { id: 'orchestrator' });
      
      const result = await aiService.orchestrateAI({
        userRequest: naturalRequest,
        inputData: uploadedImage ? { imageBase64: uploadedImage } : {}
      });
      
      // Extract refined request
      if (result.refinement) {
        setRefinedRequest(result.refinement.refined_request);
      }

      // Extract processing steps
      if (result.workflow) {
        setProcessingSteps(result.workflow.operations || []);
      }

      // Extract final images
      if (result.finalOutput && result.finalOutput.finalOutput) {
        const finalResult = result.finalOutput.finalOutput;
        if (finalResult.images) {
          setImages(finalResult.images);
        } else if (finalResult.editedImage) {
          setImages([finalResult.editedImage]);
          setEditedImage(finalResult.editedImage);
        }
      }

      toast.success('Request processed successfully!', { id: 'orchestrator' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process request', { id: 'orchestrator' });
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
            AI Image Studio
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xxl)' }}>
            Generate images from text or upload and edit with AI
          </p>

          {/* Mode Tabs */}
          <div className="mode-selector">
            <button
              onClick={() => setMode('orchestrator')}
              className={`mode-button ${mode === 'orchestrator' ? 'active' : ''}`}
            >
              AI Orchestrator
            </button>
            <button
              onClick={() => setMode('generate')}
              className={`mode-button ${mode === 'generate' ? 'active' : ''}`}
            >
              Generate from Text
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`mode-button ${mode === 'edit' ? 'active' : ''}`}
            >
              Upload & Edit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Controls Panel */}
          <div className="controls-panel">
            {mode === 'orchestrator' ? (
              <form onSubmit={handleOrchestratorRequest}>
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <label className="label" style={{ margin: 0 }}>
                      Natural Language Request
                    </label>
                    <VoiceInput 
                      onTranscript={handleNaturalRequestVoice}
                      disabled={loading}
                    />
                  </div>
                  <textarea
                    className="textarea"
                    value={naturalRequest}
                    onChange={(e) => setNaturalRequest(e.target.value)}
                    placeholder="Tell me what you want in plain English...

Examples:
• create a christmas poster for my clothing store
• make a diwali brochure for my bakery  
• design a birthday sale banner with 30% off"
                    required
                    rows={6}
                  />
                </div>

                {refinedRequest && (
                  <div className="status-processing mb-lg">
                    <strong>Refined Request:</strong>
                    <p style={{ marginTop: 'var(--spacing-sm)', fontSize: '14px' }}>
                      {refinedRequest}
                    </p>
                  </div>
                )}

                {processingSteps.length > 0 && (
                  <div className="mb-lg">
                    <label className="label">Processing Steps</label>
                    {processingSteps.map((step, index) => (
                      <div key={index} className="orchestrator-step completed">
                        <div className="step-indicator completed">
                          ✓
                        </div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Processing...' : 'Process Request'}
                </button>
              </form>
            ) : mode === 'generate' ? (
              <form onSubmit={handleGenerate}>
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <label className="label" style={{ margin: 0 }}>Prompt</label>
                    <VoiceInput 
                      onTranscript={handlePromptVoice}
                      disabled={loading}
                    />
                  </div>
                  <textarea
                    className="textarea"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to create..."
                    required
                    rows={4}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Style</label>
                    <select
                      className="input"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                    >
                      {styles.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Size</label>
                    <select
                      className="input"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    >
                      {sizes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Count</label>
                  <input
                    type="number"
                    className="input"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    min={1}
                    max={4}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Generating...' : 'Generate Images'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleEditImage}>
                <div className="form-group">
                  <label className="label">Upload Image</label>
                  <input
                    type="file"
                    className="input"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {uploadedImage && (
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        style={{ 
                          width: '100%', 
                          maxHeight: '300px', 
                          objectFit: 'contain', 
                          borderRadius: '4px',
                          background: 'var(--color-background)'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <label className="label" style={{ margin: 0 }}>Edit Instructions</label>
                    <VoiceInput 
                      onTranscript={handleEditPromptVoice}
                      disabled={loading}
                    />
                  </div>
                  <textarea
                    className="textarea"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe how you want to edit the image..."
                    required
                    rows={4}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !uploadedImage}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Processing...' : 'Edit Image'}
                </button>
              </form>
            )}
          </div>

          {/* Results Panel */}
          <div className="card slide-up">
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Results</h3>
            
            {loading && (
              <div className="flex-center" style={{ padding: 'var(--spacing-xxl)' }}>
                <div className="loader"></div>
                <span style={{ marginLeft: 'var(--spacing-md)' }}>Processing...</span>
              </div>
            )}

            {images.length > 0 && (
              <div className="image-gallery">
                {images.map((imageUrl, index) => (
                  <div key={index} className="image-item">
                    <img src={imageUrl} alt={`Generated ${index + 1}`} />
                    <div className="image-actions">
                      <button
                        onClick={() => handleDownload(imageUrl, index)}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '0 var(--spacing-md)' }}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleFavorite(imageUrl)}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '0 var(--spacing-md)' }}
                      >
                        Favorite
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editedImage && (
              <div>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Edited Image</h3>
                <div className="image-item">
                  <img src={editedImage} alt="Edited" />
                  <div className="image-actions">
                    <button
                      onClick={() => handleDownload(editedImage, 0)}
                      className="btn btn-secondary"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            )}

            {analysis && (
              <div className="mt-lg">
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Analysis</h3>
                <div style={{ 
                  padding: 'var(--spacing-lg)', 
                  backgroundColor: 'var(--color-background)', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  {analysis.split('\n').map((line, index) => (
                    <p key={index} style={{ marginBottom: 'var(--spacing-sm)' }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {!loading && images.length === 0 && !editedImage && (
              <div className="text-center" style={{ padding: 'var(--spacing-xxl)', color: 'var(--color-text-secondary)' }}>
                <p>Your generated images will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generate;