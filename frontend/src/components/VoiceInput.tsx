import React, { useState, useCallback, useEffect } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type Lang = 'en-IN' | 'ta-IN';

interface VoiceInputProps {
  onTranscript: (transcript: string, append?: boolean, lang?: Lang) => void;
  onLanguageChange?: (lang: Lang) => void;
  disabled?: boolean;
  className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onLanguageChange,
  disabled = false,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [language, setLanguage] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('voiceLanguage') as Lang;
      return saved === 'ta-IN' ? 'ta-IN' : 'en-IN';
    } catch {
      return 'en-IN';
    }
  });

  // Save language preference
  useEffect(() => {
    try {
      localStorage.setItem('voiceLanguage', language);
    } catch { }
    onLanguageChange?.(language);
  }, [language, onLanguageChange]);

  // Check browser support
  const isSpeechSupported = useCallback(() => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSpeechSupported()) {
      alert('Voice input not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (disabled) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      // Optimized settings for inventory commands
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = language;
      recognitionInstance.maxAlternatives = 3;

      recognitionInstance.onstart = () => {
        console.log(`🎤 Listening (${language === 'ta-IN' ? 'Tamil' : 'English'})...`);
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: any) => {
        // Get all alternatives
        const alternatives: { transcript: string; confidence: number }[] = [];

        for (let i = 0; i < event.results.length; i++) {
          for (let j = 0; j < event.results[i].length; j++) {
            alternatives.push({
              transcript: event.results[i][j].transcript,
              confidence: event.results[i][j].confidence
            });
          }
        }

        // Sort by confidence
        alternatives.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

        if (alternatives.length > 0) {
          const bestMatch = alternatives[0].transcript;
          console.log('✅ Voice recognized:', bestMatch, 'Confidence:', alternatives[0].confidence);

          // Log all alternatives for debugging
          console.log('📋 All alternatives:', alternatives.map(a => a.transcript));

          onTranscript(bestMatch, false, language);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Voice error:', event.error);
        setIsListening(false);

        switch (event.error) {
          case 'not-allowed':
            alert('Microphone access denied. Please allow microphone permissions in browser settings.');
            break;
          case 'no-speech':
            // Silent error - no alert needed
            console.log('No speech detected');
            break;
          case 'audio-capture':
            alert('No microphone found. Please connect a microphone.');
            break;
          case 'network':
            alert('Network error. Check your internet connection.');
            break;
          default:
            console.warn('Voice recognition error:', event.error);
        }
      };

      recognitionInstance.onend = () => {
        console.log('🎤 Stopped listening');
        setIsListening(false);
      };

      recognitionInstance.start();
      setRecognition(recognitionInstance);

    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      alert('Voice input failed to start. Please refresh the page and try again.');
    }
  }, [onTranscript, isSpeechSupported, language, disabled]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
      setIsListening(false);
    }
  }, [recognition]);

  // Toggle listening
  const handleClick = useCallback(() => {
    if (disabled) return;

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening, disabled]);

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en-IN' ? 'ta-IN' : 'en-IN');
  };

  // Example commands based on language
  const examples = {
    'en-IN': ['add 5 rice', 'sold 2 soap', 'new product sugar 10'],
    'ta-IN': ['ஐந்து அரிசி சேர்', 'இரண்டு சோப் விற்பனை', 'புதிய பொருள் சர்க்கரை']
  };

  const helpText = {
    'en-IN': 'Speak clearly: "add [number] [product]" or "sold [number] [product]"',
    'ta-IN': 'தெளிவாக பேசுங்கள்: "[எண்] [பொருள்] சேர்" அல்லது "[எண்] [பொருள்] விற்பனை"'
  };

  return (
    <div className={`voice-input-container ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-md)',
      padding: 'var(--spacing-md)',
      backgroundColor: 'var(--color-background-alt)',
      borderRadius: 'var(--border-radius)',
      border: '2px solid var(--color-border)'
    }}>
      {/* Language Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={toggleLanguage}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {language === 'en-IN' ? '🇬🇧' : '🇮🇳'}
          {language === 'en-IN' ? 'English' : 'தமிழ்'}
        </button>

        {/* Microphone Button */}
        <button
          onClick={handleClick}
          disabled={disabled}
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            backgroundColor: isListening ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '24px',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isListening ? '0 0 20px rgba(220, 53, 69, 0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {isListening ? '⏹️' : '🎤'}
        </button>
      </div>

      {/* Status Text */}
      <div style={{
        textAlign: 'center',
        fontSize: '14px',
        color: isListening ? '#dc3545' : '#6c757d',
        fontWeight: isListening ? 'bold' : 'normal'
      }}>
        {isListening
          ? (language === 'en-IN' ? '🔴 Listening...' : '🔴 கேட்கிறது...')
          : (language === 'en-IN' ? 'Click microphone to speak' : 'பேச மைக்ரோபோனை கிளிக் செய்யவும்')
        }
      </div>

      {/* Help Text */}
      <div style={{
        fontSize: '12px',
        color: '#6c757d',
        textAlign: 'center',
        borderTop: '1px solid var(--color-border)',
        paddingTop: 'var(--spacing-sm)'
      }}>
        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
          {language === 'en-IN' ? '📝 Examples:' : '📝 உதாரணங்கள்:'}
        </div>
        <div>{examples[language].join(' • ')}</div>
        <div style={{ marginTop: '8px', fontSize: '11px', fontStyle: 'italic' }}>
          💡 {helpText[language]}
        </div>
      </div>
    </div>
  );
};

export default VoiceInput;