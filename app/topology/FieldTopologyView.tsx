'use client';

import React, { useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  Node,
  Edge,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

import { TopologyDataLoader } from '@/lib/rrfa/visualization/topologyDataLoader';
import { applySoftForceLayout } from '@/lib/rrfa/visualization/softForceLayout';
import FieldNode from './components/FieldNode';
import FieldEdge from './components/FieldEdge';

const nodeTypes = { field: FieldNode };
const edgeTypes = { field: FieldEdge };

// ============ STYLE TOKENS ============
const BG_DARK = '#0a0a14';
const PANEL_BG = 'rgba(20, 20, 30, 0.85)';
const PANEL_BORDER = '1px solid rgba(255, 255, 255, 0.08)';
const TEXT_PRIMARY = '#ffffff';
const TEXT_DIM = 'rgba(255, 255, 255, 0.55)';
const TEXT_FAINT = 'rgba(255, 255, 255, 0.35)';
const LIVE_GREEN = '#10b981';
const ACCENT_BLUE = '#64c8ff';

// ============ ICONS ============
const I = {
  home: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
  graph: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><line x1="8.5" y1="7.5" x2="15.5" y2="7.5"/><line x1="7.5" y1="8.5" x2="10.5" y2="15.5"/><line x1="16.5" y1="8.5" x2="13.5" y2="15.5"/></svg>',
  signal: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l3-9 4 18 3-9h6"/></svg>',
  clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  docs: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  settings: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  archive: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
  cloud: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
  help: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  gear: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  fullscreen: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
  chevronDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
};

const SIDEBAR_TOP = [
  { id: 'home', icon: I.home, label: 'Home' },
  { id: 'graph', icon: I.graph, label: 'Topology' },
  { id: 'signal', icon: I.signal, label: 'Signals' },
  { id: 'clock', icon: I.clock, label: 'Timeline' },
  { id: 'docs', icon: I.docs, label: 'Artifacts' },
  { id: 'settings', icon: I.settings, label: 'Settings' },
];
const SIDEBAR_BOTTOM = [
  { id: 'archive', icon: I.archive, label: 'Archive' },
];

const PRIMITIVES = [
  { code: 'P01', name: 'Coupling',    color: '#10b981' },
  { code: 'P02', name: 'Decoupling',  color: '#ef4444' },
  { code: 'P03', name: 'Density',     color: '#f59e0b' },
  { code: 'P08', name: 'Delay',       color: '#a78bfa' },
  { code: 'P09', name: 'Propagation', color: '#3b82f6' },
  { code: 'P12', name: 'Drift',       color: '#dc2626' },
];

const VISUAL_LANG = [
  { sym: '●',  label: 'Size',    means: 'Density' },
  { sym: '◉',  label: 'Glow',    means: 'Propagation' },
  { sym: '→',  label: 'Flow',    means: 'Signal Movement' },
  { sym: '∿',  label: 'Shake',   means: 'Drift' },
  { sym: '━',  label: 'Thick',   means: 'Coupling' },
  { sym: '╌',  label: 'Dashed',  means: 'Decoupling' },
  { sym: '⊘',  label: 'Speed',   means: 'Delay' },
];

const fmtTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

// ============ MAIN ============

export default function FieldTopologyView() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [globals, setGlobals] = useState<any>(null);
  const [signalCount, setSignalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [tab, setTab] = useState<'live' | 'timeline' | 'metrics'>('live');
  const [activeIcon, setActiveIcon] = useState('graph');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TopologyDataLoader.loadFieldTopology('novascale_ai');
      const positioned = applySoftForceLayout(data.nodes, data.edges, 1200, 800);
      setNodes(positioned);
      setEdges(data.edges);
      setGlobals(data.globals);
      const sc = data.edges.reduce((s: number, e: any) => s + (e.data?.signal_count || 0), 0);
      setSignalCount(sc);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: BG_DARK, color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading field topology...
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: BG_DARK, color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div>Failed: {error}</div>
        <button onClick={load} style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', background: 'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(60, 80, 180, 0.15) 0%, transparent 50%), radial-gradient(ellipse 70% 50% at 70% 60%, rgba(120, 60, 180, 0.12) 0%, transparent 60%), radial-gradient(ellipse at center, #0d1428 0%, #0a0a14 60%, #050510 100%)', color: TEXT_PRIMARY, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', fontSize: '13px', overflow: 'hidden' }}>

      {/* HEADER */}
      <header style={{ height: '42px', display: 'flex', alignItems: 'center', padding: '0 1rem', borderBottom: PANEL_BORDER, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '260px' }}>
          <Logo />
          <span style={{ fontWeight: 600, fontSize: '13px' }}>CondYn Field Topology</span>
          <LivePill />
        </div>
        <div style={{ flex: 1, textAlign: 'center', color: TEXT_DIM, fontSize: '12px' }}>
          <span>novascale_ai</span>
          <span style={{ color: TEXT_FAINT, margin: '0 0.5rem' }}>•</span>
          <span>Field State</span>
          <span style={{ marginLeft: '0.75rem' }}><LivePill /></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '260px', justifyContent: 'flex-end', color: TEXT_DIM, fontSize: '11px' }}>
          <button style={iconBtnStyle} title="RRFA Runtime">
            <span>RRFA Runtime</span>
            <span dangerouslySetInnerHTML={{ __html: I.chevronDown }} />
          </button>
          <span style={{ fontFamily: 'monospace', color: TEXT_PRIMARY, fontSize: '12px', padding: '0 0.5rem' }}>{fmtTime(now)}</span>
          <button style={iconBtnStyle} title="Sync" dangerouslySetInnerHTML={{ __html: I.cloud }} />
          <button style={iconBtnStyle} title="Help" dangerouslySetInnerHTML={{ __html: I.help }} />
          <button style={iconBtnStyle} title="Settings" dangerouslySetInnerHTML={{ __html: I.gear }} />
        </div>
      </header>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT ICON SIDEBAR */}
        <aside style={{ width: '50px', borderRight: PANEL_BORDER, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', flex: 1 }}>
            {SIDEBAR_TOP.map(item => (
              <SidebarBtn key={item.id} item={item} active={activeIcon === item.id} onClick={() => setActiveIcon(item.id)} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
            {SIDEBAR_BOTTOM.map(item => (
              <SidebarBtn key={item.id} item={item} active={activeIcon === item.id} onClick={() => setActiveIcon(item.id)} />
            ))}
          </div>
        </aside>

        {/* MAIN CANVAS */}
        <main style={{ flex: 1, position: 'relative', backgroundColor: BG_DARK }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            proOptions={{ hideAttribution: true }}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={40}
              size={1}
              color="rgba(255, 255, 255, 0.03)"
            />
          </ReactFlow>
        </main>

        {/* RIGHT PANELS */}
        <aside style={{ width: '240px', borderLeft: PANEL_BORDER, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flexShrink: 0 }}>

          {globals && (
            <Panel title="Global Field State" live>
              <Bar label="Propagation" value={globals.avg_propagation} color="#3b82f6" />
              <Bar label="Stability"   value={globals.stability_score} color="#10b981" />
              <Bar label="Coupling"    value={globals.coupling_ratio}  color="#f59e0b" />
              <Row label="Drift Hotspots" value={globals.drift_hotspots} />
              <Sep />
              <Row label="Signals" value={signalCount} mono />
              <Row label="Nodes"   value={nodes.length} mono />
              <Row label="Edges"   value={edges.length} mono />
              <Row label="Last Update" value={fmtTime(now)} mono />
            </Panel>
          )}

          <Panel title="Primitive Legend">
            {PRIMITIVES.map(p => (
              <div key={p.code} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '11px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: p.color, flexShrink: 0 }} />
                <span style={{ color: TEXT_DIM }}>{p.code}</span>
                <span>{p.name}</span>
              </div>
            ))}
          </Panel>

          <Panel title="Visual Language">
            {VISUAL_LANG.map(v => (
              <div key={v.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '10px' }}>
                <span style={{ width: '18px', textAlign: 'center', color: ACCENT_BLUE, fontSize: '13px' }}>{v.sym}</span>
                <span style={{ width: '54px' }}>{v.label}</span>
                <span style={{ color: TEXT_DIM }}>= {v.means}</span>
              </div>
            ))}
          </Panel>
        </aside>
      </div>

      {/* FOOTER */}
      <footer style={{ height: '38px', display: 'flex', alignItems: 'center', padding: '0 1rem', borderTop: PANEL_BORDER, gap: '0.75rem', flexShrink: 0, fontSize: '11px', color: TEXT_DIM }}>
        <span>RRFA Runtime v1.0-alpha</span>
        <span style={{ color: TEXT_FAINT }}>|</span>
        <span>Field Topology Live</span>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setPaused(!paused)}
            style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', color: TEXT_PRIMARY, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}
          >
            {paused ? '▶' : '⏸'}
          </button>
          <input
            type="range" min="0.1" max="3" step="0.1" value={speed}
            onChange={e => setSpeed(parseFloat(e.target.value))}
            style={{ width: '140px', accentColor: ACCENT_BLUE }}
          />
          <span style={{ fontFamily: 'monospace', minWidth: '36px', color: TEXT_PRIMARY }}>{speed.toFixed(1)}x</span>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {(['live', 'timeline', 'metrics'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '0.3rem 0.75rem',
                backgroundColor: tab === t ? 'rgba(100, 200, 255, 0.12)' : 'transparent',
                color: tab === t ? ACCENT_BLUE : TEXT_DIM,
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '11px',
                textTransform: 'capitalize',
                fontWeight: tab === t ? 600 : 400
              }}
            >
              {t}
            </button>
          ))}
          <button
            onClick={toggleFullscreen}
            style={{ marginLeft: '0.5rem', padding: '0.3rem', backgroundColor: 'transparent', color: TEXT_DIM, border: 'none', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
            title="Fullscreen"
            dangerouslySetInnerHTML={{ __html: I.fullscreen }}
          />
        </div>
      </footer>
    </div>
  );
}

// ============ SUB-COMPONENTS ============

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.3rem 0.5rem',
  backgroundColor: 'transparent',
  color: TEXT_DIM,
  border: 'none',
  cursor: 'pointer',
  borderRadius: '4px',
  fontSize: '11px',
};

function Logo() {
  return (
    <div style={{ position: 'relative', width: '20px', height: '20px' }}>
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${ACCENT_BLUE} 0%, rgba(100,200,255,0.2) 50%, transparent 75%)`,
        boxShadow: `0 0 8px ${ACCENT_BLUE}`
      }} />
      <div style={{
        position: 'absolute', top: '2px', right: '2px',
        width: '3px', height: '3px', borderRadius: '50%',
        backgroundColor: 'white', opacity: 0.9
      }} />
      <div style={{
        position: 'absolute', bottom: '4px', left: '3px',
        width: '2px', height: '2px', borderRadius: '50%',
        backgroundColor: 'white', opacity: 0.7
      }} />
    </div>
  );
}

function SidebarBtn({ item, active, onClick }: { item: any; active: boolean; onClick: () => void }) {
  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
      {active && <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: '2px', backgroundColor: ACCENT_BLUE, borderRadius: '0 2px 2px 0' }} />}
      <button
        title={item.label}
        onClick={onClick}
        style={{
          width: '36px', height: '36px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: active ? 'rgba(100, 200, 255, 0.1)' : 'transparent',
          border: 'none',
          color: active ? ACCENT_BLUE : TEXT_DIM,
          cursor: 'pointer',
          borderRadius: '6px',
          transition: 'all 150ms ease'
        }}
        dangerouslySetInnerHTML={{ __html: item.icon }}
      />
    </div>
  );
}

function LivePill() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: LIVE_GREEN, boxShadow: `0 0 6px ${LIVE_GREEN}` }} />
      <span style={{ fontSize: '9px', color: LIVE_GREEN, fontWeight: 600, letterSpacing: '0.5px' }}>LIVE</span>
    </span>
  );
}

function Panel({ title, children, live }: { title: string; children: React.ReactNode; live?: boolean }) {
  return (
    <div style={{ backgroundColor: PANEL_BG, border: PANEL_BORDER, borderRadius: '6px', padding: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.3px' }}>{title}</span>
        {live && <LivePill />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '11px' }}>
        {children}
      </div>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ color: TEXT_DIM }}>{label}</span>
        <span style={{ fontFamily: 'monospace' }}>{pct}%</span>
      </div>
      <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, transition: 'width 300ms ease' }} />
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: TEXT_DIM }}>{label}</span>
      <span style={{ fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  );
}

function Sep() {
  return <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '0.3rem 0' }} />;
}
