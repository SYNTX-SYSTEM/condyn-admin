'use client';
import { useState, useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_CONDYN_API_URL || 'http://localhost:8002';

const SAMPLE_EMAIL = `From: Sarah Chen, VP Operations
To: All Department Heads
Subject: Q4 Reporting Protocol - Mandatory Compliance

Team,

Effective immediately, all end-of-day reports must be submitted by 6:00 PM sharp, no exceptions. I've noticed increasing delays over the past two weeks, and this is unacceptable given our upcoming board review.

Each department head is personally responsible for ensuring their team completes daily metrics before leaving. Any delays require prior approval from me directly - not your manager, not your team lead, ME. I don't have time to chase people down every evening.

The new procedure is as follows:
1. Team members complete their reports by 5:30 PM
2. Department heads review and sign off by 5:50 PM  
3. Final submission to my office by 6:00 PM

I shouldn't have to remind everyone that these reports feed directly into our investor updates. Missing or late submissions reflect poorly on the entire organization, and frankly, on your ability to manage your teams effectively.

If you're unable to meet these requirements, we need to have a serious conversation about whether you're the right fit for your current role. I expect full compliance starting tomorrow.

Regards,
Sarah Chen
VP Operations`;

export default function AnalyzePanel({ token }: { token: string }) {
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePrompt, setActivePrompt] = useState('');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // PDF States
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadActivePrompt();
  }, []);

  useEffect(() => {
    // Cleanup PDF URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

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

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/pdf') {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setInputText(''); // Clear text
      setContext(`Uploaded PDF: ${file.name}`);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setInputText('');
    setContext('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile && !inputText.trim()) return;
    
    setLoading(true);
    setResult('');
    setTokensUsed(0);
    
    try {
      let res;
      
      if (uploadedFile) {
        // PDF Upload
        const formData = new FormData();
        formData.append('file', uploadedFile);
        if (context) {
          formData.append('context', context);
        }
        formData.append('language', 'en');
        
        res = await fetch(`${API_URL}/analyze/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
      } else {
        // Text Analysis
        res = await fetch(`${API_URL}/analyze`, {
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
      }

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Analysis failed');
      }
      
      setResult(data.analysis);
      setTokensUsed(data.tokens_used || 0);
      
    } catch (err: any) {
      setResult(`Analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const loadSample = () => {
    setInputText(SAMPLE_EMAIL);
    setContext('Internal management email');
    handleClearFile();
  };

  return (
    <div className="analyze-layout">
      {/* Left: Input */}
      <div className="card panel-left">
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          INPUT
        </h2>

        {/* File Upload Info */}
        {uploadedFile && (
          <div style={{
            padding: '12px',
            background: 'rgba(156, 39, 176, 0.1)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            borderRadius: '6px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>📄</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#9C27B0' }}>
                  {uploadedFile.name}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
            <button
              onClick={handleClearFile}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                background: 'transparent',
                border: '1px solid #999',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕ Clear
            </button>
          </div>
        )}

        {/* PDF Preview OR Textarea */}
        <div 
          style={{ position: 'relative', flex: 1, marginBottom: '12px' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {pdfUrl ? (
            // PDF Preview
            <iframe
              src={pdfUrl}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '400px',
                border: '1px solid rgba(21, 101, 192, 0.15)',
                borderRadius: '6px'
              }}
            />
          ) : (
            // Text Input
            <textarea
              className="textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste document text here or drag & drop PDF..."
              style={{ 
                width: '100%', 
                height: '100%', 
                minHeight: '200px'
              }}
            />
          )}
          
          {/* Drag Overlay */}
          {isDragging && !pdfUrl && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(156, 39, 176, 0.1)',
              border: '2px dashed #9C27B0',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '600',
              color: '#9C27B0',
              pointerEvents: 'none'
            }}>
              📄 Drop PDF here
            </div>
          )}
          
          {/* Upload & Sample Buttons */}
          {!pdfUrl && (
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              display: 'flex',
              gap: '8px'
            }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  padding: '8px 16px',
                  fontSize: '12px',
                  background: 'linear-gradient(135deg, #9C27B0, #BA68C8)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(156, 39, 176, 0.3)',
                  fontWeight: '600'
                }}
              >
                📄 Upload PDF
              </button>
              <button
                onClick={loadSample}
                style={{ 
                  padding: '8px 16px',
                  fontSize: '12px',
                  background: 'linear-gradient(135deg, #00BCD4, #4FC3F7)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 188, 212, 0.3)',
                  fontWeight: '600'
                }}
              >
                📧 Load Sample
              </button>
            </div>
          )}
        </div>

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
          disabled={loading || (!uploadedFile && !inputText.trim())}
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
