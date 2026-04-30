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

  useEffect(() => {
    loadActivePrompt();
  }, []);

  const loadActivePrompt = async () => {
    try {
      const res = await fetch(`${API_URL}/prompts/active/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setActivePrompt(data.id || 'none');
    } catch (err) {
      console.error('Failed to load active prompt:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult('');
    
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
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 140px)' }}>
      {/* Left: Input */}
      <div style={{
        width: '45%',
        background: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(21, 101, 192, 0.08)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1A1A2E',
          margin: '0 0 16px 0'
        }}>
          INPUT
        </h2>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste document text here..."
          style={{
            flex: 1,
            minHeight: '200px',
            padding: '16px',
            fontSize: '13px',
            fontFamily: 'monospace',
            border: '1px solid rgba(21, 101, 192, 0.15)',
            borderRadius: '6px',
            resize: 'none',
            outline: 'none',
            lineHeight: '1.6',
            marginBottom: '12px'
          }}
          onFocus={(e) => e.target.style.borderColor = '#1565C0'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(21, 101, 192, 0.15)'}
        />

        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Optional context note"
          style={{
            padding: '12px',
            fontSize: '13px',
            border: '1px solid rgba(21, 101, 192, 0.15)',
            borderRadius: '6px',
            marginBottom: '16px',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#1565C0'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(21, 101, 192, 0.15)'}
        />

        <button
          onClick={handleAnalyze}
          disabled={loading || !inputText.trim()}
          style={{
            padding: '14px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#FFFFFF',
            background: '#1565C0',
            border: 'none',
            borderRadius: '6px',
            cursor: (loading || !inputText.trim()) ? 'not-allowed' : 'pointer',
            opacity: !inputText.trim() ? 0.5 : 1,
            transition: 'all 0.15s ease',
            marginBottom: '16px'
          }}
          onMouseEnter={(e) => {
            if (!loading && inputText.trim()) e.currentTarget.style.background = '#0D47A1';
          }}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1565C0'}
        >
          {loading ? 'ANALYZING...' : '⚡ ANALYZE'}
        </button>

        <div style={{
          fontSize: '12px',
          color: '#666',
          padding: '12px',
          background: 'rgba(21, 101, 192, 0.05)',
          borderRadius: '6px'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Using:</strong> <span style={{ fontFamily: 'monospace' }}>{activePrompt}</span>
          </div>
          {tokensUsed > 0 && (
            <div>
              <strong>Tokens used:</strong> {tokensUsed.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Right: Output */}
      <div style={{
        flex: 1,
        background: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(21, 101, 192, 0.08)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1A1A2E',
            margin: 0
          }}>
            ANALYSIS RESULT
          </h2>
          {result && (
            <button
              onClick={copyToClipboard}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#1565C0',
                background: 'transparent',
                border: '1px solid #1565C0',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1565C0';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#1565C0';
              }}
            >
              COPY
            </button>
          )}
        </div>

        <div style={{
          flex: 1,
          padding: '16px',
          border: '1px solid rgba(21, 101, 192, 0.15)',
          borderRadius: '6px',
          overflowY: 'auto',
          fontSize: '13px',
          lineHeight: '1.8',
          color: '#1A1A2E',
          whiteSpace: 'pre-wrap'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#1565C0'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(21, 101, 192, 0.2)',
                borderTop: '4px solid #1565C0',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : result ? (
            <div dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br/>') }} />
          ) : (
            <div style={{ color: '#999', fontStyle: 'italic' }}>
              No analysis yet. Enter text and click ANALYZE.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
