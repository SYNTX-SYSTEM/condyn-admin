'use client';
import { useState, useEffect, useRef } from 'react';

export default function MarkdownPDF() {
  const [md, setMd] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [charCount, setCharCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setCharCount(md.length); }, [md]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const nodes = Array.from({ length: 18 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1.5,
    }));
    let animId: number;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(21,101,192,0.35)';
        ctx.fill();
        nodes.forEach(o => {
          const d = Math.hypot(n.x - o.x, n.y - o.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(o.x, o.y);
            ctx.strokeStyle = `rgba(21,101,192,${0.12 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = ev => setMd(ev.target?.result as string);
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
        const a = document.createElement('a');
        a.href = url;
        a.download = 'condyn_report.pdf';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('PDF generation failed');
      }
    } catch (err) {
      alert('Error: ' + err);
    }
    setLoading(false);
  };

  const isEmpty = !md.trim();
  const wordCount = isEmpty ? 0 : md.trim().split(/\s+/).length;
  const lineCount = isEmpty ? 0 : md.trim().split('\n').length;

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gridTemplateRows: 'auto 1fr',
      background: '#F8FAFF',
    }}>
      {/* LEFT PANEL */}
      <div style={{
        gridRow: '1 / 3',
        background: '#FFFFFF',
        borderRight: '1px solid rgba(21,101,192,0.1)',
        display: 'flex', flexDirection: 'column',
        padding: '40px 28px',
        position: 'relative', overflow: 'hidden',
      }}>
        <canvas ref={canvasRef} style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%', opacity: 0.5,
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '3px', color: '#1565C0', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
            Connection Dynamics
          </p>
          <h1 style={{ fontSize: '24px', fontWeight: '300', color: '#1A1A2E', margin: '0 0 4px 0', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Markdown<br /><span style={{ fontWeight: '700' }}>PDF</span>
          </h1>
          <div style={{ width: '28px', height: '2px', background: '#1565C0', margin: '12px 0 28px 0' }} />

          {[
            { label: 'WORDS', val: wordCount },
            { label: 'LINES', val: lineCount },
            { label: 'CHARS', val: charCount },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(21,101,192,0.07)' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '2px', color: '#94a3b8' }}>{label}</span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: val > 0 ? '#1565C0' : '#e2e8f0', transition: 'color 0.3s' }}>{val}</span>
            </div>
          ))}

          <div style={{ flex: 1 }} />

          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 16px',
            border: '1px solid rgba(21,101,192,0.2)', borderRadius: '8px', cursor: 'pointer',
            fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase',
            color: fileName ? '#1565C0' : '#94a3b8', background: '#F8FAFF',
            transition: 'all 0.2s', marginBottom: '12px',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#1565C0'; e.currentTarget.style.background = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(21,101,192,0.2)'; e.currentTarget.style.background = '#F8FAFF'; }}>
            <span style={{ fontSize: '16px', opacity: 0.5 }}>↑</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName || 'Load File'}
            </span>
            <input type="file" accept=".md,.txt" onChange={handleUpload} style={{ display: 'none' }} />
          </label>

          <button onClick={generate} disabled={loading || isEmpty} style={{
            padding: '17px', fontSize: '11px', fontWeight: '800',
            letterSpacing: '2.5px', textTransform: 'uppercase', color: '#FFFFFF',
            background: (loading || isEmpty) ? '#B0BEC5' : 'linear-gradient(135deg, #0D47A1, #1565C0)',
            border: 'none', borderRadius: '8px',
            cursor: (loading || isEmpty) ? 'not-allowed' : 'pointer',
            boxShadow: (!loading && !isEmpty) ? '0 4px 18px rgba(21,101,192,0.3)' : 'none',
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => { if (!loading && !isEmpty) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(21,101,192,0.4)'; }}}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = (!loading && !isEmpty) ? '0 4px 18px rgba(21,101,192,0.3)' : 'none'; }}>
            {loading ? '⚡ GENERATING...' : '→ GENERATE PDF'}
          </button>

          {md.trim() && !loading && (
            <button onClick={() => { setMd(''); setFileName(''); }} style={{ marginTop: '10px', padding: '10px', fontSize: '10px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* RIGHT TOP */}
      <div style={{ padding: '32px 44px 20px', borderBottom: '1px solid rgba(21,101,192,0.07)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isEmpty ? '#e2e8f0' : '#1565C0', boxShadow: isEmpty ? 'none' : '0 0 0 4px rgba(21,101,192,0.15)', transition: 'all 0.4s' }} />
        <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: isEmpty ? '#94a3b8' : '#1565C0', textTransform: 'uppercase', transition: 'color 0.4s' }}>
          {isEmpty ? 'AWAITING INPUT' : 'SIGNAL ACTIVE'}
        </span>
      </div>

      {/* RIGHT EDITOR */}
      <div style={{ padding: '20px 44px 36px', display: 'flex', flexDirection: 'column' }}>
        <textarea
          value={md}
          onChange={e => setMd(e.target.value)}
          placeholder={'# Titel\n\n## Abschnitt\n\nText...\n\n| Spalte | Wert |\n|---|---|\n| A | B |'}
          style={{
            flex: 1, minHeight: '500px',
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: '13px', lineHeight: '1.9', padding: '28px',
            border: '1px solid rgba(21,101,192,0.1)', borderRadius: '10px',
            background: '#FFFFFF', color: '#1A1A2E', outline: 'none', resize: 'vertical',
            boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: '0 2px 12px rgba(21,101,192,0.05)',
          }}
          onFocus={e => { e.target.style.borderColor = '#1565C0'; e.target.style.boxShadow = '0 4px 24px rgba(21,101,192,0.1)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(21,101,192,0.1)'; e.target.style.boxShadow = '0 2px 12px rgba(21,101,192,0.05)'; }}
        />
        <div style={{ marginTop: '14px', height: '2px', borderRadius: '2px', background: '#EEF2FF', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, (wordCount / 300) * 100)}%`, background: 'linear-gradient(90deg, #1565C0, #42A5F5)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Structural Input</span>
          <span style={{ fontSize: '10px', color: wordCount > 0 ? '#1565C0' : '#94a3b8', letterSpacing: '1.5px', fontWeight: '600' }}>
            {wordCount > 0 ? `${Math.min(100, Math.round((wordCount / 300) * 100))}% Capacity` : 'Empty'}
          </span>
        </div>
      </div>
    </div>
  );
}
