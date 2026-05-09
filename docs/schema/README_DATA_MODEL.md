# ConDyn Data Model

## Structural Philosophy

ConDyn stores organizational topology as layered structural objects.

The system separates:

    RAW INPUT
    from
    STRUCTURAL REPRESENTATION

Persistent storage prioritizes:

- events
- signals
- relations
- topology
- aggregated structural metrics

---

# CURRENT OBJECT TYPES

Current implemented object layers:

    COMPANY
    ROLE
    ARTIFACT
    EVENT
    KPI
    SIGNAL
    LINK
    NETWORK

---

# COMPANY OBJECT

Purpose:

    represents organizational root node

Example:

    company.json

Core fields:

- company_id
- name
- industry
- size
- region
- simulation
- created_at

---

# ROLE OBJECT

Purpose:

    represents organizational hierarchy topology

Example:

    org_structure.json

Core fields:

- role_id
- title
- department
- reports_to

Role objects define:

- authority topology
- reporting structure
- escalation paths
- organizational layering

---

# ARTIFACT OBJECT

Purpose:

    represents transient or semi-transient organizational input

Examples:

- email
- meeting
- ticket
- incident
- audit
- KPI export
- policy document

Artifacts may contain sensitive information.

Preferred lifecycle:

    transient

---

# EVENT OBJECT

Purpose:

    normalized structural transformation layer

Events represent:

- approval changes
- deadline changes
- escalation events
- authority movement
- instability transitions
- workflow interruptions

Events are persistent.

---

# KPI OBJECT

Purpose:

    aggregated operational metrics

Examples:

- delay rate
- escalation density
- approval load
- instability metrics
- turnover risk
- workflow pressure

KPIs connect:

    events
    ↔
    structural signals

---

# SIGNAL OBJECT

Purpose:

    higher-order structural detections

Examples:

- authority centralization
- bottleneck formation
- workflow pressure
- drift propagation
- compliance instability

Signals are topology-oriented abstractions.

Signals should avoid direct personal information.

---

# LINK OBJECT

Purpose:

    directed structural relation layer

Links connect:

- artifacts
- events
- KPIs
- signals
- networks

Supported relation properties:

- direction
- weight
- timestamp
- relation type

---

# NETWORK OBJECT

Purpose:

    aggregated organizational topology layer

Network objects represent:

- structural propagation
- relation density
- event topology
- signal topology
- organizational graph state

Network objects are intended for:

- graph rendering
- topology replay
- structural visualization
- heatmaps
- propagation analysis

---

# CURRENT TOPOLOGY FLOW

Current implemented structural pipeline:

    ARTIFACT
    → EVENT
    → KPI
    → SIGNAL
    → LINK
    → NETWORK

---

# FUTURE MODEL EXTENSIONS

Potential future objects:

- topology snapshots
- replay frames
- temporal clusters
- drift vectors
- topology fingerprints
- anomaly maps
- structural forecasts

