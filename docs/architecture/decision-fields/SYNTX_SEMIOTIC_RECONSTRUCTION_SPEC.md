<!--
Owner input, recorded verbatim on 2026-10-11 by GELB (DLL Architecture) so that GRÜN and PINK can cite one fixed text.
Issued together with the owner mandate "SFE — SYNTX SEMIONTIC FIELD RECONSTRUCTION".
It is the target architecture, not a permission to represent states the repository does not carry; the binding of
every sign to a repository field, the unsupported list and the governance rulings are in
SYNTX_FIELD_CONTRACT_BINDING.md next to this file. Distinct from docs/SYNTX_SEMANTIC_INTERFACE_LANGUAGE_v1.0.md (SIL).
-->

# CONDYN / SYNTX  
## Boundary-Constrained Semiotic Reconstruction Specification

### Status

Repository access unavailable.  
Runtime contracts not inspected directly.  
No implementation is claimed.

This specification is implementation-ready against CONDYN only through the integration points identified below.

No new evidence, capability, score, verification, recommendation, authority status, matching result, or persisted analysis is introduced.

---

# 0. RECONSTRUCTION AXIOM

The interface must no longer behave as:

> dashboard → galaxy → floating lens

It must behave as:

> relational field → selected entity → field reorganization → evidence manifestation → interpretation

The field is the primary interface.

Information is not placed beside the field.  
Information emerges by changing the field’s relational resolution.

---

# 1. IMPLEMENTATION BOUNDARY

## 1.1 Authorized Scope

This reconstruction applies to presentation and interaction behavior for:

- Job Pool Field
- Job Field
- relational visualization of organizations
- relational visualization of roles
- relational visualization of requirements
- evidence trace manifestation
- authority-constrained presentation states
- selection / inspection / return behavior

## 1.2 Protected Scope

Do not modify:

- database schema
- persisted records
- canonical matching algorithms
- Gemini Discovery / Convergence logic
- scoring formulas
- source evidence
- provenance contracts
- authority classification
- production infrastructure
- existing operational workflows
- protected Capability Field chrome / sealed contracts

## 1.3 Capability Field Scope

Capability Field semiotics are specified conceptually for alignment.

Capability Field implementation is out of authorized scope unless separately approved.

---

# 2. FINAL RELATIONAL VISUAL GRAMMAR

## 2.1 Primitive System

The interface uses only relational primitives.

| Primitive | Meaning | Permitted Source |
|---|---|---|
| Field | complete relational ecology | selected Job Pool / Job Field context |
| Carrier | organization, role, requirement, evidence source, capability reference | canonical entity or delivered analysis entity |
| Containment | membership / ownership / belonging | organization-role or role-requirement relation |
| Trace | evidence / provenance / support relation | existing evidence or Gemini-discovered source reference |
| Open Trace | missing or insufficient support | requirement with no delivered support |
| Boundary | authority / evaluation limit | existing authority classification or evaluation availability |
| Coupling | relation strength / relevance | matching contribution or delivered semantic relation |
| Depth | focus-dependent relevance | selected entity relation graph |
| Aperture | temporary inspection window | user-triggered evidence/source inspection |
| Closure | legitimate evaluated support | only where canonical evaluation supports it |

No decorative nebula.  
No decorative orbital motion.  
No arbitrary glow.  
No permanent card layer.  
No primary numeric score display.

---

# 3. EXISTING CONDYN STATE → VISUAL SIGN MAPPING

## 3.1 Core Evidence State Mapping

| Existing State | Visual Manifestation | Authority Limit |
|---|---|---|
| Scored evidence | stable trace connecting requirement to evidence source; visible contribution thickness | may show matching contribution but not broader certification |
| Weak evidence | thin stable trace; low coupling; does not close requirement boundary | may indicate support, not satisfaction |
| Unscored sweep coverage | dotted exploratory trace; separate from scored trace grammar | may show discovered coverage, not evaluated match |
| Missing evidence | open requirement boundary with no trace; unresolved aperture available | must not imply absent capability |
| Pending canonical evaluation | suspended boundary; trace cannot close; score withheld or secondary | must not imply authoritative result |

## 3.2 Overlap Rule

These categories are not forced into mutual exclusivity.

A requirement may simultaneously have:

- weak scored evidence
- additional unscored sweep coverage
- pending canonical evaluation boundary

Visual composition must allow stacking:

