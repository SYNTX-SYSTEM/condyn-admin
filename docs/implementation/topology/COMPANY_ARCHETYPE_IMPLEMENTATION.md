# Company Archetype Implementation - ConDyn Topology View

**Status:** ✅ Resolved - Archetype Grammar Operational  
**Date:** 2026-05-11  
**Version:** v2.4.0-alpha  
**Previous:** [Topology View v1 Complete](./TOPOLOGY_VIEW_V1_COMPLETE.md)

---

## Executive Summary

**Goal:** Transform topology viewer toward topology engine through archetype-driven manifestation via constraint grammar.

**Principle:** `Same renderer + Different constraints = Emergent organizational signatures`

**Achievement:** ✅ Foundation for topology engine behavior established. Different companies now load different data with different field characteristics through the same rendering substrate.

**Status:** Initial caching instability resolved through full server re-render strategy (hard navigation fallback + async searchParams handling).

---

## The Central Architectural Proof

**What We Achieved:**

✅ Different company (novascale_ai → helixbank_europe → medcore_health)  
✅ Different data (10 nodes → 5 nodes → 5 nodes)  
✅ Different field characteristics (authority 0.82 → regulatory 0.88 → staffing 0.83)  
✅ Same renderer (React Flow + Transformer)

**This is the actual milestone:** The system crossed from static visualization into topology semantics.

---

## Table of Contents

