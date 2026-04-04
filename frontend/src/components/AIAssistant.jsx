import React from 'react';
import './AIAssistant.css';

const AIAssistant = () => {
  return (
    <div className="glass-pane ai-assistant animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="pane-header">
        <h3 className="pane-title">
          <span className="ai-icon">✨</span> AI assistant
        </h3>
      </div>
      
      <div className="ai-chat-area">
        <div className="chat-welcome">
          <div className="ai-avatar">AI</div>
          <p>Hello! Ask me any question related to Chapter 3.</p>
        </div>
      </div>
      
      <div className="pane-footer ai-footer">
        <div className="question-input-wrapper">
          <input type="text" placeholder="question" className="question-input" />
          <button className="send-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
