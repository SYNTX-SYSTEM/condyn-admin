'use client';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_CONDYN_API_URL || 'http://localhost:8002';

export default function AnalyzePanel({ token }: { token: string }) {
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePrompt, setActivePrompt] = useState('');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadActivePrompt();
  }, []);

  const loadActivePrompt = async () => {
    try {
      const res = await fetch(`${API_URL}/prompts/active/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setActivePrompt(data.prompt?.filename || 'No active prompt');
    } catch (err) {
      console.error('Failed to load active prompt:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult('');
    setTokensUsed(0);
    
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: inputText,
          context: context || undefined
        })
      });

      const data = await res.json();
      setResult(data.analysis);
      setTokensUsed(data.tokens_used || 0);
    } catch (err) {
      setResult('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="analyze-layout">
      {/* Left: Input */}
      <div className="card panel-left">
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          INPUT
        </h2>

        <textarea
          className="textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste document text here..."
          style={{ flex: 1, minHeight: '200px', marginBottom: '12px' }}
        />

        <input
          className="input"
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Optional context note"
          style={{ marginBottom: '16px' }}
        />

        <button
          className="btn-primary"
          onClick={handleAnalyze}
          disabled={loading || !inputText.trim()}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          {loading ? 'ANALYZING...' : '⚡ ANALYZE'}
        </button>

        <div className="card" style={{ 
          fontSize: '12px', 
          padding: '12px',
          background: 'rgba(21, 101, 192, 0.05)' 
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Using:</strong> <span className="text-mono">{activePrompt}</span>
          </div>
          {tokensUsed > 0 && (
            <div>
              <strong>Tokens used:</strong> {tokensUsed.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Right: Output */}
      <div className="card panel-right">
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
            ANALYSIS RESULT
          </h2>
          {result && (
            <button
              className={copySuccess ? "btn-success" : "btn-primary"}
              onClick={copyToClipboard}
              style={{ 
                padding: '6px 14px', 
                fontSize: '12px',
                background: copySuccess ? undefined : 'transparent',
                color: copySuccess ? undefined : '#1565C0',
                border: copySuccess ? undefined : '1px solid #1565C0'
              }}
            >
              {copySuccess ? '✓ COPIED' : 'COPY'}
            </button>
          )}
        </div>

        <div className="card" style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          fontSize: '13px',
          lineHeight: '1.8',
          whiteSpace: 'pre-wrap',
          background: 'rgba(255, 255, 255, 0.5)'
        }}>
          {loading ? (
            <div className="loading-symbiotic">
              <div className="loading-logo-container">
                <div className="breathing-ring"></div>
                <div className="breathing-ring"></div>
                <div className="breathing-ring"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <img src="/logo.jpeg" alt="ConDyn" className="loading-logo" />
              </div>
              <div className="loading-text">Analyzing Structure</div>
              <div className="loading-subtext">Connection Dynamics Framework at work...</div>
            </div>
          ) : result ? (
            <div dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br/>') }} />
          ) : (
            <div className="text-secondary" style={{ fontStyle: 'italic' }}>
              No analysis yet. Enter text and click ANALYZE.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
