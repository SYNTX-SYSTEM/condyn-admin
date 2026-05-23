'use client';
import { useState } from 'react';

export default function MarkdownPDF() {
  const [md, setMd] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => setMd(ev.target?.result as string);
      reader.readAsText(file);
    }
  };

  const generate = async () => {
    if (!md.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: md }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
      } else {
        alert('PDF generation failed');
      }
    } catch (err) {
      alert('Error: ' + err);
    }
    setLoading(false);
  };

  const wordCount = md.trim() ? md.trim().split(/\s+/).length : 0;
  const lineCount = md.trim() ? md.trim().split('\n').length : 0;
  const isEmpty = !md.trim();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 0' }}>
      <div style={{ marginBottom: '48px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '3px', color: '#1565C0', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
          Connection Dynamics
        </p>
        <h1 style={{ fontSize: '32px', fontWeight: '300', color: '#1A1A2E', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
          Markdown → PDF
        </h1>
        <div style={{ width: '40px', height: '2px', background: '#1565C0' }} />
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          padding: '12px 24px', border: '1px solid rgba(21, 101, 192, 0.25)',
          borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
          fontWeight: '500', color: '#1565C0', letterSpacing: '0.5px', background: '#fff'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(21,101,192,0.04)'; e.currentTarget.style.borderColor = '#1565C0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(21,101,192,0.25)'; }}>
          <span>↑</span>
          {fileName ? fileName : 'Datei laden (.md / .txt)'}
          <input type="file" accept=".md,.txt" onChange={handleUpload} style={{ display: 'none' }} />
        </label>
      </div>

      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <textarea
          rows={20}
          value={md}
          onChange={e => setMd(e.target.value)}
          placeholder="# Titel&#10;&#10;Dein Markdown hier..."
          style={{
            width: '100%',
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: '13px', lineHeight: '1.8', padding: '24px',
            border: '1px solid rgba(21, 101, 192, 0.15)', borderRadius: '8px',
            background: '#FAFBFF', color: '#1A1A2E', outline: 'none',
            resize: 'vertical', boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#1565C0'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(21, 101, 192, 0.15)'}
        />
        {md.trim() && (
          <div style={{ position: 'absolute', bottom: '12px', right: '16px', display: 'flex', gap: '16px' }}>
            <span style={{ fontSize: '11px', color: '#999' }}>{wordCount} Wörter</span>
            <span style={{ fontSize: '11px', color: '#999' }}>{lineCount} Zeilen</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={generate} disabled={loading || isEmpty}
          style={{
            padding: '14px 36px', fontSize: '13px', fontWeight: '600',
            letterSpacing: '1.5px', color: '#FFFFFF',
            background: (loading || isEmpty) ? '#90A4AE' : '#1565C0',
            border: 'none', borderRadius: '6px',
            cursor: (loading || isEmpty) ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase'
          }}
          onMouseEnter={(e) => { if (!loading && !isEmpty) e.currentTarget.style.background = '#0D47A1'; }}
          onMouseLeave={(e) => { if (!loading && !isEmpty) e.currentTarget.style.background = '#1565C0'; }}>
          {loading ? 'Generiere...' : 'PDF erzeugen'}
        </button>
        {md.trim() && !loading && (
          <button onClick={() => { setMd(''); setFileName(''); }}
            style={{ fontSize: '12px', color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}>
            Leeren
          </button>
        )}
      </div>
    </div>
  );
}
