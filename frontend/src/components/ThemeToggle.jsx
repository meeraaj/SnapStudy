import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isLight]);

  return (
    <button 
      onClick={() => setIsLight(!isLight)}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 1000,
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        padding: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-glow)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)'
      }}
      title="Toggle Theme"
    >
      {isLight ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle;