```ts
VisualState = {
  scoredTrace?: ScoredTrace;
  weakTrace?: WeakTrace;
  sweepTrace?: SweepTrace;
  missingOpenRelation?: OpenRelation;
  pendingEvaluationBoundary?: PendingBoundary;
}
```

No single color/status badge may collapse overlapping relation states.

---

# 4. SOURCE → RELATION → STATE → VISUAL CONTRACT

## 4.1 Job Pool Membership

| Contract Layer | Specification |
|---|---|
| SOURCE | selected Job Pool record; organizations and roles belonging to pool |
| RELATION | pool contains organizations; organizations contain roles |
| STATE | present / selected / receded |
| VISUAL MANIFESTATION | pool field forms global topology; organizations appear as readable named regions; roles nest inside organization regions |
| INTERACTION | select organization or role directly from field |
| TRANSITION | selected organization moves to center; unrelated organizations recede into depth |
| PROOF | every displayed organization/role must resolve to canonical ID and membership relation |

Unsupported if:

- role is displayed without canonical role ID
- organization containment is inferred only from label text
- visual grouping does not correspond to stored pool membership

---

## 4.2 Organization → Role Relation

| Contract Layer | Specification |
|---|---|
| SOURCE | organization identifier and role records |
| RELATION | organization contains role |
| STATE | active / latent / receded |
| VISUAL MANIFESTATION | organization becomes a spatial vessel; roles unfold inside its boundary as full readable names |
| INTERACTION | selecting role transforms field into role constraint ecology |
| TRANSITION | containment expands; selected role exits containment into center while organization boundary remains behind as origin context |
| PROOF | each role’s visual parent equals stored organization relation |

Unsupported if:

- roles orbit organization decoratively without membership proof
- role names are truncated as primary labels
- organization selection opens a side panel instead of reorganizing field

---

## 4.3 Role → Requirement Relation

| Contract Layer | Specification |
|---|---|
| SOURCE | role requirement extraction / delivered analysis |
| RELATION | role requires requirement |
| STATE | requirement exists; support state may vary |
| VISUAL MANIFESTATION | selected role becomes central constraint body; requirements appear as independent anchors around it |
| INTERACTION | selecting requirement increases local perceptual resolution |
| TRANSITION | requirements expand from role body into structured constraint ring / constellation; no list overlay |
| PROOF | every requirement anchor must map to requirement ID or stable requirement text object from existing analysis |

Unsupported if:

- requirement appears only as list item inside card
- requirement has no underlying extracted requirement source
- requirement anchor implies evaluated satisfaction without matching state

---

## 4.4 Requirement → Evidence Relation

| Contract Layer | Specification |
|---|---|
| SOURCE | scored matching contribution, weak evidence, Gemini sweep coverage, provenance |
| RELATION | evidence supports, weakly supports, or covers requirement |
| STATE | scored / weak / unscored sweep / missing / pending evaluation |
| VISUAL MANIFESTATION | traces connect requirement anchor to evidence source; trace grammar varies by state |
| INTERACTION | selecting trace opens temporary source aperture |
| TRANSITION | trace rises from substrate; source detail appears only while inspecting |
| PROOF | every trace must resolve to evidence ID, source URI, snippet, provenance object, or delivered Gemini reference |

Unsupported if:

- trace exists without evidence/provenance reference
- unscored sweep trace is rendered like scored evidence
- missing evidence is rendered as candidate failure

---

## 4.5 Requirement → Missing Evidence

| Contract Layer | Specification |
|---|---|
| SOURCE | requirement with no delivered support relation |
| RELATION | unresolved support dependency |
| STATE | missing evidence |
| VISUAL MANIFESTATION | open boundary facing outward; no negative mark; no red failure unless system explicitly has disqualification state |
| INTERACTION | selecting opens explanation: “no delivered support found for this requirement” |
| TRANSITION | if evidence later enters canonical system, open relation becomes trace; otherwise remains open |
| PROOF | absence must be computed from delivered support graph, not visual heuristics |

Unsupported if:

- rendered as incompetence
- rendered as failed evaluation
- rendered as zero capability

---

## 4.6 Pending Canonical Evaluation

| Contract Layer | Specification |
|---|---|
| SOURCE | missing verified capability snapshot or unevaluated matching state |
| RELATION | presentation result lacks authoritative evaluation closure |
| STATE | pending canonical evaluation |
| VISUAL MANIFESTATION | suspended boundary around relation; no closure geometry; score appears secondary or withheld |
| INTERACTION | inspection reveals authority boundary |
| TRANSITION | only canonical evaluation can close boundary |
| PROOF | boundary must be triggered by explicit evaluation availability state |

Unsupported if:

- presentation matching is shown as HR recommendation
- Gemini sweep coverage appears as canonical match
- visual closure appears without evaluation

---

# 5. PERCEPTUAL STATES

## STATE A — FIELD

### Purpose

The user perceives the complete relational ecology.

### Job Pool Field Composition

Visible:

- selected pool as the total field
- organizations as readable named regions
- roles as readable named carriers inside organizations
- existing relational structures supported by data

Not visible by default:

- technical IDs
- scores
- permanent upload UI
- requirement lists
- floating explanations
- side columns

### Spatial Rules

- Organizations cluster by actual pool membership.
- Roles remain spatially contained by organization.
- Full organization and role names must be readable.
- Non-selected entities remain present but secondary.
- Upload / selection controls collapse into a minimal field-edge aperture, not a dashboard panel.

### Acceptance

Within seconds, a new user can perceive:

1. which pool is active  
2. which organizations belong to it  
3. which roles belong to which organization  

without reading a technical panel.

---

## STATE B — ORGANIZATION

### Trigger

User selects organization carrier.

### Transformation

- selected organization moves to center
- its boundary expands
- contained roles unfold into readable spatial arrangement
- other organizations recede into depth
- pool topology remains faintly recoverable behind selected organization

### Prohibited

- no external information panel
- no floating organization card as primary interface
- no numerical summary as first-order representation

### Interaction

User may:

- select a role
- return to pool field
- inspect organization membership density
- compare role proximity within selected organization

### Acceptance

The user perceives organizational containment directly through spatial structure.

---

## STATE C — ROLE

### Trigger

User selects role carrier.

### Transformation

The role becomes the center of its constraint ecology.

Requirements emerge as independent relational anchors.

### Requirement Arrangement

Requirements organize by legitimate relation state:

- scored evidence closer to role center
- weak evidence slightly more distant, thinner coupling
- unscored sweep coverage appears as dotted exploratory outer traces
- missing evidence remains open at boundary
- pending evaluation appears suspended, not closed

No requirement list.

### Evidence Visibility

Evidence appears only as trace substrate until inspected.

### Acceptance

The user perceives:

1. what the role requires  
2. which requirements have support  
3. which have weak support  
4. which have only unscored coverage  
5. which remain open  
6. where authority prevents closure  

before reading a score.

---

## STATE D — REQUIREMENT

### Trigger

User selects requirement anchor.

### Transformation

The requirement becomes the active observation point.

Local field resolution increases.

### Visible Around Requirement

- scored evidence traces
- weak evidence traces
- unscored sweep traces
- missing support opening
- pending evaluation boundary
- provenance origins
- candidate capability references only where delivered by existing system

### Temporary Source Aperture

Textual details may appear only as an inspection aperture.

Aperture contents may include:

- evidence snippet
- source title
- provenance
- matching contribution, if scored
- sweep status, if unscored
- authority boundary statement

Aperture disappears or collapses when inspection ends.

### Acceptance

Evidence is inspectable without becoming the primary interface.

---

## STATE E — RETURN

### Trigger

User presses return, background, breadcrumb path, or keyboard back.

### Transformation

- requirement returns to role ecology
- role returns to organization topology
- organization returns to pool field
- spatial continuity is preserved
- no canonical state changes

### Acceptance

Navigation is reversible.

No selection mutates stored analysis.

---

# 6. MOTION CONTRACT

## 6.1 Allowed Motion

| Motion | Meaning |
|---|---|
| Recenter | selected entity becomes observation point |
| Unfold | contained relations become perceptible |
| Recede | unrelated entities remain present but less active |
| Trace rise | evidence relation becomes inspectable |
| Boundary suspend | canonical evaluation pending |
| Boundary close | only legitimate evaluated closure |
| Aperture open | temporary source inspection |
| Topology restore | return to preceding field state |

## 6.2 Forbidden Motion

| Motion | Reason |
|---|---|
| decorative orbit | implies nonexistent state change |
| ambient swirl | creates false relational activity |
| celebratory match animation | implies recommendation or judgment |
| pulsing without pending state | corrupts state grammar |
| glow without evidence referent | decorative symbolism |
| animated score reveal as primary | restores dashboard logic |

## 6.3 Reduced Motion Mode

All motion must degrade to:

- instant topology change
- opacity transition
- boundary state change
- trace visibility change

No meaning may depend exclusively on animation.

---

# 7. INFORMATION COMPRESSION RULE

Default perception order:

1. what exists  
2. what belongs together  
3. what connects  
4. what is supported  
5. what remains unresolved  

Secondary layers:

6. numerical score  
7. provenance detail  
8. technical identifier  
9. matching explanation  
10. authority boundary explanation  

## 7.1 Score Handling

Scores may appear only after relation visibility.

Allowed:

- score appears inside inspection aperture
- score appears after role ecology is visible
- score appears as secondary compression of visible traces

Forbidden:

- score as primary card
- score as main role label
- score as first impression
- score without trace basis

---

# 8. JOB POOL SPATIAL RECONSTRUCTION

## 8.1 Current Violation

Existing composition:

- left information column
- central galaxy
- right information column
- floating cards
- small labels
- dashboard upload affordances

Violation:

The relational field is visually subordinated to panels and summaries.

## 8.2 Replacement Composition

The entire viewport becomes the field.

### Field Layers

```ts
JobPoolFieldLayers = {
  backgroundTopology: PoolBoundary;
  organizationLayer: OrganizationRegion[];
  roleLayer: RoleCarrier[];
  relationLayer: MembershipRelation[];
  focusLayer: SelectedEntity | null;
  traceLayer: EvidenceTrace[];
  apertureLayer: TemporaryInspectionAperture | null;
  controlLayer: MinimalFieldEdgeControls;
}
```

### Organization Rendering

- each organization is a named region
- region label is full and readable
- roles are visibly contained
- visual density reflects actual number of roles, not importance
- organization region has no decorative halo unless selected

### Role Rendering

- role name is full and readable
- role is not reduced to tiny node
- role has requirement density preview only if existing requirement data exists
- preview cannot imply match quality before selection

### Pool Controls

Upload / selection remains operational but becomes edge-level affordance:

- collapsed control dock
- opens only on explicit action
- never permanently occupies primary field
- never competes with relational topology

---

# 9. JOB FIELD SPATIAL RECONSTRUCTION

## 9.1 Role-Centered Constraint Ecology

When a role is selected:

```ts
RoleField = {
  roleCarrier: Role;
  requirementAnchors: Requirement[];
  evidenceTraces: EvidenceTrace[];
  authorityBoundaries: AuthorityBoundary[];
  unresolvedOpenRelations: OpenRelation[];
  priorContext: PoolOrganizationContext;
}
```

## 9.2 Requirement Placement

Requirement anchor position is determined by available state:

```ts
requirementDistance =
  baseRequirementRadius
  + missingEvidenceOffset
  + pendingEvaluationOffset
  - scoredEvidencePull
  - weakEvidencePull
```

But visual grammar must preserve category differences:

- scored evidence: stable continuous trace
- weak evidence: thin continuous trace
- sweep coverage: dotted exploratory trace
- missing evidence: no trace, open boundary
- pending evaluation: suspended boundary

## 9.3 Requirement Labeling

Requirement labels must be readable.

If label is long:

- wrap label
- allow progressive expansion
- preserve semantic content
- do not truncate as primary display

Truncation is permitted only in deep background states.

---

# 10. CAPABILITY TREATMENT

## 10.1 Within Authorized Job/Pool Scope

Capabilities may appear only where existing system provides relation to:

- evidence
- matching contribution
- requirement support
- Gemini-discovered coverage
- candidate analysis object

## 10.2 Visual Forms

| Capability State | Manifestation |
|---|---|
| scored contribution | capability reference appears attached to scored evidence trace |
| weak contribution | capability reference appears as low-intensity support node |
| sweep-only discovery | capability reference appears as exploratory dotted association |
| absent canonical snapshot | capability closure prohibited |
| missing support | no capability-negative symbol |

## 10.3 Boundary

Do not reconstruct protected Capability Field chrome.

Do not present Job Pool matching as completed authoritative capability evaluation.

---

# 11. AUTHORITY GRAMMAR

Authority is not a label.  
Authority constrains visual closure.

## 11.1 Authority Boundary Types

| Boundary | Meaning |
|---|---|
| Open boundary | unresolved / insufficient support |
| Suspended boundary | pending canonical evaluation |
| Dotted boundary | sweep-only / unscored coverage |
| Thin closed boundary | weak support exists but insufficient closure |
| Stable closed boundary | scored support exists within delivered matching semantics |
| No HR seal | no HR recommendation produced |

