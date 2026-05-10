'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PromptsPanel from './PromptsPanel';
import AnalyzePanel from './AnalyzePanel';

export default function ConDynPanel() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'prompts' | 'analyze'>('prompts');

  const backendToken = process.env.NEXT_PUBLIC_BACKEND_TOKEN || '';

  const handleLogin = () => {
    const correctUsername = 'condyn';
    const correctPassword = 'QyD2pD5$^AgWu60k2@#Pa*etv';

    if (username === correctUsername && password === correctPassword) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="card" style={{
          width: '400px',
          padding: '48px',
          textAlign: 'center'
        }}>
          <img src="/logo.jpeg" alt="ConDyn" style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            margin: '0 auto 24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }} />
          
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Connection Dynamics
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#666',
            marginBottom: '32px'
          }}>
            ADMIN
          </p>

          <input
            className="input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            style={{ marginBottom: '12px' }}
          />

          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            style={{ marginBottom: '24px' }}
          />

          {loginError && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              background: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: '6px',
              color: '#f44336',
              fontSize: '13px'
            }}>
              {loginError}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleLogin}
            style={{ width: '100%' }}
          >
            LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(21, 101, 192, 0.15)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0' }}>
            <img src="/logo.jpeg" alt="ConDyn" style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%'
            }} />
            <div>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Connection Dynamics
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>ADMIN</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('prompts')}
              style={{
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: activeTab === 'prompts' ? '700' : '500',
                color: activeTab === 'prompts' ? '#1565C0' : '#666',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'prompts' ? '3px solid #1565C0' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              PROMPTS
            </button>

            <button
              onClick={() => setActiveTab('analyze')}
              style={{
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: activeTab === 'analyze' ? '700' : '500',
                color: activeTab === 'analyze' ? '#1565C0' : '#666',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'analyze' ? '3px solid #1565C0' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ANALYZE
            </button>

            <button
              onClick={() => router.push('/topology')}
              style={{
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#666',
                background: 'transparent',
                border: 'none',
                borderBottom: '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              TOPOLOGY
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsLoggedIn(false)}
          className="btn-danger"
          style={{
            padding: '8px 20px',
            fontSize: '12px'
          }}
        >
          LOGOUT
        </button>
      </div>

      <div style={{ padding: '32px' }}>
        {activeTab === 'prompts' && (
          <PromptsPanel token={backendToken} />
        )}

        {activeTab === 'analyze' && (
          <AnalyzePanel token={backendToken} />
        )}
      </div>
    </div>
  );
}
