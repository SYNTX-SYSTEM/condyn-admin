# ConDyn Admin Architecture

## Purpose

ConDyn stores and analyzes structural organizational data.

The system is designed to process:

- organizational events
- operational signals
- structural relations
- workflow pressure
- authority changes
- process instability
- reporting topology

The platform does NOT focus on individual surveillance.

The focus is structural analysis of organizational systems.

---

## Storage Philosophy

ConDyn separates data into:

1. transient source artifacts
2. persistent structural abstractions

Goal:

- minimize personal data storage
- reduce GDPR exposure
- preserve structural topology
- allow organizational analysis without persistent human communication storage

Preferred persistence model:

```txt
RAW INPUT
→ EVENT
→ SIGNAL
→ LINK
→ NETWORK
````

Raw communication artifacts should be temporary whenever possible.

---

## Privacy Model

ConDyn follows these principles:

* data minimization
* pseudonymization
* event abstraction
* retention control
* EU-first storage philosophy

Preferred long-term storage:

* events
* signals
* network relations
* aggregated metrics

Avoided long-term storage:

* raw emails
* direct personal communication
* personal identifiers
* sensitive employee information

---

## Current Repository Structure

```txt
data/
  companies/
    <company>/
      metadata/
      artifacts/
      events/
      analysis/
