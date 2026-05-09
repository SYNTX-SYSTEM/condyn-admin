# ConDyn Schema Reference

## Purpose

This document defines the canonical structural schema of the ConDyn system.

The schema reference acts as the persistent topology contract between:

- data ingestion
- Admin frontend
- structural extraction
- signal generation
- graph rendering
- replay systems
- visualization systems
- future APIs
- future AI extraction systems

This document should remain structurally stable.

Implementation may evolve.

The topology contract should remain coherent.

---

# DOCUMENT STRUCTURE

1. Core Structural Philosophy
2. Global Repository Structure
3. Company Topology Structure
4. Metadata Layer
5. Artifact Layer
6. Event Layer
7. KPI Layer
8. Signal Layer
9. Link Layer
10. Network Layer
11. Structural Flow
12. Retention Role
13. Graph Role
14. Visualization Role
15. Admin Rendering Role
16. Future Extensions



---

# 1. Core Structural Philosophy

ConDyn models organizations as dynamic structural fields.

The system does not primarily persist:

- conversations
- personalities
- interpersonal narratives

The system primarily persists:

- transitions
- propagation
- topology
- density
- bottlenecks
- escalation
- structural pressure
- authority movement

The goal is not surveillance.

The goal is structural visibility.

Core transformation principle:

    RAW INPUT
    -> STRUCTURAL EXTRACTION
    -> EVENT GENERATION
    -> SIGNAL EMERGENCE
    -> TOPOLOGY FORMATION

The persistent object is not the human.

The persistent object is the structure.

---

# 2. Global Repository Structure

Current repository root:

    /opt/condyn-admin

Current structural repository layout:

    data/
      companies/
      schemas/

    docs/
      architecture/
      implementation/
      pipelines/
      privacy/
      schema/
      topology/
      visualization/

Purpose of major root domains:

    data/
    = persistent structural topology objects

    docs/
    = canonical architecture and ontology layer

---

# 3. Company Topology Structure

Each company represents an isolated organizational topology package.

Current implemented companies:

- NovaScale AI
- HelixBank Europe
- MedCore Health Systems

Every company follows the same canonical structure:

    company/
      company.json
      metadata/
      artifacts/
      events/
      analysis/

Meaning of structural layers:

    company.json
    = root organizational identity

    metadata/
    = organizational hierarchy topology

    artifacts/
    = transient or semi-transient source material

    events/
    = normalized structural transitions

    analysis/
    = signals, links, networks and topology outputs

Each company package should remain structurally compatible with:

- Admin rendering
- graph rendering
- replay systems
- signal extraction
- topology visualization
- future APIs

---

# Company Archetype Model

Current companies intentionally represent different structural propagation archetypes.

NovaScale AI:

    operational compression topology

HelixBank Europe:

    compliance escalation topology

MedCore Health Systems:

    healthcare operational instability topology

The purpose of multiple archetypes is to simulate:

- different propagation grammars
- different bottleneck mechanics
- different authority structures
- different escalation behaviors
- different topology densities



---

# 4. Metadata Layer

Metadata defines organizational hierarchy topology.

Metadata objects describe:

- reporting structure
- authority paths
- escalation chains
- department topology
- structural layering

Current metadata object:

    org_structure.json

Current metadata location:

    company/metadata/

Example role structure:

    ROLE
    -> reports_to
    -> department
    -> authority chain

Purpose of metadata layer:

    define organizational topology before propagation begins

Metadata is considered:

    relatively stable structural context

not:

    rapidly changing operational state

---

# 5. Artifact Layer

Artifacts represent transient or semi-transient organizational input.

Artifacts are source material for structural extraction.

Artifacts may include:

- emails
- meetings
- tickets
- incidents
- audits
- compliance reports
- shift logs
- KPI exports
- policy documents
- chat logs

Current artifact locations:

    company/artifacts/emails/
    company/artifacts/meetings/
    company/artifacts/incidents/
    company/artifacts/kpis/
    company/artifacts/chat_logs/
    company/artifacts/compliance/
    company/artifacts/shift_logs/

Artifacts are NOT the final persistent topology object.

Artifacts exist to generate:

- events
- KPIs
- signals
- topology relations

Preferred artifact lifecycle:

    temporary
    transient
    retention-controlled

Important structural principle:

    artifacts are ingestion material

not:

    surveillance archives

---

# 6. Event Layer

Events represent normalized structural transformations.

Events are generated from artifacts.

Events describe:

- approval changes
- escalation transitions
- workflow interruptions
- staffing overload
- reporting instability
- deadline hardening
- authority centralization
- bottleneck emergence

Current event location:

    company/events/

Structural role of events:

    convert organizational activity
    into topology transitions

Events are persistent because they represent:

- structural movement
- propagation states
- organizational change

Example event flow:

    EMAIL
    -> escalation request
    -> EVENT
    -> authority centralization

Events are considered:

    topology-active structural objects



---

# 7. KPI Layer

KPIs represent aggregated operational topology metrics.

KPIs emerge from:

- artifacts
- events
- operational density
- propagation behavior

KPIs transform organizational activity into measurable structural pressure.

Current KPI location:

    company/artifacts/kpis/

Current KPI examples:

- delay rate
- escalation density
- workflow instability
- turnover pressure
- staffing overload
- compliance fatigue
- bottleneck probability

