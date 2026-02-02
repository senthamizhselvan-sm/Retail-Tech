import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import '../styles/VendorAssistant.css';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

const VendorAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/assistant/chat', {
        message: inputMessage.trim(),
      });

      if (response.data.success) {
        const aiResponse = response.data.data.aiResponse;
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse),
          timestamp: response.data.data.timestamp,
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.data.message || 'Failed to get AI response');
      }
    } catch (error: any) {
      console.error('Assistant chat error:', error);
      
      // Show fallback AI message
      const errorResponse = error.response?.data?.data?.aiResponse;
      const fallbackContent = typeof errorResponse === 'string' 
        ? errorResponse 
        : "I couldn't understand that. Try asking about stock, offers, or sales.";
        
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: fallbackContent,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, fallbackMessage]);

      toast.error('Assistant service temporarily unavailable');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exampleQuestions = [
    "What items are low in stock?",
    "What should I promote today?",
    "Which products are expiring soon?",
    "What sells best on weekends?",
  ];

  return (
    <div className="vendor-assistant">
      <div className="assistant-header">
        <div className="header-content">
          <div className="assistant-info">
            <div className="assistant-avatar">
              🤖
            </div>
            <div>
              <h1>Your Business Assistant</h1>
              <p>Ask me anything about your inventory, offers, and business insights</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="clear-button"
            disabled={messages.length === 0}
          >
            Clear Chat
          </button>
        </div>
      </div>

      <div className="chat-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>Ask anything about your business</h3>
            <p>Get instant insights about your inventory, offers, and sales trends.</p>
            
            <div className="example-questions">
              <h4>Try asking:</h4>
              <div className="question-buttons">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="example-button"
                    onClick={() => setInputMessage(question)}
                    disabled={isLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.type}-message`}
              >
                <div className="message-content">
                  <div className="message-text">
                    {message.content}
                  </div>
                  <div className="message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                {message.type === 'ai' && (
                  <div className="message-avatar">🤖</div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message ai-message loading">
                <div className="message-content">
                  <div className="message-text">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    AI is thinking...
                  </div>
                </div>
                <div className="message-avatar">🤖</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="chat-input-container">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your inventory, offers, or business..."
            disabled={isLoading}
            maxLength={200}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
        <div className="input-hint">
          Press Enter to send • {inputMessage.length}/200 characters
        </div>
      </div>
    </div>
  );
};

export default VendorAssistant;