## 11.2 Prohibited Authority Implications

Never display:

- checkmark meaning verified capability unless system provides verification
- medal / badge implying endorsement
- “fit” seal implying HR recommendation
- closed requirement if only sweep coverage exists
- failure mark for missing evidence

---

# 12. HANDLING ABSENT OR INSUFFICIENT DATA

## 12.1 Missing Evidence

Visual:

- open relation
- no trace
- no negative judgment
- inspectable explanation

Text, only when inspected:

> No delivered support is available for this requirement in the current analysis.

## 12.2 Weak Evidence

Visual:

- thin trace
- weak coupling
- no closure

Text, only when inspected:

> Evidence exists but contributes limited matching support.

## 12.3 Unscored Sweep Coverage

Visual:

- dotted trace
- exploratory position
- separated from scored evidence layer

Text, only when inspected:

> Gemini Discovery identified possible coverage, but this has not entered canonical matching evaluation.

## 12.4 Pending Canonical Evaluation

Visual:

- suspended boundary
- no closure
- score secondary or absent

Text, only when inspected:

> Authoritative evaluation has not occurred for this relation.

## 12.5 Unsupported Manifestations

Explicitly unsupported unless data exists:

- temporal drift
- market saturation
- contradiction state
- verified authority seal
- HR recommendation
- canonical capability evaluation closure
- incompetence marker
- confidence score for unscored sweep coverage

---

# 13. INTERACTION BEHAVIOR

## 13.1 Selection

Selection reorganizes topology.

It does not open a panel.

```ts
onSelect(entity) {
  setObservationPoint(entity);
  computeRelationNeighborhood(entity);
  increaseResolution(relevantRelations);
  recede(unrelatedRelations);
  preserveReturnTopology(previousState);
}
```

## 13.2 Inspection

Inspection increases local resolution.

```ts
onInspect(relationOrTrace) {
  showTraceOrigin();
  showAuthorityBoundary();
  openTemporaryAperture(sourceDetails);
}
```

## 13.3 Return

Return restores previous topology.

```ts
onReturn() {
  closeApertures();
  restorePreviousFieldTopology();
  preserveCanonicalData();
}
```

## 13.4 Keyboard / Accessibility

Required:

- tab navigation through visible carriers
- enter selects
- escape returns
- reduced motion support
- readable labels
- non-color-dependent state encoding
- screen reader summaries generated from same state objects

---

# 14. IMPLEMENTATION INTEGRATION POINTS

## 14.1 Required Data Access

The field renderer requires read-only access to:

```ts
CondynVisualInput = {
  jobPools: JobPool[];
  organizations: Organization[];
  roles: Role[];
  requirements: Requirement[];
  requirementRelations: RoleRequirementRelation[];
  evidenceItems: EvidenceItem[];
  provenanceItems: ProvenanceItem[];
  matchingContributions: MatchingContribution[];
  geminiSweepCoverage: GeminiSweepCoverage[];
  authorityStates: AuthorityState[];
  evaluationStates: EvaluationState[];
  scores?: Score[];
}
```

## 14.2 Required Derived View Model

Create a presentation-only adapter:

```ts
SemioticFieldViewModel = {
  entities: FieldEntity[];
  relations: FieldRelation[];
  states: RelationalState[];
  visualSigns: VisualSign[];
  transitions: FieldTransition[];
  proofRefs: ProofReference[];
}
```

This adapter must not persist new canonical facts.

## 14.3 Visual Sign Object

```ts
VisualSign = {
  id: string;
  sourceRef: ProofReference;

  source:
    | "canonical_entity"
    | "matching_contribution"
    | "gemini_sweep"
    | "evidence"
    | "provenance"
    | "authority_state"
    | "evaluation_state";

  relation:
    | "contains"
    | "requires"
    | "supports"
    | "weakly_supports"
    | "covers_unscored"
    | "missing_support"
    | "pending_evaluation";

  state:
    | "field"
    | "organization_selected"
    | "role_selected"
    | "requirement_selected"
    | "receded"
    | "inspectable";

  manifestation:
    | "carrier"
    | "region"
    | "anchor"
    | "trace_stable"
    | "trace_thin"
    | "trace_dotted"
    | "open_boundary"
    | "suspended_boundary"
    | "temporary_aperture";

  interaction:
    | "select"
    | "inspect"
    | "return"
    | "none";

  transition:
    | "recenter"
    | "unfold"
    | "recede"
    | "trace_rise"
    | "boundary_suspend"
    | "restore";

  proof: {
    entityId?: string;
    relationId?: string;
    evidenceId?: string;
    provenanceId?: string;
    matchingContributionId?: string;
    sweepId?: string;
    authorityStateId?: string;
    evaluationStateId?: string;
  };
}
```

