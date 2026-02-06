import React, { useEffect, useMemo, useState } from 'react';
import { generatePosterDesign } from '../services/api';
import { loadGoogleFonts, renderPosterToImage, PosterDesign } from '../services/fabricPosterRenderer';
import './PosterStudio.css';

type LanguageOption = 'english' | 'tamil' | 'hindi';

interface PosterVariant {
  style: string;
  design: PosterDesign;
  renderedImage?: string;
}

interface BrandSettings {
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
}

const buildCustomizationState = (design: PosterDesign) => ({
  headlineText: design.headline.text,
  subheadingText: design.subheading.text,
  ctaText: design.callToAction,
  discountText: design.discount.text,
  backgroundStart: design.colors.backgroundGradient?.[0] || design.colors.background,
  backgroundEnd: design.colors.backgroundGradient?.[1] || design.colors.primary,
  primaryColor: design.colors.primary,
  accentColor: design.colors.accent,
  textColor: design.colors.textColor
});

const PosterStudio: React.FC = () => {
  const [formData, setFormData] = useState({
    product: '',
    discount: 50,
    festival: 'Diwali',
    language: 'english' as LanguageOption,
    productImage: ''
  });

  const [variants, setVariants] = useState<PosterVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [customization, setCustomization] = useState(buildCustomizationState({
    layout: 'center',
    colors: {
      background: '#667eea',
      backgroundGradient: ['#667eea', '#764ba2'],
      primary: '#764ba2',
      accent: '#FFD700',
      textColor: '#FFFFFF'
    },
    headline: { text: 'Festival Sale', fontSize: 80, fontFamily: 'Poppins' },
    subheading: { text: 'Your Product', fontSize: 40 },
    discount: { text: '50% OFF', position: 'top-right', badgeColor: '#FF6B35' },
    callToAction: 'SHOP NOW',
    decorativeElements: [],
    culturalSymbols: [],
    fontPairs: { heading: 'Poppins', body: 'Open Sans' }
  }));

  const festivals = ['Diwali', 'Pongal', 'Christmas', 'New Year', 'Eid', 'Onam', 'Holi'];
  const languages = [
    { value: 'english', label: 'English' },
    { value: 'tamil', label: 'தமிழ்' },
    { value: 'hindi', label: 'हिंदी' }
  ];

  const brandSettings: BrandSettings = useMemo(() => {
    try {
      const saved = localStorage.getItem('brandSettings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setVariants([]);
    setSelectedVariantIndex(0);

    try {
      setCurrentStep('AI is designing your poster...');
      const response = await generatePosterDesign({
        ...formData,
        generateVariants: true,
        brandColors: [brandSettings.primaryColor, brandSettings.secondaryColor].filter((c): c is string => Boolean(c))
      });

      setCurrentStep('Loading fonts...');
      const fontsToLoad = new Set<string>();
      response.designs.forEach((d: any) => {
        fontsToLoad.add(`${d.design.fontPairs.heading}:700`);
        fontsToLoad.add(`${d.design.fontPairs.body}:400`);
      });
      await loadGoogleFonts(Array.from(fontsToLoad));

      setCurrentStep('Rendering posters...');
      const renderedVariants = await Promise.all(
        response.designs.map(async (variant: any) => {
          const renderedImage = await renderPosterToImage(variant.design, {
            productImage: formData.productImage || undefined
          });
          return {
            ...variant,
            renderedImage
          } as PosterVariant;
        })
      );

      setVariants(renderedVariants);
      setCustomization(buildCustomizationState(renderedVariants[0].design));
      setCurrentStep('');
    } catch (error) {
      console.error('Poster generation failed:', error);
      alert('Failed to generate posters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, productImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderVariantImage = async (design: PosterDesign, format: 'png' | 'jpeg' = 'png') => {
    return renderPosterToImage(design, {
      productImage: formData.productImage || undefined,
      format,
      quality: format === 'jpeg' ? 0.92 : 1
    });
  };

  const handleDownload = async (variant: PosterVariant, format: 'png' | 'jpeg') => {
    const dataUrl = await renderVariantImage(variant.design, format);
    const link = document.createElement('a');
    link.download = `poster-${variant.style}-${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    link.href = dataUrl;
    link.click();
  };

  const selectedVariant = variants[selectedVariantIndex];

  useEffect(() => {
    if (!selectedVariant) return;
    setCustomization(buildCustomizationState(selectedVariant.design));
  }, [selectedVariantIndex, selectedVariant]);

  useEffect(() => {
    const updatePreview = async () => {
      const activeVariant = variants[selectedVariantIndex];
      if (!activeVariant) return;

      const updatedDesign: PosterDesign = {
        ...activeVariant.design,
        headline: {
          ...activeVariant.design.headline,
          text: customization.headlineText
        },
        subheading: {
          ...activeVariant.design.subheading,
          text: customization.subheadingText
        },
        callToAction: customization.ctaText,
        discount: {
          ...activeVariant.design.discount,
          text: customization.discountText
        },
        colors: {
          ...activeVariant.design.colors,
          background: customization.backgroundStart,
          backgroundGradient: [customization.backgroundStart, customization.backgroundEnd],
          primary: customization.primaryColor,
          accent: customization.accentColor,
          textColor: customization.textColor
        }
      };

      const renderedImage = await renderVariantImage(updatedDesign, 'png');

      setVariants((prev) =>
        prev.map((variant, index) =>
          index === selectedVariantIndex
            ? { ...variant, design: updatedDesign, renderedImage }
            : variant
        )
      );
    };

    if (!variants[selectedVariantIndex]) return undefined;
    const debounce = setTimeout(updatePreview, 400);
    return () => clearTimeout(debounce);
  }, [
    customization,
    selectedVariantIndex,
    formData.productImage
  ]);

  return (
    <div className="poster-studio">
      <div className="studio-header">
        <h1>AI Poster Studio</h1>
        <p>Generate professional posters with full control and live customization.</p>
      </div>

      <div className="input-section">
        <div className="form-grid">
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              placeholder="e.g., Sweets, Electronics"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Discount %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label>Festival / Event</label>
            <select
              value={formData.festival}
              onChange={(e) => setFormData({ ...formData, festival: e.target.value })}
            >
              {festivals.map((festival) => (
                <option key={festival} value={festival}>{festival}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value as LanguageOption })}
            >
              {languages.map((language) => (
                <option key={language.value} value={language.value}>{language.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Product Image (Optional)</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            {formData.productImage && (
              <img src={formData.productImage} alt="Preview" className="image-preview" />
            )}
          </div>

          <div className="form-group">
            <label>Brand Colors</label>
            <div className="color-preview">
              <span style={{ background: brandSettings.primaryColor || '#3B82F6' }}></span>
              <span style={{ background: brandSettings.secondaryColor || '#10B981' }}></span>
              <small>From Brand Memory</small>
            </div>
          </div>
        </div>

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={loading || !formData.product || !formData.festival}
        >
          {loading ? 'Generating...' : 'Generate 3 Variants'}
        </button>
      </div>

      {loading && (
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p className="loading-message">{currentStep}</p>
        </div>
      )}

      {variants.length > 0 && (
        <div className="customization-section">
          <h2>Live Customization</h2>
          <div className="customization-grid">
            <div className="customization-controls">
              <div className="form-group">
                <label>Variant</label>
                <select
                  value={selectedVariantIndex}
                  onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                >
                  {variants.map((variant, index) => (
                    <option key={variant.style} value={index}>
                      {variant.style}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Headline</label>
                <input
                  type="text"
                  value={customization.headlineText}
                  onChange={(e) => setCustomization({ ...customization, headlineText: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Subheading</label>
                <input
                  type="text"
                  value={customization.subheadingText}
                  onChange={(e) => setCustomization({ ...customization, subheadingText: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Discount Text</label>
                <input
                  type="text"
                  value={customization.discountText}
                  onChange={(e) => setCustomization({ ...customization, discountText: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Call To Action</label>
                <input
                  type="text"
                  value={customization.ctaText}
                  onChange={(e) => setCustomization({ ...customization, ctaText: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Background Start</label>
                <input
                  type="color"
                  value={customization.backgroundStart}
                  onChange={(e) => setCustomization({ ...customization, backgroundStart: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Background End</label>
                <input
                  type="color"
                  value={customization.backgroundEnd}
                  onChange={(e) => setCustomization({ ...customization, backgroundEnd: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Primary Color</label>
                <input
                  type="color"
                  value={customization.primaryColor}
                  onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Accent Color</label>
                <input
                  type="color"
                  value={customization.accentColor}
                  onChange={(e) => setCustomization({ ...customization, accentColor: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Text Color</label>
                <input
                  type="color"
                  value={customization.textColor}
                  onChange={(e) => setCustomization({ ...customization, textColor: e.target.value })}
                />
              </div>
              <p className="customization-note">Preview updates automatically after each change.</p>
            </div>

            {selectedVariant?.renderedImage && (
              <div className="customization-preview">
                <img
                  src={selectedVariant.renderedImage}
                  alt="Customized preview"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {variants.length > 0 && (
        <div className="variants-section">
          <h2>Your Posters</h2>
          <div className="variants-grid">
            {variants.map((variant, index) => (
              <div key={`${variant.style}-${index}`} className="variant-card">
                <div className="variant-badge">{variant.style}</div>
                <img
                  src={variant.renderedImage}
                  alt={`${variant.style} poster`}
                  className="variant-image"
                />
                <div className="variant-actions">
                  <button
                    onClick={() => handleDownload(variant, 'png')}
                    className="download-btn"
                  >
                    Download PNG
                  </button>
                  <button
                    onClick={() => handleDownload(variant, 'jpeg')}
                    className="download-btn secondary"
                  >
                    Download JPG
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PosterStudio;
