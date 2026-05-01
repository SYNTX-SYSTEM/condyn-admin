'use client';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_CONDYN_API_URL || 'http://localhost:8002';

interface Prompt {
  id: string;
  filename: string;
  version: string;
  size: number;
  modified: string;
  is_active: boolean;
  content?: string;
}

export default function PromptsPanel({ token }: { token: string }) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selected, setSelected] = useState<Prompt | null>(null);
  const [editContent, setEditContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [editFilename, setEditFilename] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPrompts();
  }, []);

  // Computed hasChanges - MIT DEBUG
  const hasChanges = editContent !== originalContent;
  
  // DEBUG
  useEffect(() => {
    console.log('DEBUG hasChanges:', {
      hasChanges,
      editLength: editContent.length,
      originalLength: originalContent.length,
      areEqual: editContent === originalContent
    });
  }, [editContent, originalContent, hasChanges]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const loadPrompts = async () => {
    try {
      const res = await fetch(`${API_URL}/prompts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPrompts(data.prompts || data);
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
      
      const content = data.content || '';
      console.log('Loading prompt content:', { filename: data.filename, contentLength: content.length });
      
      setSelected(data);
      setEditContent(content);
      setOriginalContent(content);
      setEditFilename(data.filename);
      setIsNew(false);
    } catch (err) {
      console.error('Failed to load prompt:', err);
    }
  };

  const handleSave = async () => {
    if (!selected || !hasChanges) return;
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
      
      setOriginalContent(editContent);
      await loadPrompts();
      showSuccess(`✓ ${selected.filename} saved`);
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
      const res = await fetch(`${API_URL}/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: editFilename,
          content: editContent,
          version: 'v1.0'
        })
      });
      
      if (res.ok) {
        await loadPrompts();
        setIsNew(false);
        setEditContent('');
        setOriginalContent('');
        setEditFilename('');
        showSuccess(`✓ ${editFilename} created`);
      }
    } catch (err) {
      console.error('Create failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!selected || selected.is_active) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/prompts/${selected.id}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadPrompts();
      await loadPromptContent(selected.id);
      showSuccess(`⚡ ${selected.filename} activated`);
    } catch (err) {
      console.error('Activate failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || selected.is_active) return;
    if (!confirm(`Delete ${selected.filename}?`)) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/prompts/${selected.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelected(null);
      setEditContent('');
      setOriginalContent('');
      await loadPrompts();
      showSuccess(`🗑 Prompt deleted`);
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
    setOriginalContent('');
    setEditFilename('');
  };

  return (
    <div className="split-layout">
      {successMessage && (
        <div className="toast">
          {successMessage}
        </div>
      )}

      <div className="card panel-left">
        <button className="btn-primary" onClick={handleNewPrompt} style={{ marginBottom: '16px', width: '100%' }}>
          + NEW PROMPT
        </button>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {prompts.map(p => (
            <div
              key={p.id}
              onClick={() => loadPromptContent(p.id)}
              className={`prompt-item ${selected?.id === p.id ? 'selected' : ''} ${p.is_active ? 'active' : ''}`}
            >
              <div className="prompt-filename">
                {p.filename}
              </div>
              <div className="prompt-meta">
                <span>{p.version} • {(p.size / 1024).toFixed(1)}KB</span>
                {p.is_active && (
                  <span className="badge badge-active">
                    ● ACTIVE
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card panel-right">
        {isNew ? (
          <>
            <h2 className="section-title" style={{ marginBottom: '16px' }}>
              NEW PROMPT
            </h2>
            <input
              className="input input-mono"
              type="text"
              placeholder="filename.md"
              value={editFilename}
              onChange={(e) => setEditFilename(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <textarea
              className="textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Enter prompt content..."
              style={{ flex: 1, fontFamily: 'monospace', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn-primary"
                onClick={handleCreate}
                disabled={loading || !editFilename.trim() || !editContent.trim()}
                style={{ flex: 1 }}
              >
                {loading ? '...' : '✓ CREATE'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setIsNew(false)}
                style={{ padding: '10px 20px' }}
              >
                CANCEL
              </button>
            </div>
          </>
        ) : selected ? (
          <>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h2 className="prompt-filename" style={{ fontSize: '18px', margin: 0 }}>
                {selected.filename}
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {hasChanges && (
                  <span className="badge badge-unsaved">
                    ● UNSAVED
                  </span>
                )}
                {selected.is_active && (
                  <span className="badge badge-active">
                    ● ACTIVE
                  </span>
                )}
              </div>
            </div>
            <textarea
              className="textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{ flex: 1, fontFamily: 'monospace', marginBottom: '16px' }}
            />
            
            {/* DEBUG ANZEIGE */}
            <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
              DEBUG: hasChanges={hasChanges ? 'true' : 'false'} | edit={editContent.length} | orig={originalContent.length}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={loading || !hasChanges}
              >
                {loading ? '...' : '✓ SAVE'}
              </button>
              <button
                className="btn-accent"
                onClick={handleActivate}
                disabled={loading || selected.is_active}
              >
                ⚡ ACTIVATE
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={loading || selected.is_active}
              >
                🗑 DELETE
              </button>
            </div>
          </>
        ) : (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#999',
            fontStyle: 'italic'
          }}>
            Select a prompt to edit...
          </div>
        )}
      </div>
    </div>
  );
}
