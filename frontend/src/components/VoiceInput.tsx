import React, { useState, useCallback, useRef } from 'react';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceInputProps {
  onTranscript: (transcript: string, append?: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTranscript, 
  disabled = false, 
  className = '' 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const accumulatedTranscript = useRef<string>('');

  // Check if browser supports speech recognition
  const isSpeechRecognitionSupported = useCallback(() => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }, []);

  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      alert('Voice input not supported in this browser');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      // Configure speech recognition for continuous listening
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-IN'; // Default to Indian English
      recognitionInstance.maxAlternatives = 1;

      // Clear accumulated transcript when starting
      accumulatedTranscript.current = '';

      recognitionInstance.onstart = () => {
        setIsListening(true);
        console.log('Voice recognition started');
      };

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        
        // Process all results to get the latest final transcript
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        
        // Accumulate only final results, don't send to parent yet
        if (finalTranscript.trim()) {
          accumulatedTranscript.current += finalTranscript;
          console.log('Accumulated transcript:', accumulatedTranscript.current);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
        setIsListening(false);
        
        // Show user-friendly error messages
        switch (event.error) {
          case 'network':
            alert('Network error occurred. Please check your connection.');
            break;
          case 'not-allowed':
            alert('Microphone access denied. Please enable microphone permissions.');
            break;
          case 'no-speech':
            // Don't show alert for no-speech, it's common
            break;
          default:
            console.error('Speech recognition error:', event.error);
        }
      };

      recognitionInstance.onend = () => {
        // Send final accumulated transcript to parent component
        if (accumulatedTranscript.current.trim()) {
          onTranscript(accumulatedTranscript.current.trim(), true);
          console.log('Final transcript sent:', accumulatedTranscript.current.trim());
        }
        
        setIsListening(false);
        setRecognition(null);
        accumulatedTranscript.current = '';
        console.log('Voice recognition ended');
      };

      recognitionInstance.start();
      setRecognition(recognitionInstance);

    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      alert('Voice input not supported in this browser');
    }
  }, [onTranscript, isSpeechRecognitionSupported]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      // Note: Final transcript will be sent via onend event
    }
  }, [recognition]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening, disabled]);

  return (
    <>
      <style>
        {`
          @keyframes voice-pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(255, 107, 53, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(255, 107, 53, 0);
            }
          }
          .voice-input-button.listening {
            animation: voice-pulse 1.5s infinite;
          }
        `}
      </style>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`voice-input-button ${className} ${isListening ? 'listening' : ''} ${disabled ? 'disabled' : ''}`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
        style={{
          padding: '8px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          backgroundColor: isListening ? '#FF6B35' : 'var(--color-background)',
          color: isListening ? '#FFFFFF' : 'var(--color-text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          transition: 'all 0.2s ease',
          minWidth: '100px',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1
        }}
      >
        <span style={{ fontSize: '16px' }}>🎤</span>
        <span>
          {isListening ? 'Listening...' : 'Voice'}
        </span>
      </button>
    </>
  );
};

export default VoiceInput;