import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [statsCount, setStatsCount] = useState({ vendors: 0, posters: 0 });

  // Animate stats counter on load
  useEffect(() => {
    const animateStats = () => {
      let vendorCount = 0;
      let posterCount = 0;
      const vendorTarget = 1247;
      const posterTarget = 12450;
      
      const interval = setInterval(() => {
        if (vendorCount < vendorTarget) {
          vendorCount += Math.ceil(vendorTarget / 50);
          setStatsCount(prev => ({ ...prev, vendors: Math.min(vendorCount, vendorTarget) }));
        }
        if (posterCount < posterTarget) {
          posterCount += Math.ceil(posterTarget / 50);
          setStatsCount(prev => ({ ...prev, posters: Math.min(posterCount, posterTarget) }));
        }
        if (vendorCount >= vendorTarget && posterCount >= posterTarget) {
          clearInterval(interval);
        }
      }, 50);
    };
    
    animateStats();
  }, []);

  const testimonials = [
    {
      name: "Rajesh Kumar",
      shop: "Kumar General Store, Kanpur",
      location: "Kanpur, UP",
      photo: "USER",
      quote: "Earlier poster making cost 500 rupees. Now I create new posters daily just by speaking!",
      rating: 5,
      metric: "Sales up 40% in 2 months"
    },
    {
      name: "Priya Sharma", 
      shop: "Home Bakery",
      location: "Indore, MP",
      photo: "BAKER",
      quote: "From housewife to entrepreneur with VENDORVOICE GPT's help!",
      rating: 5,
      metric: "Orders doubled"
    },
    {
      name: "Murugan",
      shop: "South Street Foods",
      location: "Coimbatore, TN", 
      photo: "CHEF",
      quote: "Even in Tamil it understands, poster ready! Business is going great!",
      rating: 5,
      metric: "3x customer reach"
    }
  ];

  const features = [
    {
      icon: 'bi bi-palette',
      name: 'Auto-Design Studio',
      description: 'Professional posters in seconds',
      benefit: 'No design skills needed'
    },
    {
      icon: 'bi bi-currency-rupee',
      name: 'Smart Pricing',
      description: 'AI suggests prices that sell',
      benefit: 'Maximize your profits'
    },
    {
      icon: 'bi bi-shield-check',
      name: 'Safety Check',
      description: 'Never get rejected again',
      benefit: 'Platform-ready content'
    },
    {
      icon: 'bi bi-calendar-event',
      name: 'Festival Alerts',
      description: 'Know what to promote, when',
      benefit: 'Never miss opportunities'
    },
    {
      icon: 'bi bi-mic',
      name: 'Voice Inventory',
      description: 'Update stock while working',
      benefit: 'Hands-free management'
    },
    {
      icon: 'bi bi-cpu',
      name: 'Auto-Replies',
      description: 'Customers get instant answers',
      benefit: '24/7 customer service'
    }
  ];

  const handleVoiceDemo = () => {
    // Voice demo implementation would go here
    console.log('Voice demo triggered');
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020617 0%, #0F0F23 50%, #020617 100%)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      color: '#F8FAFC'
    }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.95) 0%, rgba(15, 15, 35, 0.8) 100%)',
        backdropFilter: 'blur(16px)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        animation: 'fadeInUp 1s ease-out'
      }}>

        
        <div className="container" style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '40px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center',
          zIndex: 2
        }}>
          {/* Left: Hero Content */}
          <div>
            {/* Brand Title */}
            <div style={{
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              <h1 style={{
                fontSize: 'clamp(56px, 10vw, 72px)',
                fontWeight: '800',
                lineHeight: '1',
                marginBottom: '0',
                background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.03em',
                animation: 'fadeInUp 1s ease-out both'
              }}>
                VENDORVOICE GPT
              </h1>
            </div>
            
            <h1 style={{
              fontSize: 'clamp(42px, 7vw, 48px)',
              fontWeight: '700',
              lineHeight: '1.1',
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              animation: 'fadeInUp 1s ease-out 0.2s both'
            }}>
              Speak. Sell. Grow.
            </h1>
            
            <h2 style={{
              fontSize: '22px',
              fontWeight: '500',
              color: '#A1A1AA',
              marginBottom: '32px',
              lineHeight: '1.5',
              animation: 'fadeInUp 1s ease-out 0.4s both'
            }}>
              Voice-powered business automation for modern retailers
            </h2>

            <p style={{
              fontSize: '17px',
              color: '#94A3B8',
              marginBottom: '44px',
              lineHeight: '1.7',
              maxWidth: '500px',
              animation: 'fadeInUp 1s ease-out 0.6s both'
            }}>
              Automate poster creation, pricing, and customer communication with AI that understands your business
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link 
                to="/register" 
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  color: '#FFFFFF',
                  padding: '14px 28px',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                  animation: 'fadeInUp 1s ease-out 0.8s both'
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
                Start Free Trial
              </Link>
              
              <button 
                onClick={handleVoiceDemo}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  color: '#A855F7',
                  padding: '14px 28px',
                  borderRadius: '25px',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animation: 'fadeInUp 1s ease-out 0.8s both'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#A855F7';
                  e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div style={{ 
              marginTop: '40px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                padding: '8px 16px',
                borderRadius: '15px',
                color: '#60A5FA',
                fontSize: '14px',
                fontWeight: '500',
                animation: 'fadeInUp 1s ease-out 1s both'
              }}>
                Enterprise Security
              </span>
              <span style={{ 
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                padding: '8px 16px',
                borderRadius: '15px',
                color: '#60A5FA',
                fontSize: '14px',
                fontWeight: '500',
                animation: 'fadeInUp 1s ease-out 1.1s both'
              }}>
                No Credit Card Required
              </span>
              <span style={{ 
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                padding: '8px 16px',
                borderRadius: '15px',
                color: '#60A5FA',
                fontSize: '14px',
                fontWeight: '500',
                animation: 'fadeInUp 1s ease-out 1.2s both'
              }}>
                Free 14-Day Trial
              </span>
            </div>
          </div>

          {/* Right: Hero Visual */}
          <div style={{ 
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              width: '400px',
              height: '300px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              animation: 'fadeInUp 1s ease-out 0.6s both, floatAnimation 6s ease-in-out infinite 2s'
            }}>
              <div style={{
                fontSize: '48px',
                color: '#64748B'
              }}>
                <i className="bi bi-graph-up"></i>
              </div>
              
              {/* Floating UI Elements */}
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                backdropFilter: 'blur(8px)',
                padding: '8px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                fontSize: '12px',
                fontWeight: '600',
                color: '#4ADE80',
                animation: 'fadeInUp 1s ease-out 1.2s both'
              }}>
                Automated
              </div>
              
              <div style={{
                position: 'absolute',
                bottom: '-12px',
                left: '-12px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                backdropFilter: 'blur(8px)',
                padding: '8px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: '12px',
                fontWeight: '600',
                color: '#60A5FA',
                animation: 'fadeInUp 1s ease-out 1.4s both'
              }}>
                AI-Powered
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes floatAnimation {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes expand {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 5px rgba(96, 165, 250, 0.3), 0 0 10px rgba(96, 165, 250, 0.2), 0 0 15px rgba(96, 165, 250, 0.1);
            }
            50% {
              box-shadow: 0 0 10px rgba(96, 165, 250, 0.4), 0 0 20px rgba(96, 165, 250, 0.3), 0 0 30px rgba(96, 165, 250, 0.2);
            }
          }
          
          * {
            will-change: transform, opacity;
          }
          
          section {
            animation: fadeInUp 0.8s ease-out;
          }
          
          @media (max-width: 768px) {
            .container > div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }
            
            h1 {
              font-size: 36px !important;
            }
            
            h2 {
              font-size: 28px !important;
            }
            
            .hero-cta {
              flex-direction: column !important;
              width: 100% !important;
            }
            
            .hero-cta a,
            .hero-cta button {
              width: 100% !important;
              justify-content: center !important;
            }
          }
          
          @media (max-width: 480px) {
            .container {
              padding: 0 16px !important;
            }
            
            section {
              padding: 60px 0 !important;
            }
            
            h1 {
              font-size: 32px !important;
            }
            
            h2 {
              font-size: 24px !important;
            }
          }
        `}</style>
      </section>

      {/* Problem-Solution Section */}
      <section style={{ 
        padding: '120px 0', 
        background: 'linear-gradient(135deg, rgba(15, 15, 35, 0.8) 0%, rgba(2, 6, 23, 0.95) 100%)',
        position: 'relative',
        animation: 'fadeInUp 1s ease-out'
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '80px',
            alignItems: 'center' 
          }}>
            {/* The Struggle */}
            <div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '600',
                color: '#94A3B8',
                marginBottom: '30px',
                lineHeight: '1.3',
                letterSpacing: '-0.01em'
              }}>
                Traditional business challenges
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#F87171' }}>×</span>
                  </div>
                  <span style={{ color: '#A1A1AA', fontSize: '16px' }}>Manual design processes slow growth</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#F87171' }}>×</span>
                  </div>
                  <span style={{ color: '#A1A1AA', fontSize: '16px' }}>High design costs eat into profits</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#F87171' }}>×</span>
                  </div>
                  <span style={{ color: '#A1A1AA', fontSize: '16px' }}>Inconsistent pricing strategies</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#F87171' }}>×</span>
                  </div>
                  <span style={{ color: '#A1A1AA', fontSize: '16px' }}>Limited customer engagement tools</span>
                </div>
              </div>

              <div style={{ 
                marginTop: '24px',
                padding: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <p style={{ color: '#94A3B8', fontSize: '16px', lineHeight: '1.5', margin: 0 }}>
                  Most businesses struggle with outdated processes that limit digital transformation
                </p>
              </div>
            </div>

            {/* The Solution */}
            <div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '30px',
                lineHeight: '1.3',
                letterSpacing: '-0.01em'
              }}>
                AI-powered business automation
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#4ADE80' }}>✓</span>
                  </div>
                  <span style={{ color: '#4ADE80', fontSize: '16px', fontWeight: '600' }}>Natural language voice commands</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#4ADE80' }}>✓</span>
                  </div>
                  <span style={{ color: '#4ADE80', fontSize: '16px', fontWeight: '600' }}>Instant professional design generation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#4ADE80' }}>✓</span>
                  </div>
                  <span style={{ color: '#4ADE80', fontSize: '16px', fontWeight: '600' }}>Intelligent pricing optimization</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#4ADE80' }}>✓</span>
                  </div>
                  <span style={{ color: '#4ADE80', fontSize: '16px', fontWeight: '600' }}>Multi-platform distribution ready</span>
                </div>
              </div>

              <div style={{ 
                marginTop: '24px',
                padding: '20px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                borderRadius: '12px',
                color: '#FFFFFF',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}>
                <p style={{ fontWeight: '600', fontSize: '16px', margin: 0 }}>
                  Transform your business operations with enterprise-grade AI automation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ 
        padding: '120px 0', 
        background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.95) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(2, 6, 23, 0.95) 100%)',
        position: 'relative',
        animation: 'fadeInUp 1s ease-out'
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{
              fontSize: '3rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '20px',
              letterSpacing: '-0.02em'
            }}>
              Ready in Just 3 Steps!
            </h2>
            <p style={{ fontSize: '20px', color: '#A1A1AA', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
              No training needed. Just speak naturally in your language.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '40px',
            alignItems: 'start'
          }}>
            {/* Step 1 */}
            <div style={{ 
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B35 0%, #F59E0B 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: '700',
                margin: '0 auto 30px auto',
                boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)'
              }}>
                1
              </div>
              
              <div style={{ fontSize: '60px', marginBottom: '20px', color: '#60A5FA' }}>
                <i className="bi bi-mic"></i>
              </div>
              
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '15px'
              }}>
                Speak
              </h3>
              
              <div style={{ 
                backgroundColor: 'rgba(255, 182, 39, 0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 182, 39, 0.3)',
                padding: '12px 20px',
                borderRadius: '20px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#FCD34D',
                marginBottom: '15px',
                display: 'inline-block'
              }}>
                "மாம்பழம் சலுகை - 50 ரூபாய்க்கு ஒரு கிலோ"
              </div>
              
              <p style={{ color: '#94A3B8', fontSize: '16px' }}>
                Just speak your offer in Hindi, Tamil, or your language
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFB627 0%, #F59E0B 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: '700',
                margin: '0 auto 30px auto',
                boxShadow: '0 4px 15px rgba(255, 182, 39, 0.4)'
              }}>
                2
              </div>
              
              <div style={{ fontSize: '60px', marginBottom: '20px', color: '#FCD34D' }}>
                <i className="bi bi-cpu"></i>
              </div>
              
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '15px'
              }}>
                AI Creates
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
                <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', color: '#4ADE80' }}>
                  Design
                </span>
                <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', color: '#4ADE80' }}>
                  Price
                </span>
                <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', color: '#4ADE80' }}>
                  Check
                </span>
              </div>
              
              <p style={{ color: '#94A3B8', fontSize: '16px' }}>
                VENDORVOICE GPT designs, prices, and validates everything
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2D6A4F 0%, #059669 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: '700',
                margin: '0 auto 30px auto',
                boxShadow: '0 4px 15px rgba(45, 106, 79, 0.4)'
              }}>
                3
              </div>
              
              <div style={{ fontSize: '60px', marginBottom: '20px', color: '#4ADE80' }}>
                <i className="bi bi-share"></i>
              </div>
              
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '15px'
              }}>
                Ready to Use
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
                <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', color: '#60A5FA' }}>
                  WhatsApp
                </span>
                <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', color: '#60A5FA' }}>
                  Facebook
                </span>
                <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', color: '#60A5FA' }}>
                  Print
                </span>
              </div>
              
              <p style={{ color: '#94A3B8', fontSize: '16px' }}>
                Share instantly - no edits needed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section style={{ 
        padding: '120px 0', 
        background: 'linear-gradient(135deg, rgba(15, 15, 35, 0.8) 0%, rgba(2, 6, 23, 0.95) 100%)',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
              letterSpacing: '-0.01em'
            }}>
              Complete business automation
            </h2>
            <p style={{ fontSize: '18px', color: '#94A3B8', lineHeight: '1.6' }}>
              Everything you need to run a modern retail business
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '24px' 
          }}>
            {features.map((feature, index) => (
              <div 
                key={index}
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{ 
                  fontSize: '32px', 
                  marginBottom: '16px',
                  color: '#60A5FA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start'
                }}>
                  <i className={feature.icon}></i>
                </div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#F8FAFC',
                  marginBottom: '8px'
                }}>
                  {feature.name}
                </h3>
                <p style={{ color: '#94A3B8', marginBottom: '12px', lineHeight: '1.6', fontSize: '14px' }}>
                  {feature.description}
                </p>
                <p style={{ 
                  background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: '500', 
                  fontSize: '14px'
                }}>
                  {feature.benefit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section style={{ 
        padding: '120px 0', 
        background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%)',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
              letterSpacing: '-0.01em'
            }}>
              Trusted by {statsCount.vendors.toLocaleString()}+ businesses
            </h2>
            <p style={{ fontSize: '18px', color: '#94A3B8', lineHeight: '1.6' }}>
              {statsCount.posters.toLocaleString()} campaigns automated this month
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '32px' 
          }}>
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundColor: '#F1F5F9', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#64748B'
                  }}>
                    {testimonial.photo}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#F8FAFC' }}>
                      {testimonial.name}
                    </h4>
                    <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '2px' }}>
                      {testimonial.shop}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280' }}>
                      {testimonial.location}
                    </p>
                  </div>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <span key={i} style={{ color: '#F59E0B', fontSize: '14px' }}>*</span>
                  ))}
                </div>
                
                <blockquote style={{ 
                  fontSize: '14px', 
                  lineHeight: '1.5', 
                  marginBottom: '16px',
                  color: '#D1D5DB',
                  fontStyle: 'normal'
                }}>
                  "{testimonial.quote}"
                </blockquote>
                
                <div style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#60A5FA'
                }}>
                  {testimonial.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ 
        padding: '120px 0', 
        background: 'linear-gradient(135deg, rgba(15, 15, 35, 0.8) 0%, rgba(2, 6, 23, 0.95) 100%)',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
              letterSpacing: '-0.01em'
            }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: '18px', color: '#94A3B8', lineHeight: '1.6' }}>
              Choose the plan that works for your business
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '32px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {/* Free Plan */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '32px 24px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#F8FAFC', marginBottom: '8px' }}>
                Free Trial
              </h3>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#94A3B8', marginBottom: '16px' }}>
                ₹0
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                14 days, then ₹99/month
              </div>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                textAlign: 'left',
                marginBottom: '24px'
              }}>
                <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#4ADE80' }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#94A3B8' }}>5 automated campaigns</span>
                </li>
                <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#4ADE80' }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#94A3B8' }}>Voice commands</span>
                </li>
                <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#4ADE80' }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#94A3B8' }}>Basic templates</span>
                </li>
                <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#4ADE80' }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#94A3B8' }}>Email support</span>
                </li>
              </ul>
              <Link
                to="/register"
                style={{
                  display: 'block',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  color: '#94A3B8',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pro Plan */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '32px 24px',
              textAlign: 'center',
              border: '2px solid rgba(139, 92, 246, 0.5)',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                color: '#FFFFFF',
                padding: '4px 16px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                RECOMMENDED
              </div>
              
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#F8FAFC', marginBottom: '8px' }}>
                Professional
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ 
                  fontSize: '32px', 
                  fontWeight: '700', 
                  background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>₹99</span>
                <span style={{ color: '#94A3B8', fontSize: '14px' }}>/month</span>
              </div>
              
              <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>
                Everything you need for business growth
              </p>
              
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                textAlign: 'left',
                marginBottom: '24px'
              }}>
                <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#4ADE80' }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#94A3B8' }}><strong>Unlimited</strong> campaigns</span>
                </li>
                <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#4ADE80' }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#94A3B8' }}>Smart pricing analytics</span>
                </li>
                <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#4ADE80' }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#94A3B8' }}>Advanced automation</span>
                </li>
                <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#4ADE80' }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#94A3B8' }}>Premium templates</span>
                </li>
                <li style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#4ADE80' }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#94A3B8' }}>Priority support</span>
                </li>
              </ul>
              <Link
                to="/register"
                style={{
                  display: 'block',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                Start Professional
              </Link>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '16px' }}>
              Secure payments via UPI, card, or bank transfer
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <div style={{ 
                padding: '8px 16px', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                backdropFilter: 'blur(8px)',
                borderRadius: '8px', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                fontSize: '12px', 
                color: '#94A3B8' 
              }}>UPI</div>
              <div style={{ 
                padding: '8px 16px', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                backdropFilter: 'blur(8px)',
                borderRadius: '8px', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                fontSize: '12px', 
                color: '#94A3B8' 
              }}>Cards</div>
              <div style={{ 
                padding: '8px 16px', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                backdropFilter: 'blur(8px)',
                borderRadius: '8px', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                fontSize: '12px', 
                color: '#94A3B8' 
              }}>Bank Transfer</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={{ 
        padding: '120px 0',
        background: 'linear-gradient(135deg, #1E293B 0%, #020617 100%)',
        color: '#FFFFFF',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{
            fontSize: 'clamp(32px, 6vw, 48px)',
            fontWeight: '600',
            marginBottom: '16px',
            lineHeight: '1.2',
            background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}>
            Ready to automate your business?
          </h2>
          
          <p style={{
            fontSize: '18px',
            marginBottom: '32px',
            opacity: 0.9,
            lineHeight: '1.6'
          }}>
            Join thousands of businesses already growing with AI automation
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link 
              to="/register"
              style={{
                background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
                color: '#FFFFFF',
                padding: '16px 32px',
                borderRadius: '25px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(96, 165, 250, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(96, 165, 250, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(96, 165, 250, 0.4)';
              }}
            >
              Start Free Trial
            </Link>
            
            <a 
              href="https://wa.me/+919876543210"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                color: '#FFFFFF',
                padding: '16px 32px',
                borderRadius: '25px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Contact Sales
            </a>
          </div>

          <p style={{ marginTop: '32px', fontSize: '14px', opacity: 0.8 }}>
            No setup fees • Cancel anytime • 14-day money-back guarantee
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: '#020617', 
        color: '#FFFFFF', 
        padding: '60px 0 20px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '40px',
            marginBottom: '40px'
          }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', 
                background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                VENDORVOICE GPT
              </h3>
              <p style={{ color: '#6B7280', lineHeight: '1.6', marginBottom: '20px', fontSize: '14px' }}>
                AI-powered business automation for modern retailers. Streamline operations with voice commands and intelligent workflows.
              </p>
              
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '4px', fontSize: '14px', color: '#F8FAFC' }}>Support</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#60A5FA' }}>support@vendorvoicegpt.com</div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                padding: '8px 12px',
                borderRadius: '6px',
                display: 'inline-block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#4ADE80',
                border: '1px solid rgba(74, 222, 128, 0.2)'
              }}>
                Enterprise Ready
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#F8FAFC' }}>Product</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ padding: '6px 0' }}><a href="#" style={{ color: '#6B7280', textDecoration: 'none', fontSize: '14px' }} onMouseEnter={(e) => e.currentTarget.style.color = '#94A3B8'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}>Voice Automation</a></li>
                <li style={{ padding: '6px 0' }}><button style={{ background: 'none', border: 'none', color: '#6B7280', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease', cursor: 'pointer' }}>Smart Analytics</button></li>
                <li style={{ padding: '6px 0' }}><button style={{ background: 'none', border: 'none', color: '#6B7280', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease', cursor: 'pointer' }}>Campaign Management</button></li>
                <li style={{ padding: '6px 0' }}><button style={{ background: 'none', border: 'none', color: '#6B7280', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease', cursor: 'pointer' }}>API Integration</button></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#F8FAFC' }}>Resources</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ padding: '6px 0' }}><button style={{ background: 'none', border: 'none', color: '#6B7280', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease', cursor: 'pointer' }}>Documentation</button></li>
                <li style={{ padding: '6px 0' }}><button style={{ background: 'none', border: 'none', color: '#6B7280', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease', cursor: 'pointer' }}>API Reference</button></li>
                <li style={{ padding: '6px 0' }}><button style={{ background: 'none', border: 'none', color: '#6B7280', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease', cursor: 'pointer' }}>Help Center</button></li>
                <li style={{ padding: '6px 0' }}><button style={{ background: 'none', border: 'none', color: '#6B7280', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease', cursor: 'pointer' }}>Community</button></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#F8FAFC' }}>Company</h4>
              <div style={{ marginBottom: '20px' }}>
                <button 
                  onClick={() => setCurrentLanguage('en')}
                  style={{
                    backgroundColor: currentLanguage === 'en' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(8px)',
                    color: '#F8FAFC',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginRight: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  English
                </button>
                <button 
                  onClick={() => setCurrentLanguage('hi')}
                  style={{
                    backgroundColor: currentLanguage === 'hi' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(8px)',
                    color: '#F8FAFC',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Hindi
                </button>
              </div>
              
              <div style={{ 
                marginTop: '16px', 
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Monthly Usage</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#60A5FA' }}>
                  {statsCount.posters.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>campaigns automated</div>
              </div>
            </div>
          </div>

          <div style={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
            paddingTop: '20px',
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '14px'
          }}>
            <p>
              © 2024 VENDORVOICE GPT. Built for modern businesses. 
              <span style={{ margin: '0 20px' }}>•</span>
              <button style={{ background: 'none', border: 'none', color: '#6B7280', transition: 'color 0.2s ease', cursor: 'pointer' }}>Privacy Policy</button>
              <span style={{ margin: '0 10px' }}>•</span>
              <button style={{ background: 'none', border: 'none', color: '#6B7280', transition: 'color 0.2s ease', cursor: 'pointer' }}>Terms of Service</button>
            </p>
          </div>
        </div>
      </footer>

        <style>{`
          @media (max-width: 768px) {
            .container > div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }
            
            h1 {
              font-size: 36px !important;
            }
            
            h2 {
              font-size: 28px !important;
            }
            
            .hero-cta {
              flex-direction: column !important;
              width: 100% !important;
            }
            
            .hero-cta a,
            .hero-cta button {
              width: 100% !important;
              justify-content: center !important;
            }
          }
          
          @media (max-width: 480px) {
            .container {
              padding: 0 16px !important;
            }
            
            section {
              padding: 60px 0 !important;
            }
            
            h1 {
              font-size: 32px !important;
            }
            
            h2 {
              font-size: 24px !important;
            }
          }
        `}</style>
    </div>
  );
};

export default Landing;