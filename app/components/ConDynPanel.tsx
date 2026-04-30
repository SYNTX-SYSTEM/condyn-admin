'use client';
import { useState, useEffect } from 'react';
import PromptsPanel from './PromptsPanel';
import AnalyzePanel from './AnalyzePanel';

const API_URL = process.env.NEXT_PUBLIC_CONDYN_API_URL || 'http://localhost:8002';

export default function ConDynPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompts' | 'analyze'>('prompts');

  useEffect(() => {
    if (!token) {
      const canvas = document.getElementById('network-canvas') as HTMLCanvasElement;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
      for (let i = 0; i < 50; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5
        });
      }

      const animate = () => {
        ctx.fillStyle = '#F8FAFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        nodes.forEach(node => {
          node.x += node.vx;
          node.y += node.vy;
          
          if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
          if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

          ctx.fillStyle = 'rgba(21, 101, 192, 0.15)';
          ctx.beginPath();
          ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.strokeStyle = 'rgba(21, 101, 192, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 150) {
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.stroke();
            }
          }
        }

        requestAnimationFrame(animate);
      };

      animate();
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.detail || 'Login failed');
      }
      
      if (!data.access_token) {
        throw new Error('No token received');
      }
      
      setToken(data.access_token);
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUsername('');
    setPassword('');
    setActiveTab('prompts');
  };

  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F8FAFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <canvas 
          id="network-canvas" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        />
        
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '48px',
          boxShadow: '0 4px 24px rgba(21, 101, 192, 0.12)',
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img src="/logo.jpeg" alt="ConDyn" style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              marginBottom: '16px'
            }} />
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1565C0',
              margin: '0 0 8px 0',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>Connection Dynamics</h1>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>Structural Analysis Engine</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid rgba(21, 101, 192, 0.15)',
                  borderRadius: '6px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1565C0'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(21, 101, 192, 0.15)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <input
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid rgba(21, 101, 192, 0.15)',
                  borderRadius: '6px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1565C0'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(21, 101, 192, 0.15)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#FFFFFF',
                background: '#1565C0',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.15s ease',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#0D47A1')}
              onMouseLeave={(e) => e.currentTarget.style.background = '#1565C0'}
            >
              {loading ? 'ANALYZING...' : 'ANALYZE'}
            </button>

            {error && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#FFEBEE',
                color: '#C62828',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFF',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <header style={{
        background: '#FFFFFF',
        borderBottom: '2px solid #1565C0',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/logo.jpeg" alt="ConDyn" style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%'
          }} />
          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1565C0',
              margin: 0
            }}>Connection Dynamics</h1>
            <span style={{
              fontSize: '11px',
              color: '#666',
              fontWeight: '600',
              letterSpacing: '1px'
            }}>ADMIN</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['prompts', 'analyze'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: activeTab === tab ? '#1565C0' : '#666',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '3px solid #1565C0' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#666',
              background: 'transparent',
              border: '1px solid rgba(21, 101, 192, 0.15)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#1565C0';
              e.currentTarget.style.color = '#1565C0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(21, 101, 192, 0.15)';
              e.currentTarget.style.color = '#666';
            }}
          >
            LOGOUT
          </button>
        </div>
      </header>

      <div style={{ padding: '32px' }}>
        {activeTab === 'prompts' && <PromptsPanel token={token} />}
        {activeTab === 'analyze' && <AnalyzePanel token={token} />}
      </div>
    </div>
  );
}