---

# 15. ACCEPTANCE CRITERIA

## 15.1 Semantic Acceptance

Pass conditions:

- every visual sign has proof reference
- no decorative relation lines
- no unsupported closure
- no missing evidence rendered as failure
- sweep coverage visually distinct from scored evidence
- pending evaluation visually distinct from scored relation
- numerical score never precedes visible relation basis
- authority boundary controls closure

Fail conditions:

- a card becomes the primary interface
- a side column explains what field should show
- a requirement list replaces requirement anchors
- a score appears before relation structure
- a capability appears verified without authority
- visual grouping lacks data referent

## 15.2 Perceptual Acceptance

A first-time user must be able to perceive without terminology:

- what belongs together
- what connects
- what has support
- what remains open
- what changes when selected

## 15.3 Engineering Acceptance

Required tests:

```ts
test("each visual sign has source proof");
test("missing evidence never renders failure state");
test("sweep coverage never renders scored trace");
test("pending evaluation prevents closure");
test("score is secondary to relation field");
test("organization selection recenters and recedes others");
test("role selection renders requirements as anchors, not list");
test("requirement selection reveals evidence traces");
test("return restores previous topology");
test("reduced motion preserves meaning");
```

---

# 16. GRÜN / GELB / PINK IMPLEMENTATION BOUNDARIES

## 16.1 GRÜN — Safe Presentation Reconstruction

Allowed:

- replace side-column-dominant layout with full-field canvas
- create read-only semiotic view model
- render organizations as regions
- render roles as readable carriers
- render role requirements as anchors
- render evidence as traces
- render missing evidence as open relation
- render sweep coverage as dotted trace
- render pending evaluation as suspended boundary
- add reversible selection states
- add reduced-motion behavior
- add acceptance tests for visual-state mapping

No database changes.  
No algorithm changes.  
No production deployment required.

## 16.2 GELB — Requires Contract Verification

Allowed only after inspecting actual repository contracts:

- binding Gemini sweep fields to visual traces
- binding matching contribution strength to trace thickness
- binding authority states to closure boundaries
- replacing existing upload chrome with edge aperture
- integrating keyboard/screen-reader summaries
- removing or demoting existing floating cards
- introducing role/requirement spatial layout engine

Requires targeted regression tests.

## 16.3 PINK — Requires Separate Authorization

Not authorized here:

- modifying Capability Field sealed chrome
- changing canonical matching formulas
- changing Gemini Discovery / Convergence logic
- changing database schema
- changing persisted analysis format
- changing authority classification
- changing production infrastructure
- deploying to production
- creating new evaluation semantics
- inventing HR recommendation layer
- destructive database operations

---

# 17. MATERIAL REPLACEMENT RULES

## Replace

```txt
left info column + central visualization + right info column
```

with:

```txt
full-field relational topology + temporary inspection apertures
```

## Replace

```txt
floating role card with requirement list
```

with:

```txt
role-centered constraint ecology with requirement anchors
```

## Replace

```txt
numerical match summary as primary object
```

with:

```txt
visible support traces + secondary score aperture
```

## Replace

```txt
tiny truncated nodes
```

with:

```txt
readable carriers with full primary names
```

## Replace

```txt
decorative orbital motion
```

with:

```txt
selection-driven topology transformation
```

## Replace

```txt
upload dashboard block
```

with:

```txt
minimal field-edge operational aperture
```

---

# 18. FINAL IMPLEMENTATION DIRECTIVE

Build a read-only semiotic presentation adapter over existing CONDYN truth.

The adapter receives canonical entities, relations, evidence, provenance, matching contributions, Gemini sweep coverage, authority states and evaluation states.

It emits only:

- field entities
- field relations
- visual signs
- transitions
- proof references

The renderer may transform perception.

It may not transform truth.

The final interface must allow a user to enter CONDYN and perceive:

- what exists
- what belongs together
- what connects
- what is supported
- what remains open
- what changes when selected

without first reading terminology.

The field reorganizes.  
The observer understands.  
Language follows only when needed.

STRUCTURE → RELATION → STATE → PERCEPTION → INTERPRETATION
