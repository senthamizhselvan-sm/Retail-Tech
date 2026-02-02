import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BusinessService, { BusinessProfile } from '../services/businessService';

interface ImageUploadProps {
  label: string;
  currentImageUrl?: string;
  onImageUpload: (imageData: string) => Promise<void>;
  onImageRemove: () => Promise<void>;
  aspectRatio?: string;
  maxSize?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  label, 
  currentImageUrl, 
  onImageUpload, 
  onImageRemove, 
  aspectRatio = '1/1',
  maxSize = 5 * 1024 * 1024 // 5MB
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result as string;
        await onImageUpload(imageData);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
      <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
        {label}
      </label>
      
      {currentImageUrl && (
        <div style={{ 
          marginBottom: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--border-radius)',
          border: '1px solid var(--color-border)'
        }}>
          <img 
            src={currentImageUrl} 
            alt={label}
            style={{ 
              width: '150px', 
              height: '150px', 
              objectFit: 'cover', 
              borderRadius: 'var(--border-radius)',
              aspectRatio 
            }} 
          />
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <button 
              onClick={onImageRemove}
              className="btn btn-secondary"
              style={{ fontSize: '14px', padding: '8px 16px' }}
            >
              🗑️ Remove
            </button>
          </div>
        </div>
      )}
      
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ marginBottom: 'var(--spacing-sm)' }}
        />
        {uploading && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Uploading...
          </p>
        )}
      </div>
    </div>
  );
};

const BusinessProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<BusinessProfile>({
    userId: '',
    shopName: '',
    vendorType: 'kirana',
    address: {
      street: '',
      city: '',
      state: '',
      pinCode: ''
    },
    phoneNumber: '',
    whatsappNumber: '',
    email: '',
    operatingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false
    },
    businessHours: {
      openingTime: '09:00',
      closingTime: '21:00',
      is24x7: false
    },
    logoUrl: '',
    shopPhotoUrl: '',
    shopDescription: '',
    establishedYear: undefined,
    gstNumber: '',
    preferredLanguage: 'en',
    themeColor: '#3B82F6',
    createdAt: '',
    updatedAt: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  const businessTypes = [
    { value: 'kirana', label: 'Kirana/Grocery' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'food_beverages', label: 'Food & Beverages' },
    { value: 'general_store', label: 'General Store' },
    { value: 'other', label: 'Other' }
  ];

  const dayLabels = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun'
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileData = await BusinessService.getProfile();
      setProfile(profileData);
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        const currentParentValue = prev[parent as keyof BusinessProfile];
        
        // Ensure we're working with an object that can be spread
        if (typeof currentParentValue === 'object' && currentParentValue !== null) {
          return {
            ...prev,
            [parent]: {
              ...(currentParentValue as Record<string, any>),
              [child]: value
            }
          };
        }
      }
      return { ...prev, [field]: value };
    });
  };

  const handleOperatingDayChange = (day: string, checked: boolean) => {
    setProfile(prev => ({
      ...prev,
      operatingDays: {
        ...prev.operatingDays,
        [day]: checked
      }
    }));
  };

  const handleLogoUpload = async (imageData: string) => {
    try {
      const logoUrl = await BusinessService.uploadLogo(imageData);
      setProfile(prev => ({ ...prev, logoUrl }));
    } catch (error) {
      console.error('Logo upload failed:', error);
      throw error;
    }
  };

  const handleShopPhotoUpload = async (imageData: string) => {
    try {
      const shopPhotoUrl = await BusinessService.uploadShopPhoto(imageData);
      setProfile(prev => ({ ...prev, shopPhotoUrl }));
    } catch (error) {
      console.error('Shop photo upload failed:', error);
      throw error;
    }
  };

  const handleLogoRemove = async () => {
    try {
      await BusinessService.removeLogo();
      setProfile(prev => ({ ...prev, logoUrl: '' }));
    } catch (error) {
      console.error('Logo removal failed:', error);
    }
  };

  const handleShopPhotoRemove = async () => {
    try {
      await BusinessService.removeShopPhoto();
      setProfile(prev => ({ ...prev, shopPhotoUrl: '' }));
    } catch (error) {
      console.error('Shop photo removal failed:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await BusinessService.updateProfile(profile);
      alert('Profile updated successfully!');
      
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/business-home');
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-xxl)', textAlign: 'center' }}>
        <div className="fade-in">
          <h1>Loading Profile...</h1>
          <div style={{ fontSize: '48px', marginTop: 'var(--spacing-lg)' }}>⏳</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xxl)', paddingBottom: 'var(--spacing-xxl)' }}>
      <div className="fade-in">
        <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Business Profile</h1>
        
        {error && (
          <div style={{ 
            backgroundColor: '#FEE', 
            color: '#C53030', 
            padding: 'var(--spacing-md)', 
            borderRadius: 'var(--border-radius)', 
            marginBottom: 'var(--spacing-lg)' 
          }}>
            {error}
          </div>
        )}

        {/* Section 1: Shop Information */}
        <div className="card slide-up" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Shop Information</h2>
          
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                Shop/Business Name *
              </label>
              <input
                type="text"
                value={profile.shopName}
                onChange={(e) => handleInputChange('shopName', e.target.value)}
                placeholder="Kumar Stores"
                className="form-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                Business Type *
              </label>
              <select
                value={profile.vendorType}
                onChange={(e) => handleInputChange('vendorType', e.target.value)}
                className="form-input"
                required
              >
                {businessTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  Street/Area
                </label>
                <input
                  type="text"
                  value={profile.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  placeholder="123 Main Street"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  PIN Code
                </label>
                <input
                  type="text"
                  value={profile.address.pinCode}
                  onChange={(e) => handleInputChange('address.pinCode', e.target.value)}
                  placeholder="600001"
                  className="form-input"
                  maxLength={6}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  City
                </label>
                <input
                  type="text"
                  value={profile.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  placeholder="Chennai"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  State
                </label>
                <select
                  value={profile.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className="form-input"
                >
                  <option value="">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={profile.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={profile.whatsappNumber}
                  onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="kumar@example.com"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Business Hours */}
        <div className="card slide-up" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Business Hours</h2>
          
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-md)', fontWeight: 500 }}>
              Operating Days
            </label>
            <div style={{ 
              display: 'flex', 
              gap: 'var(--spacing-md)', 
              marginBottom: 'var(--spacing-lg)',
              flexWrap: 'wrap'
            }}>
              {Object.entries(dayLabels).map(([day, label]) => (
                <label key={day} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={profile.operatingDays[day as keyof typeof profile.operatingDays]}
                    onChange={(e) => handleOperatingDayChange(day, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={profile.businessHours.is24x7}
                  onChange={(e) => handleInputChange('businessHours.is24x7', e.target.checked)}
                />
                24/7 Open
              </label>
            </div>

            {!profile.businessHours.is24x7 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={profile.businessHours.openingTime}
                    onChange={(e) => handleInputChange('businessHours.openingTime', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={profile.businessHours.closingTime}
                    onChange={(e) => handleInputChange('businessHours.closingTime', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Shop Branding */}
        <div className="card slide-up" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Shop Branding</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
            <ImageUpload
              label="Shop Logo"
              currentImageUrl={profile.logoUrl}
              onImageUpload={handleLogoUpload}
              onImageRemove={handleLogoRemove}
              aspectRatio="1/1"
            />
            <ImageUpload
              label="Shop Photo"
              currentImageUrl={profile.shopPhotoUrl}
              onImageUpload={handleShopPhotoUpload}
              onImageRemove={handleShopPhotoRemove}
              aspectRatio="4/3"
            />
          </div>
        </div>

        {/* Section 4: Additional Details */}
        <div className="card slide-up" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Additional Details</h2>
          
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                Shop Description (Max 200 characters)
              </label>
              <textarea
                value={profile.shopDescription}
                onChange={(e) => handleInputChange('shopDescription', e.target.value)}
                placeholder="Tell customers about your shop"
                className="form-input"
                maxLength={200}
                rows={3}
              />
              <div style={{ 
                fontSize: '12px', 
                color: 'var(--color-text-secondary)', 
                textAlign: 'right', 
                marginTop: 'var(--spacing-xs)' 
              }}>
                {profile.shopDescription.length}/200
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  Established Year
                </label>
                <input
                  type="number"
                  value={profile.establishedYear || ''}
                  onChange={(e) => {
                    const year = e.target.value ? parseInt(e.target.value) : undefined;
                    // Only update if it's a valid year or empty
                    if (!year || (year >= 1800 && year <= new Date().getFullYear())) {
                      handleInputChange('establishedYear', year);
                    }
                  }}
                  placeholder="1995"
                  min="1800"
                  max={new Date().getFullYear()}
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  value={profile.gstNumber}
                  onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                  className="form-input"
                  maxLength={15}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-md)', 
          justifyContent: 'flex-end',
          paddingTop: 'var(--spacing-lg)'
        }}>
          <button
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfilePage;