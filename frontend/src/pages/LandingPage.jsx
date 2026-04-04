import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="badge animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span>✨</span> Introducing SnapRAG
        </div>
        <h1 className="hero-title animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Supercharge Your <br />
          <span className="text-gradient">Study Sessions</span>
        </h1>
        <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Your intelligent study companion. Access subjects, interact with dynamic study materials, and chat with an AI assistant all in one powerful workspace.
        </p>
        
        <div className="hero-actions animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <button className="primary-btn" onClick={() => navigate('/app')}>
            Start Learning
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="bg-glow glow-1"></div>
      <div className="bg-glow glow-2"></div>
    </div>
  );
};

export default LandingPage;
