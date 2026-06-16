import React, { useState, useEffect, useRef } from 'react';
import { getAISettings, saveAISettings, streamAIResponse, stripHtml } from '../utils/ai';
import './AIAssistant.css';

const AIAssistant = ({ activeChapterId, chapterTitle, chapterContent }) => {
  const [settings, setSettings] = useState(() => getAISettings());
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'summary', 'concepts', 'settings'
  
  // Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Cache States for chapter summaries and concepts
  const [summaryCache, setSummaryCache] = useState({});
  const [conceptsCache, setConceptsCache] = useState({});
  
  // Streaming States
  const [streamingText, setStreamingText] = useState('');
  const [streamingTarget, setStreamingTarget] = useState(null); // 'chat', 'summary', 'concepts'
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Form States for settings (loaded from settings state)
  const [formProvider, setFormProvider] = useState(settings.provider);
  const [formOllamaEndpoint, setFormOllamaEndpoint] = useState(settings.ollamaEndpoint);
  const [formOllamaModel, setFormOllamaModel] = useState(settings.ollamaModel);
  const [formGeminiApiKey, setFormGeminiApiKey] = useState(settings.geminiApiKey);
  const [formGeminiModel, setFormGeminiModel] = useState(settings.geminiModel);
  const [formOpenaiBaseUrl, setFormOpenaiBaseUrl] = useState(settings.openaiBaseUrl);
  const [formOpenaiApiKey, setFormOpenaiApiKey] = useState(settings.openaiApiKey);
  const [formOpenaiModel, setFormOpenaiModel] = useState(settings.openaiModel);

  const abortControllerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Load settings on mount
  useEffect(() => {
    const loaded = getAISettings();
    setSettings(loaded);
    // Sync form values
    setFormProvider(loaded.provider);
    setFormOllamaEndpoint(loaded.ollamaEndpoint);
    setFormOllamaModel(loaded.ollamaModel);
    setFormGeminiApiKey(loaded.geminiApiKey);
    setFormGeminiModel(loaded.geminiModel);
    setFormOpenaiBaseUrl(loaded.openaiBaseUrl);
    setFormOpenaiApiKey(loaded.openaiApiKey);
    setFormOpenaiModel(loaded.openaiModel);
    
    // Add initial welcome message
    setChatMessages([
      {
        role: 'assistant',
        content: `Welcome! I am your AI Study Assistant. Select a chapter, and you can chat about it, generate a summary, or extract key concepts.`,
        id: 'welcome-msg',
      }
    ]);
  }, []);

  // Handle chapter changes
  useEffect(() => {
    if (activeChapterId && chapterTitle) {
      // Print context switched notice in chat
      setChatMessages(prev => {
        // Prevent duplicate switch notices
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'system-info' && lastMsg.content.includes(chapterTitle)) {
          return prev;
        }
        return [
          ...prev,
          {
            role: 'system-info',
            content: `Switched chapter context to: ${chapterTitle}`,
            id: `sys-${Date.now()}`,
          }
        ];
      });
      
      // Stop streaming if we were summarizing/extracting concepts of a different chapter
      if (streamingTarget === 'summary' || streamingTarget === 'concepts') {
        stopStreaming();
      }
      setError(null);
    }
  }, [activeChapterId, chapterTitle]);

  // Scroll chat to bottom on new messages or during streaming
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, streamingText, activeTab]);

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingTarget(null);
    setLoading(false);
  };

  const startStreaming = async (messages, target, onFinish) => {
    stopStreaming();
    setError(null);
    setLoading(true);
    setStreamingTarget(target);
    setStreamingText('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let accumulated = '';
      await streamAIResponse(
        messages,
        settings,
        (chunk) => {
          accumulated += chunk;
          setStreamingText(accumulated);
        },
        controller.signal
      );
      onFinish(accumulated);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        setError(err.message || 'Failed to get response from AI provider.');
      }
    } finally {
      setLoading(false);
      setStreamingTarget(null);
      abortControllerRef.current = null;
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: inputMessage,
      id: Date.now().toString(),
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    // Compile message history with system context
    const strippedContent = stripHtml(chapterContent);
    const systemPrompt = `You are a helpful study assistant. Answer the user's questions based on the textbook chapter: "${chapterTitle}". 
${strippedContent ? `Here is the relevant chapter context to help you answer:\n--- START CONTEXT ---\n${strippedContent}\n--- END CONTEXT ---` : 'No chapter content is currently available.'}
Please provide clear, concise, and structured educational explanations. Cite sections if applicable.`;

    const apiPayload = [
      { role: 'system', content: systemPrompt },
      ...chatMessages
        .filter(m => (m.role === 'user' || m.role === 'assistant') && m.id !== 'welcome-msg')
        .map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMsg.content }
    ];

    startStreaming(apiPayload, 'chat', (finalText) => {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: finalText,
          id: (Date.now() + 1).toString(),
        }
      ]);
      setStreamingText('');
    });
  };

  const handleGenerateSummary = () => {
    if (loading || !activeChapterId) return;

    const strippedContent = stripHtml(chapterContent);
    if (!strippedContent) {
      setError('Cannot generate summary: Chapter is empty.');
      return;
    }

    const summaryPrompt = `You are an AI study assistant. Provide a highly structured, concise bullet-point summary of the following chapter: "${chapterTitle}". Focus on the main ideas, key arguments, and takeaways. Include section titles where appropriate. Here is the chapter content:\n${strippedContent}`;

    const payload = [
      { role: 'user', content: summaryPrompt }
    ];

    startStreaming(payload, 'summary', (finalText) => {
      setSummaryCache(prev => ({
        ...prev,
        [activeChapterId]: finalText
      }));
      setStreamingText('');
    });
  };

  const handleExtractConcepts = () => {
    if (loading || !activeChapterId) return;

    const strippedContent = stripHtml(chapterContent);
    if (!strippedContent) {
      setError('Cannot extract concepts: Chapter is empty.');
      return;
    }

    const conceptsPrompt = `You are an AI study assistant. Extract the core concepts, definitions, formulas, and important terms from the following chapter: "${chapterTitle}". Present them as a glossary or bulleted list with clear, simple explanations. Format terms in bold. Here is the chapter content:\n${strippedContent}`;

    const payload = [
      { role: 'user', content: conceptsPrompt }
    ];

    startStreaming(payload, 'concepts', (finalText) => {
      setConceptsCache(prev => ({
        ...prev,
        [activeChapterId]: finalText
      }));
      setStreamingText('');
    });
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const newSettings = {
      provider: formProvider,
      ollamaEndpoint: formOllamaEndpoint,
      ollamaModel: formOllamaModel,
      geminiApiKey: formGeminiApiKey,
      geminiModel: formGeminiModel,
      openaiBaseUrl: formOpenaiBaseUrl,
      openaiApiKey: formOpenaiApiKey,
      openaiModel: formOpenaiModel,
    };
    saveAISettings(newSettings);
    setSettings(newSettings);
    setSettingsSuccess(true);
    setTimeout(() => {
      setSettingsSuccess(false);
      setActiveTab('chat');
    }, 1200);
  };

  const clearChat = () => {
    setChatMessages([
      {
        role: 'assistant',
        content: `Chat cleared. Ask me any question related to: ${chapterTitle || 'your active chapter'}.`,
        id: `clear-${Date.now()}`,
      }
    ]);
  };

  // Custom markdown-like formatter
  const renderFormattedContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      let content = line;
      
      // Headers
      if (content.startsWith('### ')) {
        return <h5 key={lineIdx} className="ai-md-h3">{content.slice(4)}</h5>;
      } else if (content.startsWith('## ')) {
        return <h4 key={lineIdx} className="ai-md-h2">{content.slice(3)}</h4>;
      } else if (content.startsWith('# ')) {
        return <h3 key={lineIdx} className="ai-md-h1">{content.slice(2)}</h3>;
      }
      
      // Bullets
      const isBullet = content.startsWith('- ') || content.startsWith('* ') || content.match(/^\d+\.\s/);
      let bulletPrefix = '';
      if (content.startsWith('- ') || content.startsWith('* ')) {
        bulletPrefix = '• ';
        content = content.slice(2);
      }
      
      // Match bold **text** and inline `code`
      const parts = [];
      let currentIdx = 0;
      const regex = /(\*\*|`)(.*?)\1/g;
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        if (match.index > currentIdx) {
          parts.push(content.substring(currentIdx, match.index));
        }
        
        const type = match[1];
        const matchText = match[2];
        
        if (type === '**') {
          parts.push(<strong key={match.index}>{matchText}</strong>);
        } else if (type === '`') {
          parts.push(<code key={match.index} className="ai-inline-code">{matchText}</code>);
        }
        
        currentIdx = regex.lastIndex;
      }
      
      if (currentIdx < content.length) {
        parts.push(content.substring(currentIdx));
      }
      
      if (isBullet) {
        return (
          <div key={lineIdx} className="ai-md-bullet">
            <span className="bullet-dot">{bulletPrefix}</span>
            <span className="bullet-text">{parts.length > 0 ? parts : content}</span>
          </div>
        );
      }
      
      // Empty lines act as spacing
      if (!content.trim()) {
        return <div key={lineIdx} className="ai-md-space" />;
      }
      
      return (
        <p key={lineIdx} className="ai-md-p">
          {parts.length > 0 ? parts : content}
        </p>
      );
    });
  };

  const currentSummary = summaryCache[activeChapterId];
  const currentConcepts = conceptsCache[activeChapterId];

  return (
    <div className="glass-pane ai-assistant animate-fade-in">
      {/* Header */}
      <div className="pane-header ai-header">
        <h3 className="pane-title">
          <span className="ai-icon">✨</span> Study assistant
        </h3>
        <button 
          className={`settings-toggle-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'settings' ? 'chat' : 'settings')}
          title="AI Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>

      {/* Tabs Selector */}
      {activeTab !== 'settings' && (
        <div className="ai-tabs-bar">
          <button 
            className={`ai-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button 
            className={`ai-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button 
            className={`ai-tab-btn ${activeTab === 'concepts' ? 'active' : ''}`}
            onClick={() => setActiveTab('concepts')}
          >
            Concepts
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="ai-error-banner">
          <span className="error-text">{error}</span>
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Tab Area Content */}
      <div className="ai-content-area">
        {activeTab === 'chat' && (
          <div className="ai-chat-tab">
            <div className="chat-messages-container">
              {chatMessages.map((msg) => {
                if (msg.role === 'system-info') {
                  return (
                    <div key={msg.id} className="chat-system-info">
                      {msg.content}
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className={`chat-bubble-wrapper ${msg.role}`}>
                    <div className="chat-bubble">
                      <div className="bubble-header">
                        {msg.role === 'assistant' ? '✨ Assistant' : 'You'}
                      </div>
                      <div className="bubble-body">
                        {renderFormattedContent(msg.content)}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Streaming Chat Output */}
              {streamingTarget === 'chat' && streamingText && (
                <div className="chat-bubble-wrapper assistant streaming">
                  <div className="chat-bubble">
                    <div className="bubble-header">✨ Assistant</div>
                    <div className="bubble-body">
                      {renderFormattedContent(streamingText)}
                    </div>
                  </div>
                </div>
              )}

              {/* Loader */}
              {loading && streamingTarget === 'chat' && !streamingText && (
                <div className="chat-bubble-wrapper assistant loading">
                  <div className="chat-bubble">
                    <div className="bubble-header">✨ Assistant</div>
                    <div className="bubble-body">
                      <div className="shimmer-line line-1" />
                      <div className="shimmer-line line-2" />
                      <div className="shimmer-line line-3" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            {/* Input bar */}
            <form onSubmit={handleChatSubmit} className="pane-footer ai-footer">
              <div className="question-input-wrapper">
                <input 
                  type="text" 
                  placeholder={activeChapterId ? `Ask about: ${chapterTitle.substring(0, 18)}...` : "Select a chapter to start..."} 
                  className="question-input"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={loading || !activeChapterId}
                />
                <button type="submit" className="send-btn" disabled={loading || !inputMessage.trim() || !activeChapterId}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
              <div className="ai-chat-actions">
                <button type="button" className="action-link-btn" onClick={clearChat} disabled={loading}>
                  Clear chat
                </button>
                {loading && (
                  <button type="button" className="action-link-btn cancel-btn" onClick={stopStreaming}>
                    Stop generating
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="ai-document-tab">
            {!activeChapterId ? (
              <div className="doc-empty-state">
                <p>Select a chapter from the textbook to generate a summary.</p>
              </div>
            ) : !currentSummary && streamingTarget !== 'summary' ? (
              <div className="doc-empty-state">
                <p>No summary generated for <strong>{chapterTitle}</strong> yet.</p>
                <button 
                  className="ai-primary-btn" 
                  onClick={handleGenerateSummary}
                  disabled={loading}
                >
                  Generate Summary
                </button>
              </div>
            ) : (
              <div className="doc-content-container">
                <div className="doc-header">
                  <h4>Summary: {chapterTitle}</h4>
                  {!loading && (
                    <button className="regenerate-btn" onClick={handleGenerateSummary}>
                      Regenerate
                    </button>
                  )}
                </div>
                <div className="doc-body">
                  {streamingTarget === 'summary' && !streamingText && (
                    <div className="doc-loading">
                      <div className="shimmer-line line-1" />
                      <div className="shimmer-line line-2" />
                      <div className="shimmer-line line-3" />
                    </div>
                  )}
                  {renderFormattedContent(streamingText || currentSummary)}
                  {loading && streamingTarget === 'summary' && (
                    <div className="stream-cursor" />
                  )}
                </div>
                {loading && streamingTarget === 'summary' && (
                  <div className="doc-actions">
                    <button className="ai-secondary-btn cancel" onClick={stopStreaming}>
                      Cancel Generation
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="ai-document-tab">
            {!activeChapterId ? (
              <div className="doc-empty-state">
                <p>Select a chapter from the textbook to extract key concepts.</p>
              </div>
            ) : !currentConcepts && streamingTarget !== 'concepts' ? (
              <div className="doc-empty-state">
                <p>No key concepts extracted for <strong>{chapterTitle}</strong> yet.</p>
                <button 
                  className="ai-primary-btn" 
                  onClick={handleExtractConcepts}
                  disabled={loading}
                >
                  Extract Key Concepts
                </button>
              </div>
            ) : (
              <div className="doc-content-container">
                <div className="doc-header">
                  <h4>Key Concepts: {chapterTitle}</h4>
                  {!loading && (
                    <button className="regenerate-btn" onClick={handleExtractConcepts}>
                      Regenerate
                    </button>
                  )}
                </div>
                <div className="doc-body">
                  {streamingTarget === 'concepts' && !streamingText && (
                    <div className="doc-loading">
                      <div className="shimmer-line line-1" />
                      <div className="shimmer-line line-2" />
                      <div className="shimmer-line line-3" />
                    </div>
                  )}
                  {renderFormattedContent(streamingText || currentConcepts)}
                  {loading && streamingTarget === 'concepts' && (
                    <div className="stream-cursor" />
                  )}
                </div>
                {loading && streamingTarget === 'concepts' && (
                  <div className="doc-actions">
                    <button className="ai-secondary-btn cancel" onClick={stopStreaming}>
                      Cancel Generation
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="ai-settings-tab">
            <form onSubmit={handleSaveSettings} className="settings-form">
              <h4 className="settings-section-title">AI Provider Config</h4>
              
              {settingsSuccess && (
                <div className="settings-success-alert">
                  Settings saved successfully!
                </div>
              )}

              <div className="form-group">
                <label htmlFor="ai-provider">Active Provider</label>
                <select 
                  id="ai-provider"
                  value={formProvider}
                  onChange={(e) => setFormProvider(e.target.value)}
                  className="settings-select"
                >
                  <option value="ollama">Ollama (Local)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              {formProvider === 'ollama' && (
                <div className="provider-subform">
                  <div className="form-group">
                    <label htmlFor="ollama-endpoint">Ollama API Endpoint</label>
                    <input 
                      id="ollama-endpoint"
                      type="text" 
                      value={formOllamaEndpoint} 
                      onChange={(e) => setFormOllamaEndpoint(e.target.value)}
                      placeholder="http://localhost:11434"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ollama-model">Model Name</label>
                    <input 
                      id="ollama-model"
                      type="text" 
                      value={formOllamaModel} 
                      onChange={(e) => setFormOllamaModel(e.target.value)}
                      placeholder="llama3.2"
                    />
                  </div>
                </div>
              )}

              {formProvider === 'gemini' && (
                <div className="provider-subform">
                  <div className="form-group">
                    <label htmlFor="gemini-key">Gemini API Key</label>
                    <input 
                      id="gemini-key"
                      type="password" 
                      value={formGeminiApiKey} 
                      onChange={(e) => setFormGeminiApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="gemini-model">Gemini Model</label>
                    <input 
                      id="gemini-model"
                      type="text" 
                      value={formGeminiModel} 
                      onChange={(e) => setFormGeminiModel(e.target.value)}
                      placeholder="gemini-1.5-flash"
                    />
                  </div>
                </div>
              )}

              {formProvider === 'openai' && (
                <div className="provider-subform">
                  <div className="form-group">
                    <label htmlFor="openai-url">Base URL</label>
                    <input 
                      id="openai-url"
                      type="text" 
                      value={formOpenaiBaseUrl} 
                      onChange={(e) => setFormOpenaiBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="openai-key">OpenAI API Key</label>
                    <input 
                      id="openai-key"
                      type="password" 
                      value={formOpenaiApiKey} 
                      onChange={(e) => setFormOpenaiApiKey(e.target.value)}
                      placeholder="sk-proj-..."
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="openai-model">Model Name</label>
                    <input 
                      id="openai-model"
                      type="text" 
                      value={formOpenaiModel} 
                      onChange={(e) => setFormOpenaiModel(e.target.value)}
                      placeholder="gpt-4o-mini"
                    />
                  </div>
                </div>
              )}

              <div className="settings-actions">
                <button type="submit" className="ai-primary-btn save-btn">
                  Save Configurations
                </button>
                <button type="button" className="ai-secondary-btn" onClick={() => setActiveTab('chat')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