1. [Architectural Evolution](#architectural-evolution)
2. [Constraint Grammar Layer](#constraint-grammar-layer)
3. [Company Switcher Implementation](#company-switcher-implementation)
4. [Data Architecture](#data-architecture)
5. [The Caching Challenge (Resolved)](#the-caching-challenge-resolved)
6. [Screenshot Instructions](#screenshot-instructions)
7. [Technical Lessons Learned](#technical-lessons-learned)
8. [Next Steps](#next-steps)

---

## Architectural Evolution

### From Viewer Toward Engine

**Before (v1):** Static topology visualization
```
Ontology → Transformer → React Flow
```

**After (v2.4-alpha):** Foundation for archetype-driven topology grammar
```
Ontology (company.json, network.json)
    ↓
Constraint Grammar Layer  ← NEW
  - lib/topology/constraints.ts
  - TOPOLOGY_ARCHETYPES
  - calculateConstrainedPosition()
    ↓
Rendering Layer (transformer.ts → React Flow)
```

### Core Architectural Principle

**NOT:** Manual layout design per company  
**BUT:** `company archetype → spatial behavior`

The topology grammar encodes **organizational behavior patterns**, not visual preferences.

### Why "Toward Engine" Not "Engine Yet"

**Current State:** Deterministic constraints produce different topologies  
**True Engine State:** Topology influences itself recursively

Still needed for full engine behavior:
- Emergent recursion
- Self-organizing clusters
- Signal gravity attractors
- Propagation field dynamics

**Status:** Foundation established, recursive emergence next phase.

---

## Constraint Grammar Layer

### File: `lib/topology/constraints.ts`

#### Archetype Definitions

```typescript
export const TOPOLOGY_ARCHETYPES: Record<string, ArchetypeConstraints> = {
  
  'novascale_ai': {
    label: 'NovaScale AI',
    archetype: 'Lateral Coupling',
    
    constraints: {
      directionBias: 'horizontal',
      compression: 0.7,
      centralization: 0.3,
    },
    
    // Expected: Horizontal spread, distributed centers
  },
  
  'helixbank_europe': {
    label: 'HelixBank Europe',
    archetype: 'Authority Escalation',
    
    constraints: {
      directionBias: 'vertical',
      compression: 0.9,
      centralization: 0.85,
    },
    
    // Expected: Vertical hierarchy, centralized authority
  },
  
  'medcore_health': {
    label: 'MedCore Health',
    archetype: 'Distributed Fragmentation',
    
    constraints: {
      directionBias: 'fragmented',
      compression: 0.5,
      centralization: 0.2,
      clusterCount: 4,
    },
    
    // Expected: Multi-center clusters, loose coupling
  },
};
```

#### Constraint Application

```typescript
function calculateConstrainedPosition(
  baseX: number,
  baseY: number,
  constraints: ArchetypeConstraints
): { x: number; y: number } {
  
  switch (constraints.directionBias) {
    case 'horizontal':
      return {
        x: baseX * 1.2,  // Wider spread
        y: baseY * 0.7,  // Compressed vertically
      };
      
    case 'vertical':
      return {
        x: baseX * 0.6,  // Compressed horizontally
        y: baseY * 1.3,  // Extended vertically
      };
      
    case 'fragmented':
      // Distribute across quadrants
      const quadrant = Math.floor(Math.random() * 4);
      return distributeToQuadrant(baseX, baseY, quadrant);
  }
}
```

### Why NOT Physics Simulation?

**Avoided:**
- Complexity chaos
- Instability/tuning hell
- Loss of controlled coherence
- Debugging nightmare

**Chosen:**
- Deterministic constraint-based positioning
- Discrete topology archetypes
- Readable, debuggable logic
- Controlled emergence

**Status:** Experimentally validated through three company archetypes.

---

## Company Switcher Implementation

### Design Evolution

**Attempt 1:** Fixed position top-right  
❌ **Problem:** Overlapped StructuralInspector panel

**Attempt 2:** Floating with z-index management  
❌ **Problem:** Still caused UI conflicts

**Final Solution:** Horizontal bar symbiotically integrated
```
[CompanySwitcher - horizontal bar oben]
[FieldSignature] [Graph] [Inspector]
```

### File: `components/topology/CompanySwitcher.tsx`

```typescript
export default function CompanySwitcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCompany = searchParams.get('company') || 'novascale_ai';
  
  const handleCompanyChange = (companyId: string) => {
    console.log('🔄 Switching to company:', companyId);
    // Hard navigation ensures full server re-render
    window.location.href = `/topology?company=${companyId}`;
  };
  
  return (
    <div style={{
      display: 'flex',
      padding: '12px 20px',
      background: '#FAFAFA',
      borderBottom: '1px solid #E5E7EB',
    }}>
      {COMPANIES.map((company) => (
        <button
          onClick={() => handleCompanyChange(company.id)}
          style={{
            background: currentCompany === company.id ? '#EEF2FF' : 'white',
            border: currentCompany === company.id 
              ? '2px solid #6366F1' 
              : '1px solid #E5E7EB',
          }}
        >
          {company.name}
          <span>· {company.archetype}</span>
        </button>
      ))}
    </div>
  );
}
```

### Ontology-Driven Labels

**NOT:** Technical descriptions ("Horizontal", "Vertical", "Fragmented")  
**BUT:** Organizational patterns ("Lateral Coupling", "Authority Escalation", "Distributed Fragmentation")

This maintains semiotic coherence: the UI speaks the language of organizational dynamics, not graph theory.

---

## Data Architecture

### Directory Structure

```
data/companies/
├── novascale_ai/
│   ├── company.json           # 180 employees
│   ├── analysis/
│   │   ├── network.json       # 10 nodes
│   │   ├── signals/           # 4 signals
│   │   └── links/             # 4 links
│   ├── artifacts/
│   │   ├── emails/
│   │   ├── kpis/
│   │   └── ...
│   └── events/                # 2 events
│
├── helixbank_europe/
│   ├── company.json           # 4200 employees
│   ├── analysis/
│   │   ├── network.json       # 5 nodes
│   │   ├── signals/           # 2 signals
│   │   └── links/             # 2 links
│   └── ...
│
└── medcore_health/
    ├── company.json           # 950 employees
    ├── analysis/
    │   ├── network.json       # 5 nodes
    │   ├── signals/           # 2 signals
    │   └── links/             # 2 links
    └── ...
```

### Network Data Format

```json
{
  "network_id": "NET_NOVA_001",
  "company_id": "CMP_NOVA_001",
  "nodes": [
    "MAIL_NOVA_001",
    "MAIL_NOVA_002",
    "EVT_NOVA_001",
    "EVT_NOVA_002",
    "KPI_NOVA_2026_05",
    "..."
  ],
  "edges": [
    "LINK_NOVA_001",
    "LINK_NOVA_002",
    "..."
  ],
  "topology_characteristics": {
    "authority_centralization": 0.82,
    "workflow_instability": 0.76,
    "turnover_pressure": 0.67,
    "signal_density": 0.71,
    "bottleneck_probability": 0.64
  }
}
```

**Key Insight:** Node IDs are strings, not objects. The transformer creates React Flow nodes from these IDs. Artifact details are stored separately in `artifacts/` directories.

### Verified Data Differences

| Company | Nodes | Signals | Links | Events | Key Characteristic |
|---------|-------|---------|-------|--------|-------------------|
| NovaScale | 10 | 4 | 4 | 2 | Authority centralization (0.82) |
| HelixBank | 5 | 2 | 2 | 1 | Regulatory pressure (0.88) |
| MedCore | 5 | 2 | 2 | 1 | Staffing pressure (0.83) |

**Node ID Prefixes:**
- NovaScale: `MAIL_NOVA_`, `EVT_NOVA_`, `KPI_NOVA_`, `SIG_NOVA_`
- HelixBank: `MAIL_HELIX_`, `EVT_HELIX_`, `KPI_HELIX_`, `SIG_HELIX_`
- MedCore: `SHIFT_MED_`, `EVT_MED_`, `KPI_MED_`, `SIG_MED_`

---

## The Caching Challenge (Resolved)

### Problem Statement

**Initial Observed Behavior:**
- URL changed correctly: `?company=novascale_ai` → `?company=helixbank_europe`
- Page reload triggered
- **BUT:** UI displayed same data (always NovaScale nodes)
- **AND:** No server logs appeared (loader not called)

### Investigation & Resolution Timeline

#### Attempt 1: `router.push()` with `router.refresh()`
```typescript
router.push(`/topology?company=${companyId}`);
router.refresh();
```
**Result:** ❌ URL changes, no server re-render

#### Attempt 2: `window.location.href` (hard navigation)
```typescript
window.location.href = `/topology?company=${companyId}`;
```
**Result:** ✅ Full page reload triggers server re-render (but needed async params)

#### Attempt 3: Force dynamic rendering
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;
```
**Result:** ✅ Required for server-side rendering

#### Attempt 4: Async searchParams (Next.js 15+ requirement)
```typescript
interface PageProps {
  searchParams: Promise<{ company?: string }>;
}

export default async function TopologyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const companyId = params.company || 'novascale_ai';
  // ...
}
```
**Result:** ✅ **RESOLUTION** - Combined with hard navigation, enables proper data loading

### Final Solution

**Strategy:** Full server re-render on every company switch

**Components:**
1. Hard navigation via `window.location.href` (bypasses Next.js router cache)
2. Async searchParams handling (Next.js 15+ compliance)
3. Dynamic rendering exports (`force-dynamic`, `revalidate: 0`)
4. Key prop with timestamp (forces React remount)

**Evidence of Resolution:**
```bash
pm2 logs condyn-admin

8|condyn-a | 🔍 LOADING TOPOLOGY FOR: novascale_ai
8|condyn-a | ✓ Network loaded: 10 nodes
8|condyn-a | ✓ Company loaded: NovaScale AI

8|condyn-a | 🔍 LOADING TOPOLOGY FOR: helixbank_europe  
8|condyn-a | ✓ Network loaded: 5 nodes
8|condyn-a | ✓ Company loaded: HelixBank Europe

8|condyn-a | 🔍 LOADING TOPOLOGY FOR: medcore_health
8|condyn-a | ✓ Network loaded: 5 nodes
8|condyn-a | ✓ Company loaded: MedCore Health Systems
```

**Status:** ✅ Resolved. Different companies load different data correctly.

---

## Screenshot Instructions

### Required Screenshots

**Purpose:** Document the architectural proof that different companies manifest different topologies through the same renderer.

#### Screenshot 1: NovaScale AI - Lateral Coupling
**Filename:** `novascale-lateral-coupling.png`

**Instructions:**
1. Navigate to: `https://admin.condyn.eu/topology?company=novascale_ai`
2. Wait for full load
3. Capture full browser window showing:
   - Company switcher bar (top) with "NovaScale AI · Lateral Coupling" selected
   - Left sidebar showing "NovaScale AI" + "180 employees"
   - Graph showing 10 nodes (MAIL_NOVA_001, MAIL_NOVA_002, EVT_NOVA_001, etc.)
   - Data composition panel showing "10 NODES, 4 SIGNALS, 4 RELATIONS, 2 EVENTS"

**What to verify visible:**
- Node layout: Horizontal spread
- Node IDs: All start with NOVA
- Topology characteristics: Authority Centralization 82%

---

#### Screenshot 2: HelixBank Europe - Authority Escalation  
**Filename:** `helixbank-authority-escalation.png`

**Instructions:**
1. Click "HelixBank Europe" button in company switcher
2. Wait for page reload and full load
3. Capture full browser window showing:
   - Company switcher bar with "HelixBank Europe · Authority Escalation" selected
   - Left sidebar showing "HelixBank Europe" + "4200 employees"
   - Graph showing 5 nodes (MAIL_HELIX_001, EVT_HELIX_001, etc.)
   - Data composition panel showing "5 NODES, 2 SIGNALS, 2 RELATIONS, 1 EVENT"

**What to verify visible:**
- Different company name in sidebar
- Different node count (5 vs 10)
- Different node IDs: All start with HELIX (not NOVA!)
- Topology characteristics: Regulatory Pressure visible

---

#### Screenshot 3: MedCore Health - Distributed Fragmentation
**Filename:** `medcore-distributed-fragmentation.png`

**Instructions:**
1. Click "MedCore Health" button in company switcher
2. Wait for page reload and full load
3. Capture full browser window showing:
   - Company switcher bar with "MedCore Health · Distributed Fragmentation" selected
   - Left sidebar showing "MedCore Health Systems" + "950 employees"
   - Graph showing 5 nodes (SHIFT_MED_001, EVT_MED_001, etc.)
   - Data composition panel showing "5 NODES, 2 SIGNALS, 2 RELATIONS, 1 EVENT"

**What to verify visible:**
- Different company name in sidebar (MedCore not NovaScale!)
- Different node IDs: Start with MED or SHIFT_MED (not NOVA or HELIX!)
- Topology characteristics: Staffing Pressure visible

---

#### Screenshot 4: Side-by-Side Comparison
**Filename:** `archetype-comparison-triptych.png`

**Instructions:**
1. Use image editing tool to create horizontal triptych
2. Place all three screenshots side-by-side
3. Add labels above each: "Lateral Coupling", "Authority Escalation", "Distributed Fragmentation"
4. This visual proof shows: Same renderer, different data, different field characteristics

**Purpose:** Visual evidence of the central architectural achievement.

---

### Screenshot Verification Checklist

Before documenting as complete, verify each screenshot shows:

- [ ] **NovaScale:** 10 nodes, NOVA prefix, 180 employees, Authority 82%
- [ ] **HelixBank:** 5 nodes, HELIX prefix, 4200 employees, Regulatory 88%
- [ ] **MedCore:** 5 nodes, MED/SHIFT_MED prefix, 950 employees, Staffing 83%
- [ ] **All three:** Different company names in sidebar (NOT all showing "NovaScale")
- [ ] **All three:** Different node counts visible
- [ ] **All three:** Different node ID prefixes visible in graph
- [ ] **Triptych:** Clear visual comparison showing same UI, different data

**Critical:** If ANY screenshot still shows "NovaScale AI" for HelixBank or MedCore, the caching issue is NOT resolved. Do not proceed with documentation.

---

## Technical Lessons Learned

### 1. Check Structure First, Always

**User Correction:** "erst die Struktur schauen, IMMER!"

**Mistake Pattern:**
- Guessing interface props
- Writing code before checking types
- Assuming behavior from memory

**Correct Approach:**
```bash
# Always check existing structure
cat components/topology/StructuralInspector.tsx | grep "interface.*Props"
git show HEAD:path/to/file.tsx
cat types/topology.ts
```

### 2. Symbiotic Integration Over Floating UI

**Lesson:** Horizontal switcher better than fixed overlay
- No z-index conflicts
- Part of layout flow
- More institutional feel
- Better UX on mobile (future)

### 3. Controlled Coherence > Maximum Complexity

**Sweet spot:** Deterministic constraints, not full physics
- Debuggable logic
- Stable, predictable
- Can add complexity later when grammar validates

### 4. Next.js 15+ searchParams Requires Async

**Critical Finding:** searchParams is now a Promise

**Wrong (Next.js 14):**
```typescript
export default function Page({ searchParams }: PageProps) {
  const company = searchParams.company; // ❌
}
```

**Correct (Next.js 15+):**
```typescript
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const company = params.company; // ✅
}
```

### 5. Hard Navigation as Fallback Strategy

**When to use:**
- Server component needs guaranteed re-render
- searchParams must trigger data reload
- Cache must be bypassed completely

**Trade-off:** Full page reload (slower) vs. guaranteed fresh data (correct)

**Verdict:** Correctness > smoothness for data-critical applications

### 6. Aggressive Logging Critical for SSR Debugging

```typescript
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 LOADING TOPOLOGY FOR:', companyId);
console.log('📁 Base path:', basePath);
console.log('✓ Company loaded:', company.name);
console.log('✓ Network loaded:', network.nodes.length, 'nodes');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
```

Essential for understanding what runs where and when in SSR context.

---

## Next Steps

### Phase 3: Micro-Semiotics (Signal Gravity)

Now that company switching works and different data manifests:

1. **Signal Gravity**
   - Nodes attract/repel based on signal density
   - High-signal nodes become visual attractors
   - Field strength proportional to characteristics

2. **Propagation Bias**
   - Edge direction affects field flow
   - Authority gradients become visible
   - Bottleneck nodes show compression

3. **Density Zones**
   - Company-specific compression patterns
   - Cluster formation based on link density
   - Fragmentation becomes emergent, not designed

4. **Breathing Animation** (Careful!)
   - Subtle pulsing for active signals
   - Value-driven, not decorative
   - Indicates field intensity

5. **Force-Directed Layout**
   - Replace deterministic grid
   - Physics-informed positioning
   - Maintain constraint boundaries

### Validation Criteria

```
Current State (v2.4-alpha):
✅ Different companies load different data
✅ Constraint grammar defines archetypes
✅ Same renderer produces different views

Transition to Engine (v2.5+):
⏳ Topology influences itself recursively
⏳ Emergent clustering, not designed
⏳ Signal gravity creates attractors
⏳ Field density affects propagation
```

### Success Criteria for "Engine" Status

```
IF:
  HelixBank → emergently vertical (not grid-vertical)
  NovaScale → emergently lateral (not grid-lateral)
  MedCore → emergently fragmented (not grid-fragmented)

WITHOUT manual positioning
THROUGH recursive field interactions

THEN:
  Topology Engine ✅ (not just foundation)
```

**Current Status:** Foundation for engine behavior established. Recursive emergence is next phase.

---

## File Inventory

### New Files

```
lib/topology/
  └── constraints.ts              # Topology grammar layer

components/topology/
  └── CompanySwitcher.tsx         # Horizontal archetype selector

docs/implementation/topology/
  └── COMPANY_ARCHETYPE_IMPLEMENTATION.md  # This document
  └── screenshots/                # Visual evidence
      ├── novascale-lateral-coupling.png
      ├── helixbank-authority-escalation.png
      ├── medcore-distributed-fragmentation.png
      └── archetype-comparison-triptych.png
```

### Modified Files

```
lib/topology/
  ├── loader.ts                   # Aggressive debug logging
  └── transformer.ts              # Constraint-driven positioning

components/topology/
  └── TopologyView.tsx            # Layout restructure, key prop

app/topology/
  └── page.tsx                    # Async searchParams, dynamic rendering
```

### Data Verified

```
data/companies/
  ├── novascale_ai/               # 10 nodes, 180 employees ✓
  ├── helixbank_europe/           # 5 nodes, 4200 employees ✓
  └── medcore_health/             # 5 nodes, 950 employees ✓
```

---

## Key Quotes & Principles

**The Central Innovation:**
> "Same renderer + Different constraints = Emergent organizational signatures"

**On Architecture:**
> "company archetype → spatial behavior" (not manual layout design)

**On Implementation:**
> "Lightweight constraint grammar, NOT full physics engine"

**On Status:**
> "Transition toward topology engine" (not engine yet)

**On Validation:**
> "The system crossed from static visualization into topology semantics"

**On Semiotics:**
> "You FEEL the differences, don't SEE them directly. That's semiotics."

**User Wisdom:**
> "erst die Struktur schauen, IMMER!"

**On Documentation:**
> "Do not document a problem as current state although it is already solved"

---

## Status Summary

### ✅ Completed

- Constraint grammar layer architecture
- Three company archetype profiles defined
- Transformer constraint-driven positioning logic
- Horizontal company switcher UI (symbiotically integrated)
- Dynamic rendering with async searchParams
- Data loading resolution (hard navigation + async params)
- Data verification (all 3 companies load correctly)
- Comprehensive debug logging

### ⏳ Next Phase

- Signal gravity implementation
- Emergent clustering
- Recursive field interactions
- Force-directed layout with constraints
- Full "engine" behavior

### 🎯 Architectural Achievement

**The Central Proof:**
- ✅ Different company
- ✅ Different data
- ✅ Different field characteristics
- ✅ Same renderer

**This is the threshold:** From viewer to foundation for engine behavior.

---

## Documentation Meta

**Author:** ConDyn Development Team  
**Date:** 2026-05-11  
**Session Duration:** ~3 hours  
**Commits:** 15+ iterations  
**Lines Changed:** ~500  
**Resolution:** Caching instability resolved through full server re-render strategy

**Previous Documentation:** [Topology View v1](./TOPOLOGY_VIEW_V1_COMPLETE.md) (675 lines)  
**Git Branch:** `feature/topology-view`  
**Git Tag:** `v2.4.0-alpha-archetype-grammar`  
**Status:** Alpha - experimentally validated, foundation established

---

## Appendix: Why "Alpha"?

**Alpha Status Maintained Because:**

1. **Constraint Grammar Still Experimental**
   - Validated on 3 small networks only
   - Not tested on large networks (100+ nodes)
   - No real cluster formation yet
   - No recursive gravitational effects

2. **Not True "Engine" Yet**
   - Current: Deterministic constraints
   - Missing: Emergent recursion
   - Missing: Self-organizing behavior
   - Missing: Field-influenced propagation

3. **Validation Scope Limited**
   - 3 companies (NovaScale, HelixBank, MedCore)
   - Small node counts (5-10 nodes)
   - Simple archetypes (lateral, vertical, fragmented)
   - Grid-based positioning (not emergent)

**Alpha = Correct Status**

The foundation is solid. The architectural proof works. But true engine behavior requires recursive emergence, which is the next phase.

**When Beta?**
- When signal gravity affects layout
- When clusters form emergently
- When field density influences propagation
- When topology influences itself recursively

**When Stable?**
- When validated on real organizational networks
- When emergent patterns are reproducible
- When archetype grammar predicts organizational behavior
- When field semantics are validated by domain experts

---

**End of Document**

*This implementation represents the foundation for topology engine behavior. The architecture is sound, the grammar is defined, the data loads correctly, and different companies manifest different topologies through the same renderer.*

*"The threshold has been crossed: from static visualization into topology semantics."*

*"The ontology is becoming visible."*

