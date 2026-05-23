'use client';
import { useState } from 'react';

export default function MarkdownPDF() {
  const [md, setMd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 12 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>📄 RESOANZZ MARKDOWN → PDF</h2>
      <input type="file" accept=".md,.txt" onChange={handleUpload} style={{ marginBottom: 12 }} />
      <textarea
        rows={12}
        style={{ width: '100%', fontFamily: 'monospace', padding: 8, marginBottom: 12 }}
        value={md}
        onChange={e => setMd(e.target.value)}
        placeholder="# Titel\n\nDein Markdown ..."
      />
      <button onClick={generate} disabled={loading} style={{ background: '#1565C0', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 6 }}>
        {loading ? '⚡ Generiere...' : '🎯 PDF erzeugen'}
      </button>
    </div>
  );
}