Structural role of KPIs:

    bridge events
    with
    signal emergence

KPIs are persistent because they represent:

- aggregated topology behavior
- operational pressure states
- measurable instability

Important structural principle:

    KPIs measure topology behavior

not:

    personal performance scoring

---

# 8. Signal Layer

Signals represent higher-order structural detections.

Signals emerge from:

- events
- KPIs
- propagation density
- relation concentration
- escalation accumulation

Signals describe:

- authority centralization
- workflow compression
- bottleneck formation
- staffing instability
- compliance fatigue
- escalation clustering
- propagation overload

Current signal location:

    company/analysis/signals/

Signals are considered:

    topology interpretation objects

Signals are graph-active.

Signals may later influence:

- graph clustering
- replay intensity
- topology density
- structural gravity
- propagation rendering

Important structural principle:

    signals describe organizational fields

not:

    psychological profiling

---

# 9. Link Layer

Links define directed structural relations.

Links connect:

- artifacts
- events
- KPIs
- signals
- network states

Current link location:

    company/analysis/links/

Link properties may include:

- source
- target
- relation
- timestamp
- propagation weight
- structural intensity

Structural role of links:

    transform isolated objects
    into connected topology

Links represent:

- propagation paths
- escalation flow
- dependency movement
- authority flow
- structural coupling

Without links:

    topology cannot emerge

---

# 10. Network Layer

Networks represent aggregated organizational topology state.

Current network location:

    company/analysis/network.json

Networks aggregate:

- nodes
- edges
- signals
- topology characteristics
- propagation states
- density indicators

Current topology characteristic examples:

- authority centralization
- workflow instability
- staffing pressure
- compliance density
- bottleneck probability
- turnover pressure

Networks represent:

    the current structural field state
    of one organization

Networks are visualization-ready topology objects.

Networks may later support:

- replay systems
- graph rendering
- propagation simulation
- topology forecasting
- drift analysis

Important structural principle:

    the network is the persistent topology state



---

# 11. Structural Flow

ConDyn operates as a structural transformation engine.

Primary system flow:

    ARTIFACT
    -> EVENT
    -> KPI
    -> SIGNAL
    -> LINK
    -> NETWORK
    -> VISUAL TOPOLOGY

Each layer increases structural abstraction.

Transformation behavior:

    RAW INPUT
    -> contextual meaning

    EVENT
    -> structural transition

    KPI
    -> measurable pressure

    SIGNAL
    -> topology interpretation

    LINK
    -> propagation relation

    NETWORK
    -> aggregated field state

Structural flow objective:

    transform organizational activity
    into visible topology dynamics

---

# 12. Retention Role

Retention behavior is layer-dependent.

Different topology layers have different persistence requirements.

Preferred retention hierarchy:

    ARTIFACTS
    -> shortest lifetime

    EVENTS
    -> persistent

    SIGNALS
    -> persistent

    LINKS
    -> persistent

    NETWORKS
    -> persistent

Retention objective:

    preserve topology
    minimize unnecessary human exposure

Preferred long-term persistence:

- structural relations
- topology density
- propagation states
- aggregated organizational behavior

Avoided long-term persistence:

- unnecessary raw communication
- emotional content
- interpersonal reconstruction
- identity-centric surveillance

---

# 13. Graph Role

The graph layer represents dynamic organizational topology.

The graph is not an additional visualization feature.

The graph is the structural persistence model itself.

Graph nodes may include:

- events
- signals
- workflows
- escalation zones
- bottlenecks
- organizational units

Graph edges may represent:

- propagation
- escalation
- authority movement
- dependency flow
- instability transfer
- structural coupling

Graph objective:

    render organizational movement dynamically

Future graph systems may support:

- force-directed topology
- topology replay
- drift evolution
- bottleneck emergence
- propagation simulation

---

# 14. Visualization Role

Visualization converts topology into visible structural movement.

Visualization objectives:

- reveal propagation
- reveal density
- reveal escalation
- reveal bottlenecks
- reveal authority concentration
- reveal instability

Visualization should prioritize:

- topology
- movement
- pressure
- propagation

not:

- interpersonal surveillance

Potential visualization systems:

- graph rendering
- force-directed systems
- propagation heatmaps
- replay timelines
- drift overlays
- density clustering

Visualization role:

    transform invisible organizational dynamics
    into visible structural fields

---

# 15. Admin Rendering Role

The Admin frontend is a topology inspection environment.

Primary frontend:

    admin.condyn.eu

The Admin should eventually support:

- company overview rendering
- topology inspection
- signal inspection
- propagation replay
- graph visualization
- event navigation
- structural filtering
- density visualization

The Admin is not intended as:

    employee surveillance software

The Admin is intended as:

    structural topology interface

Admin rendering should prioritize:

- abstraction
- topology visibility
- propagation clarity
- structural coherence

---

# 16. Future Extensions

Potential future system extensions:

- live ingestion pipelines
- Slack ingestion
- Jira ingestion
- GitHub ingestion
- SAP ingestion
- CRM ingestion
- replay systems
- topology forecasting
- drift detection
- anomaly detection
- propagation simulation
- topology compression

Future architecture principle:

    all future systems
    must remain topology-compatible

Core long-term objective:

Create a continuously evolving structural topology engine
capable of rendering organizational movement,
pressure and instability
as dynamic relational fields.

