'use client';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_CONDYN_API_URL || 'http://localhost:8002';

interface Prompt {
  id: string;
  filename: string;
  version: string;
  size: number;
  modified: string;
  active: boolean;
  content?: string;
}

export default function PromptsPanel({ token }: { token: string }) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selected, setSelected] = useState<Prompt | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editFilename, setEditFilename] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const res = await fetch(`${API_URL}/prompts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPrompts(data);
    } catch (err) {
      console.error('Failed to load prompts:', err);
    }
  };

  const loadPromptContent = async (promptId: string) => {
    try {
      const res = await fetch(`${API_URL}/prompts/${promptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSelected(data);
      setEditContent(data.content || '');
      setEditFilename(data.filename);
      setHasChanges(false);
      setIsNew(false);
    } catch (err) {
      console.error('Failed to load prompt:', err);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/prompts/${selected.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: editContent })
      });
      setHasChanges(false);
      await loadPrompts();
      await loadPromptContent(selected.id);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!editFilename.trim() || !editContent.trim()) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: editFilename,
          content: editContent
        })
      });
      await loadPrompts();
      setIsNew(false);
      setEditContent('');
      setEditFilename('');
    } catch (err) {
      console.error('Create failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!selected || selected.active) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/prompts/${selected.id}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadPrompts();
      await loadPromptContent(selected.id);
    } catch (err) {
      console.error('Activate failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || selected.active) return;
    if (!confirm(`Delete ${selected.filename}?`)) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/prompts/${selected.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelected(null);
      setEditContent('');
      await loadPrompts();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPrompt = () => {
    setIsNew(true);
    setSelected(null);
    setEditContent('');
    setEditFilename('');
    setHasChanges(false);
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 140px)' }}>
      {/* Left: Prompt List */}
      <div style={{
        width: '350px',
        background: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(21, 101, 192, 0.08)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <button
          onClick={handleNewPrompt}
          style={{
            padding: '12px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#FFFFFF',
            background: '#1565C0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '16px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#0D47A1'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1565C0'}
        >
          + NEW PROMPT
        </button>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {prompts.map(p => (
            <div
              key={p.id}
              onClick={() => loadPromptContent(p.id)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                background: p.active ? 'rgba(21, 101, 192, 0.1)' : 'transparent',
                border: `1px solid ${p.active ? '#1565C0' : 'rgba(21, 101, 192, 0.15)'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!p.active) e.currentTarget.style.background = 'rgba(21, 101, 192, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (!p.active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#1A1A2E',
                marginBottom: '4px',
                fontFamily: 'monospace'
              }}>
                {p.filename}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#666',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{p.version} • {(p.size / 1024).toFixed(1)}KB</span>
                {p.active && (
                  <span style={{
                    background: '#1565C0',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    ● ACTIVE
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Editor */}
      <div style={{
        flex: 1,
        background: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(21, 101, 192, 0.08)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {isNew ? (
          <>
            <input
              type="text"
              placeholder="filename.md"
              value={editFilename}
              onChange={(e) => setEditFilename(e.target.value)}
              style={{
                padding: '12px',
                fontSize: '14px',
                border: '1px solid rgba(21, 101, 192, 0.15)',
                borderRadius: '6px',
                marginBottom: '16px',
                fontFamily: 'monospace',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1565C0'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(21, 101, 192, 0.15)'}
            />
          </>
        ) : selected && (
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1A1A2E',
              margin: 0,
              fontFamily: 'monospace'
            }}>
              {selected.filename}
            </h2>
            {hasChanges && (
              <span style={{
                background: '#FFC107',
                color: '#1A1A2E',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                ● UNSAVED
              </span>
            )}
            {selected.active && (
              <span style={{
                background: '#1565C0',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                ● ACTIVE
              </span>
            )}
          </div>
        )}

        <textarea
          value={editContent}
          onChange={(e) => {
            setEditContent(e.target.value);
            if (selected) setHasChanges(true);
          }}
          placeholder={isNew ? "Enter prompt content..." : "Select a prompt to edit..."}
          style={{
            flex: 1,
            padding: '16px',
            fontSize: '13px',
            fontFamily: 'monospace',
            border: '1px solid rgba(21, 101, 192, 0.15)',
            borderRadius: '6px',
            resize: 'none',
            outline: 'none',
            lineHeight: '1.6'
          }}
          onFocus={(e) => e.target.style.borderColor = '#1565C0'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(21, 101, 192, 0.15)'}
        />

        <div style={{
          marginTop: '16px',
          display: 'flex',
          gap: '12px'
        }}>
          {isNew ? (
            <button
              onClick={handleCreate}
              disabled={loading || !editFilename.trim() || !editContent.trim()}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#FFFFFF',
                background: '#1565C0',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: (!editFilename.trim() || !editContent.trim()) ? 0.5 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              {loading ? '...' : '✓ CREATE'}
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={loading || !hasChanges}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  background: '#1565C0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (loading || !hasChanges) ? 'not-allowed' : 'pointer',
                  opacity: !hasChanges ? 0.5 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                {loading ? '...' : '✓ SAVE'}
              </button>

              <button
                onClick={handleActivate}
                disabled={loading || !selected || selected.active}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  background: '#42A5F5',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (loading || !selected || selected.active) ? 'not-allowed' : 'pointer',
                  opacity: (!selected || selected.active) ? 0.5 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                ⚡ ACTIVATE
              </button>

              <button
                onClick={handleDelete}
                disabled={loading || !selected || selected.active}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  background: '#E53935',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (loading || !selected || selected.active) ? 'not-allowed' : 'pointer',
                  opacity: (!selected || selected.active) ? 0.5 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                🗑 DELETE
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
