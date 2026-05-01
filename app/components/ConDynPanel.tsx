'use client';
import { useState, useEffect } from 'react';
import PromptsPanel from './PromptsPanel';
import AnalyzePanel from './AnalyzePanel';

const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'condyn';
const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'condyn';
const BACKEND_TOKEN = process.env.NEXT_PUBLIC_BACKEND_TOKEN || '';

export default function ConDynPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompts' | 'analyze'>('prompts');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('ConDyn Admin - Auth Ready');
    console.log('Backend Token:', BACKEND_TOKEN ? 'Configured ✓' : 'Missing ✗');
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      console.log('✓ Login successful');
      setAuthenticated(true);
      setError('');
    } else {
      console.log('✗ Login failed');
      setError('Invalid credentials');
    }
  };

  if (!authenticated) {
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
          id="neuralCanvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.15
          }}
        />

        <div style={{
          background: '#FFFFFF',
          padding: '48px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(21, 101, 192, 0.12)',
          width: '400px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img src="/logo.jpeg" alt="ConDyn" style={{ width: '80px', marginBottom: '16px' }} />
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1A1A2E',
              margin: '0 0 8px 0'
            }}>
              Connection Dynamics
            </h1>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>ADMIN</p>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                border: '1px solid rgba(21, 101, 192, 0.2)',
                borderRadius: '8px',
                marginBottom: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1565C0'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(21, 101, 192, 0.2)'}
            />

            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px',
                  paddingRight: '45px',
                  fontSize: '14px',
                  border: '1px solid rgba(21, 101, 192, 0.2)',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1565C0'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(21, 101, 192, 0.2)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#666',
                  padding: '4px'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: '#FFEBEE',
                color: '#C62828',
                borderRadius: '6px',
                fontSize: '13px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#FFFFFF',
                background: '#1565C0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0D47A1'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#1565C0'}
            >
              LOGIN
            </button>
          </form>
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `
            const canvas = document.getElementById('neuralCanvas');
            if (canvas) {
              const ctx = canvas.getContext('2d');
              canvas.width = window.innerWidth;
              canvas.height = window.innerHeight;

              const nodes = Array.from({length: 30}, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3
              }));

              function animate() {
                ctx.fillStyle = 'rgba(248, 250, 255, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                nodes.forEach(node => {
                  node.x += node.vx;
                  node.y += node.vy;
                  if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
                  if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

                  ctx.beginPath();
                  ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
                  ctx.fillStyle = '#1565C0';
                  ctx.fill();

                  nodes.forEach(other => {
                    const dist = Math.hypot(node.x - other.x, node.y - other.y);
                    if (dist < 150) {
                      ctx.beginPath();
                      ctx.moveTo(node.x, node.y);
                      ctx.lineTo(other.x, other.y);
                      ctx.strokeStyle = \`rgba(21, 101, 192, \${0.15 * (1 - dist/150)})\`;
                      ctx.stroke();
                    }
                  });
                });

                requestAnimationFrame(animate);
              }
              animate();
            }
          `
        }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFF' }}>
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(21, 101, 192, 0.1)',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/logo.jpeg" alt="ConDyn" style={{ width: '40px' }} />
          <div>
            <h1 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1A1A2E',
              margin: 0
            }}>
              Connection Dynamics
            </h1>
            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>ADMIN</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('prompts')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: activeTab === 'prompts' ? '#1565C0' : '#666',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'prompts' ? '2px solid #1565C0' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            PROMPTS
          </button>

          <button
            onClick={() => setActiveTab('analyze')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: activeTab === 'analyze' ? '#1565C0' : '#666',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'analyze' ? '2px solid #1565C0' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            ANALYZE
          </button>

          <button
            onClick={() => setAuthenticated(false)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#E53935',
              background: 'transparent',
              border: '1px solid #E53935',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E53935';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#E53935';
            }}
          >
            LOGOUT
          </button>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        {activeTab === 'prompts' && <PromptsPanel token={BACKEND_TOKEN} />}
        {activeTab === 'analyze' && <AnalyzePanel token={BACKEND_TOKEN} />}
      </div>
    </div>
  );
}