```


---

## Artifact Model

Artifacts are raw or semi-raw organizational inputs.

Examples:

- emails
- meetings
- tickets
- incident reports
- policy documents
- KPI exports
- chat logs

Artifacts may contain sensitive or personal information.

Preferred architecture:

    artifact ingestion
    → structural extraction
    → event generation
    → signal generation
    → raw artifact expiration

Artifacts should support configurable retention policies.

---

## Event Model

Events are normalized structural representations extracted from artifacts.

Events describe:

- deadline changes
- approval path changes
- escalation events
- reporting instability
- process interruptions
- authority centralization
- compliance transitions

Events are persistent by default.

Example:

    {
      "event_type": "approval_path_centralized",
      "from": ["Manager", "Team Lead"],
      "to": ["VP Operations"]
    }

---

## Signal Model

Signals are higher-order structural detections generated from events and metrics.

Signals may describe:

- authority concentration
- workflow pressure
- bottleneck formation
- delay propagation
- compliance instability
- escalation density

Signals should not contain personal communication.

Signals are intended for:

- topological field visualization
- structural clustering
- temporal replay
- heatmaps
- topology analysis

---

## Retention Philosophy

Preferred retention strategy:

    RAW ARTIFACTS
    → temporary

    EVENTS
    → persistent

    SIGNALS
    → persistent

    NETWORKS
    → persistent

    AGGREGATED METRICS
    → persistent

Recommended future feature:

- configurable retention per company
- automatic raw artifact expiration
- irreversible pseudonymization
- audit-safe deletion workflows


---

# SYSTEM FLOW

ConDyn is not designed as a traditional database system.

The platform operates as a structural topology engine.

Primary flow:

    SOURCE INPUT
    → STRUCTURAL EXTRACTION
    → EVENT GENERATION
    → ATOMIC SIGNAL PROJECTION
    → RELATION LINKING
    → RECURSIVE FIELD TOPOLOGY
    → VISUAL STRUCTURE RENDERING

The platform does not optimize for document storage.

The platform optimizes for:

- structural visibility
- relation density
- signal propagation
- organizational topology
- drift visibility
- authority flow
- pressure mapping

---

# FRONTEND PHILOSOPHY

The frontend is not a dashboard-first architecture.

The frontend is a structural visualization layer.

Primary purpose:

- render organizational topology
- display event propagation
- visualize structural pressure
- display relation density
- render signal clusters
- replay structural changes over time

Future rendering targets:

- recursive field projections
- temporal replay systems
- relation heatmaps
- structural drift overlays
- authority concentration maps
- bottleneck visualization

---

# PRIVACY-FIRST STRUCTURAL MODEL

ConDyn intentionally separates:

    HUMAN COMMUNICATION
    from
    STRUCTURAL REPRESENTATION

Preferred long-term persistence:

- events
- signals
- relations
- topology
- anonymized metrics

Avoided long-term persistence:

- direct communication
- emotional content
- personal conversations
- unnecessary PII

Goal:

preserve structure
without preserving human intimacy

---

# CURRENT DATA LAYERS

    LAYER 1
    raw artifacts

    LAYER 2
    normalized events

    LAYER 3
    structural signals

    LAYER 4
    relational perturbations

    LAYER 5
    recursive field topology

    LAYER 6
    visual rendering

---

# FUTURE EXTENSIONS

Potential future integrations:

- Slack
- Jira
- GitHub
- SAP
- CRM systems
- ERP systems
- Meeting systems
- PDF ingestion
- CSV ingestion
- API ingestion

All future integrations should follow:

    INPUT
    → EVENT
    → SIGNAL
    → NETWORK

Never:

    INPUT
    → permanent raw surveillance storage


---

# DATA LIFECYCLE

ConDyn treats organizational data as flowing structural material.

The system is designed around transformation, not accumulation.

Lifecycle model:

    INGESTION
    → PARSING
    → STRUCTURAL EXTRACTION
    → EVENT GENERATION
    → ATOMIC SIGNAL PROJECTION
    → NETWORK FORMATION
    → VISUALIZATION
    → RETENTION / EXPIRATION

Preferred lifecycle behavior:

    RAW DATA
    → minimized lifetime

    STRUCTURAL EVENTS
    → persistent lifetime

    AGGREGATED NETWORKS
    → long-term topology storage

Goal:

retain structure
minimize personal exposure

---

# ADMIN SYSTEM

Current administrative frontend:

    admin.condyn.eu

Purpose of admin system:

- manage simulated companies
- inspect structural datasets
- validate ingestion pipelines
- inspect event generation
- inspect signal generation
- validate recursive field topology
- prepare future visualization layers

The admin system is currently operating as:

    structural simulation environment

not:

    production surveillance infrastructure

---

# STRUCTURAL PRINCIPLE

ConDyn does not primarily model people.

ConDyn models:

- transitions
- pressure propagation
- authority movement
- instability formation
- structural bottlenecks
- relation density
- event topology

The persistent object is not the human.

The persistent object is the structure.

---

# LONG-TERM VISION

Long-term goal:

Create a structural topology engine capable of:

- organizational replay
- drift visualization
- structural anomaly detection
- topology compression
- relation forecasting
- pressure propagation analysis
- authority concentration analysis

while remaining compatible with:

- EU privacy requirements
- GDPR principles
- retention constraints
- pseudonymization requirements
- enterprise governance expectations


---

# STRUCTURAL REFERENCES

ConDyn is influenced by multiple structural and topology-oriented architectural directions.

Relevant reference domains include:

- relational topology systems
- distributed topology
- process mining
- structural visualization
- relational topology projection
- recursive field dynamics
- relational signal propagation
- topology compression
- systems rendering

Important conceptual reference environments include:

    terrain-based system modeling
    relation-density mapping
    structural replay environments
    distributed signal propagation
    topology-preserving recursive architectures

External structural inspiration and topology research references:

    https://www.celonis.com/
    https://admin.condyn.eu/

These references are not copied systems.

They are part of the broader structural ecosystem informing ConDyn architecture direction.

---

# CORE STRUCTURAL ASSUMPTION

Organizations behave as dynamic relational fields.

Structural instability propagates through:

- deadlines
- authority paths
- approval compression
- escalation chains
- bottlenecks
- process drift
- relation density shifts

ConDyn attempts to render these dynamics visible as topology.


---

# PRIVACY ARCHITECTURE REFERENCES

ConDyn follows a structural privacy direction aligned with:

- event abstraction
- data minimization
- pseudonymization
- retention control
- structural over personal persistence
- topology-level analysis instead of individual surveillance

Relevant structural privacy reference environments:

    https://www.celonis.com/legal/trust-center/privacy
    https://docs.celonis.com/en/data-security.html
    https://admin.condyn.eu/

Important architectural direction:

    HUMAN COMMUNICATION
    → transient

    STRUCTURAL EVENTS
    → persistent

    STRUCTURAL SIGNALS
    → persistent

    RECURSIVE FIELD TOPOLOGY
    → persistent

Core assumption:

Persistent storage should preserve:

- structure
- topology
- event propagation
- relation density
- authority movement

without permanently preserving:

- personal communication
- emotional expression
- unnecessary identity information
- private interpersonal context

ConDyn attempts to minimize human exposure
while maximizing structural visibility.

