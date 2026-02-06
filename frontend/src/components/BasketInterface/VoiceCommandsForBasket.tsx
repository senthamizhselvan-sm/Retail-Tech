import React, { useState } from 'react';
import VoiceInput from '../VoiceInput';

interface VoiceCommandsForBasketProps {
  onVoiceCommand: (command: string) => void;
  mode: 'supplier' | 'customer';
  disabled?: boolean;
}

const VoiceCommandsForBasket: React.FC<VoiceCommandsForBasketProps> = ({
  onVoiceCommand,
  mode,
  disabled = false
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const handleVoiceInput = (transcript: string) => {
    onVoiceCommand(transcript);
  };

  const basketCommands = {
    supplier: {
      title: '📥 Supplier Mode Commands',
      english: [
        '"Confirm delivery" - Process incoming basket',
        '"Reset all" - Clear all baskets',
        '"Switch to customer mode" - Change mode'
      ],
      tamil: [
        '"டெலிவரி உறுதி" - வரும் கூடையை செயல்படுத்து',
        '"அனைத்தும் ரீசெட்" - எல்லா கூடைகளையும் காலி செய்',
        '"வாடிக்கையாளர் மோட்" - மோட் மாற்று'
      ]
    },
    customer: {
      title: '📤 Customer Mode Commands',
      english: [
        '"Complete sale" - Process outgoing basket',
        '"Add 50 rupees" - Add cash to pot',
        '"Switch to supplier mode" - Change mode'
      ],
      tamil: [
        '"விற்பனை முடிவு" - வெளியே போகும் கூடையை செயல்படுத்து',
        '"ஐம்பது ரூபாய் சேர்" - பணப் பானையில் சேர்',
        '"விற்பனையாளர் மோட்" - மோட் மாற்று'
      ]
    }
  };

  const currentCommands = basketCommands[mode];

  return (
    <div className="voice-commands-basket">
      <div className="voice-header">
        <h4>🎤 Basket Voice Commands</h4>
        <button
          className="help-toggle"
          onClick={() => setShowHelp(!showHelp)}
          disabled={disabled}
        >
          {showHelp ? '❌' : '❓'}
        </button>
      </div>

      {/* Voice Input Component */}
      <VoiceInput
        onTranscript={handleVoiceInput}
        disabled={disabled}
        className="basket-voice-input"
      />

      {/* Mode Indicator */}
      <div className={`mode-indicator ${mode}`}>
        <span className="mode-icon">
          {mode === 'supplier' ? '📥' : '📤'}
        </span>
        <span className="mode-text">
          {mode === 'supplier' ? 'Supplier Mode' : 'Customer Mode'}
        </span>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="voice-help-panel">
          <h5>{currentCommands.title}</h5>
          
          <div className="command-sections">
            <div className="command-section">
              <h6>🇬🇧 English Commands:</h6>
              <ul>
                {currentCommands.english.map((cmd, idx) => (
                  <li key={idx}>{cmd}</li>
                ))}
              </ul>
            </div>
            
            <div className="command-section">
              <h6>🇮🇳 Tamil Commands (தமிழ்):</h6>
              <ul>
                {currentCommands.tamil.map((cmd, idx) => (
                  <li key={idx}>{cmd}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* General Commands */}
          <div className="general-commands">
            <h6>📦 General Inventory Commands:</h6>
            <p className="command-note">
              All regular inventory voice commands work here too:
            </p>
            <ul>
              <li>"Add 5 rice" / "ஐந்து அரிசி சேர்"</li>
              <li>"Sold 2 soap" / "இரண்டு சோப் விற்பனை"</li>
              <li>"New product butter 10" / "புதிய பொருள் வெண்ணெய் பத்து"</li>
            </ul>
          </div>

          {/* Tips */}
          <div className="voice-tips">
            <h6>💡 Tips:</h6>
            <ul>
              <li>Speak clearly and wait for the beep</li>
              <li>Use simple, direct commands</li>
              <li>AI auto-corrects common mistakes</li>
              <li>Switch languages anytime</li>
            </ul>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="quick-actions">
        <button
          className="quick-action-btn mode-switch"
          onClick={() => onVoiceCommand(mode === 'supplier' ? 'customer mode' : 'supplier mode')}
          disabled={disabled}
        >
          🔄 Switch to {mode === 'supplier' ? 'Customer' : 'Supplier'} Mode
        </button>
        
        {mode === 'supplier' && (
          <button
            className="quick-action-btn confirm"
            onClick={() => onVoiceCommand('confirm delivery')}
            disabled={disabled}
          >
            ✅ Confirm Delivery
          </button>
        )}
        
        {mode === 'customer' && (
          <button
            className="quick-action-btn complete"
            onClick={() => onVoiceCommand('complete sale')}
            disabled={disabled}
          >
            💰 Complete Sale
          </button>
        )}
        
        <button
          className="quick-action-btn reset"
          onClick={() => onVoiceCommand('reset all')}
          disabled={disabled}
        >
          🔄 Reset All
        </button>
      </div>
    </div>
  );
};

export default VoiceCommandsForBasket;