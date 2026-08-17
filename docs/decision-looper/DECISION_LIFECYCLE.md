# The Decision Lifecycle

The core operational reality of CONDYN is the transition of knowledge into action, and action into learning. This is managed through a strict, seven-stage, forward-only artifact lifecycle.

## The 7 Stages

1. **Recommendation (`lib/career/matching/`)**
   - The computed suggestion based on the current Canonical Graph and Active Policy.
   - Example: *System recommends Role X (Fit: 0.8, Explainability: 0.8).*

2. **Decision (`lib/career/decisions/decision.ts`)**
   - A human or automated agent captures a Recommendation and decides whether to act on it (Accept/Reject).
   - Contains a frozen snapshot of the Recommendation for historical integrity.

3. **Commitment (`lib/career/decisions/action.ts`)**
   - The intent to act on the Decision.

4. **Action (`lib/career/decisions/action.ts`)**
   - The physical execution of the intent.

5. **Outcome (`lib/career/decisions/outcome.ts`)**
   - The observable state of the world following an Action.
   - Example: *Interview Invitation Received.* (Outcomes are objective, not subjective.)

6. **Feedback (`lib/career/decisions/feedback.ts`)**
   - A subjective or metric-based Evaluation (Desirable, Undesirable, Neutral) applied to an Outcome.

7. **Attribution (`lib/career/decisions/feedback.ts`)**
   - Linking the Feedback back to the original graph properties (e.g., Requirement, Capability) to form the base of Learning signals.

## Learning & Policy Feedback Loop
Once Attributions are established, the Learning Pipeline generates **Learning Proposals**. These are counterfactual simulations that propose new **Policy Versions** (adjusting minimum fit, explainability constraints, etc.) and replay historical traces. If validated, a Policy is **Promoted** to Active, altering future Recommendations, completing the macro-loop without mutating historical truth.
