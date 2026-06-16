// AI Client Utilities for SnapStudy
// Supports Ollama, Gemini, and OpenAI client-side streaming

const DEFAULT_SETTINGS = {
  provider: 'ollama',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash',
  openaiBaseUrl: 'https://api.openai.com',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
};

// Retrieve settings from localStorage
export const getAISettings = () => {
  try {
    const saved = localStorage.getItem('snapstudy_ai_settings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load AI settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
};

// Save settings to localStorage
export const saveAISettings = (settings) => {
  try {
    localStorage.setItem('snapstudy_ai_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save AI settings:', e);
  }
};

// Strip HTML tags and entities from textbook content
export const stripHtml = (html) => {
  if (!html) return '';
  let text = html.replace(/<[^>]*>/g, ' ');
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return text.replace(/\s+/g, ' ').trim();
};

// Main entry point for streaming AI responses
export const streamAIResponse = async (messages, settings, onChunk, signal) => {
  const provider = settings.provider || 'ollama';

  if (provider === 'ollama') {
    const endpoint = `${settings.ollamaEndpoint || 'http://localhost:11434'}/api/chat`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.ollamaModel || 'llama3.2',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep last partial line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          const text = parsed.message?.content;
          if (text) {
            onChunk(text);
          }
        } catch (err) {
          console.warn('Ollama chunk parse error:', err, trimmed);
        }
      }
    }
  } else if (provider === 'gemini') {
    const apiKey = settings.geminiApiKey;
    if (!apiKey) {
      throw new Error('Gemini API key is required. Please set it in the Settings.');
    }
    const model = settings.geminiModel || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;

    const systemMsg = messages.find(m => m.role === 'system');
    const otherMsgs = messages.filter(m => m.role !== 'system');

    const body = {
      contents: otherMsgs.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    };

    if (systemMsg) {
      body.systemInstruction = {
        parts: [{ text: systemMsg.content }],
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Gemini error: ${response.status} ${response.statusText}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          errMsg = errJson.error.message;
        }
      } catch (_) {}
      throw new Error(errMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Robust brace-counting parser for Gemini's chunked JSON array stream
      let tempBuffer = buffer.trim();
      if (tempBuffer.startsWith('[')) {
        tempBuffer = tempBuffer.slice(1).trim();
      }
      if (tempBuffer.startsWith(',')) {
        tempBuffer = tempBuffer.slice(1).trim();
      }

      let braceCount = 0;
      let startIdx = -1;
      let lastProcessedIdx = 0;
      let inString = false;
      let escaped = false;

      for (let i = 0; i < tempBuffer.length; i++) {
        const char = tempBuffer[i];
        
        if (escaped) {
          escaped = false;
          continue;
        }
        
        if (char === '\\') {
          if (inString) {
            escaped = true;
          }
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') {
            if (braceCount === 0) {
              startIdx = i;
            }
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0 && startIdx !== -1) {
              const jsonStr = tempBuffer.slice(startIdx, i + 1);
              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  onChunk(text);
                }
              } catch (e) {
                console.warn('Gemini chunk parse error:', jsonStr, e);
              }
              lastProcessedIdx = i + 1;
            }
          }
        }
      }
      buffer = tempBuffer.slice(lastProcessedIdx);
    }
  } else if (provider === 'openai') {
    const apiKey = settings.openaiApiKey;
    if (!apiKey) {
      throw new Error('OpenAI API key is required. Please set it in the Settings.');
    }
    const baseUrl = settings.openaiBaseUrl || 'https://api.openai.com';
    const model = settings.openaiModel || 'gpt-4o-mini';
    const endpoint = `${baseUrl}/v1/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `OpenAI error: ${response.status} ${response.statusText}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          errMsg = errJson.error.message;
        }
      } catch (_) {}
      throw new Error(errMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep last partial line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6).trim();
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) {
              onChunk(text);
            }
          } catch (err) {
            console.warn('OpenAI chunk parse error:', err, trimmed);
          }
        }
      }
    }
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
};
