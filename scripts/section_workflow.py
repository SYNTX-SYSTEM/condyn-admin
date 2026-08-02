"""
CONDYN Section-Based Workflow & Structural Completeness Engine
FastAPI / Anthropic Analyzer Implementation for Port 8002 (/opt/condyn-analyzer)
"""

from __future__ import annotations
import os
import re
import uuid
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("condyn.analyzer")
logger.setLevel(logging.INFO)

# ============================================================================
# 1. MANDATORY DEEP SWEEP SECTIONS
# ============================================================================

MANDATORY_SECTIONS = [
    "LEVEL A",
    "Source Register",
    "Evidence Ledger",
    "Capability Qualification",
    "Demonstrated Capability Architecture",
    "Capability Consolidation",
    "Problem Map",
    "Domain Map",
    "Institution Map",
    "Task Map",
    "Role Map",
    "Search Query Library",
    "Organization Map",
    "Hidden Opportunity Map",
    "Structural Resonance Ranking",
    "Entry Strategies",
    "Provisional Branches",
    "Excluded Branches",
    "Contradictions",
    "Evidence Limits",
]

SECTION_GROUPS = [
    {
        "name": "Phase 1: Core Capability Qualification",
        "sections": [
            "LEVEL A",
            "Source Register",
            "Evidence Ledger",
            "Capability Qualification",
            "Demonstrated Capability Architecture",
            "Capability Consolidation"
        ],
        "instruction": "Generate ONLY Phase 1: LEVEL A, Source Register, Evidence Ledger, Capability Qualification, Demonstrated Capability Architecture, and Capability Consolidation."
    },
    {
        "name": "Phase 2: Entity & Domain Mapping",
        "sections": [
            "Problem Map",
            "Domain Map",
            "Institution Map",
            "Task Map",
            "Role Map"
        ],
        "instruction": "Generate ONLY Phase 2: Problem Map, Domain Map, Institution Map, Task Map, and Role Map. Do not repeat Phase 1."
    },
    {
        "name": "Phase 3: Search Queries & Strategy",
        "sections": [
            "Search Query Library",
            "Organization Map",
            "Hidden Opportunity Map",
            "Structural Resonance Ranking",
            "Entry Strategies"
        ],
        "instruction": "Generate ONLY Phase 3: Search Query Library, Organization Map, Hidden Opportunity Map, Structural Resonance Ranking, and Entry Strategies. Do not repeat previous phases."
    },
    {
        "name": "Phase 4: Decision Branches & Integrity Limits",
        "sections": [
            "Provisional Branches",
            "Excluded Branches",
            "Contradictions",
            "Evidence Limits"
        ],
        "instruction": "Generate ONLY Phase 4: Provisional Branches, Excluded Branches, Contradictions, and Evidence Limits. Finish with the Final Integrity Check."
    }
]

# ============================================================================
# 2. HELPER FUNCTIONS FOR STOP REASON & TEXT EXTRACTION
# ============================================================================

def get_stop_reason(response: Any) -> str:
    """
    Extract stop/finish reason across different SDK wrappers:
    Anthropic, OpenAI, Google Gemini, and custom dict wrappers.
    """
    if isinstance(response, dict):
        return (
            response.get("stop_reason")
            or response.get("finish_reason")
            or response.get("stopReason")
            or "unknown"
        )

    # Check direct attributes
    for attr in ["stop_reason", "finish_reason", "stopReason"]:
        val = getattr(response, attr, None)
        if val is not None:
            return str(val)

    # Check candidates / choices if present
    choices = getattr(response, "choices", None)
    if choices and len(choices) > 0:
        val = getattr(choices[0], "finish_reason", None) or getattr(choices[0], "stop_reason", None)
        if val is not None:
            return str(val)

    candidates = getattr(response, "candidates", None)
    if candidates and len(candidates) > 0:
        val = getattr(candidates[0], "finishReason", None)
        if val is not None:
            return str(val)

    return "unknown"

def extract_text(response: Any) -> str:
    """Extract all text blocks from an Anthropic or OpenAI or dict response."""
    if isinstance(response, dict):
        if "text" in response:
            return response["text"]
        if "content" in response and isinstance(response["content"], str):
            return response["content"]
        if "choices" in response:
            return response["choices"][0]["message"]["content"]

    content = getattr(response, "content", None)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts = []
        for block in content:
            if getattr(block, "type", None) == "text" or hasattr(block, "text"):
                text_parts.append(getattr(block, "text", ""))
        return "".join(text_parts)

    return ""

def validate_completeness(full_text: str) -> tuple[bool, list[str]]:
    """
    Structural completeness validator.
    Ensures all mandatory headings exist in full_text.
    """
    missing = []
    text_upper = full_text.upper()
    for section in MANDATORY_SECTIONS:
        # Match case-insensitive section header or title
        pattern = re.compile(re.escape(section), re.IGNORECASE)
        if not pattern.search(full_text):
            missing.append(section)

    complete = len(missing) == 0
    return complete, missing

# ============================================================================
# 3. SECTION-BASED WORKFLOW EXECUTOR
# ============================================================================

def execute_section_based_sweep(
    *,
    client: Any,
    model: str,
    system_prompt: str,
    user_input_text: str,
    context_note: Optional[str] = None,
    max_output_tokens: int = 8192,
    max_continuations_per_section: int = 3
) -> Dict[str, Any]:
    """
    Executes the Capability Deep Sweep in 4 sequential phases.
    Concatenates chunks, validates structural completeness, and records run manifest.
    """
    run_id = f"RUN_{uuid.uuid4().hex[:8].upper()}"
    logger.info("=== STARTING SECTION-BASED DEEP SWEEP run_id=%s model=%s ===", run_id, model)

    all_phase_texts: List[str] = []
    total_model_calls = 0
    total_continuations = 0
    total_input_tokens = 0
    total_output_tokens = 0
    final_stop_reason = "unknown"

    for group_idx, group in enumerate(SECTION_GROUPS, 1):
        logger.info("--- Executing Phase %d/%d: %s ---", group_idx, len(SECTION_GROUPS), group["name"])

        phase_user_prompt = f"""DOCUMENT INPUT:
{user_input_text}

CONTEXT NOTE:
{context_note or 'None'}

WORKFLOW STEP {group_idx} OF {len(SECTION_GROUPS)}:
{group['instruction']}

MANDATORY FORMAT:
Maintain full markdown structure, evidence IDs, tables, and precision. Do not skip details.
"""

        messages = [{"role": "user", "content": phase_user_prompt}]
        phase_chunks: List[str] = []

        for call_idx in range(max_continuations_per_section + 1):
            total_model_calls += 1
            call_number = total_model_calls

            logger.info("MODEL_CALL call=%d phase=%d continuation_step=%d", call_number, group_idx, call_idx)

            response = client.messages.create(
                model=model,
                system=system_prompt,
                messages=messages,
                max_tokens=max_output_tokens,
                temperature=0.1
            )

            chunk = extract_text(response)
            stop_reason = get_stop_reason(response)
            final_stop_reason = stop_reason

            usage = getattr(response, "usage", None)
            in_tok = int(getattr(usage, "input_tokens", 0) or 0) if usage else 0
            out_tok = int(getattr(usage, "output_tokens", 0) or 0) if usage else 0
            total_input_tokens += in_tok
            total_output_tokens += out_tok

            phase_chunks.append(chunk)
            current_phase_length = len("".join(phase_chunks))

            logger.info(
                "MODEL_CALL_METRICS call=%d stop_reason=%s input_tokens=%d output_tokens=%d chunk_len=%d phase_len=%d",
                call_number, stop_reason, in_tok, out_tok, len(chunk), current_phase_length
            )

            is_token_limit = stop_reason in ["max_tokens", "length", "MAX_TOKENS"]
            if not is_token_limit:
                break

            total_continuations += 1
            logger.info("CONTINUATION_STARTED call=%d phase=%d", call_number + 1, group_idx)

            messages.append({"role": "assistant", "content": chunk})
            messages.append({
                "role": "user",
                "content": (
                    "Continue exactly where the previous response stopped. "
                    "Do not restart, summarize, or repeat completed sections. "
                    "Begin with the next missing sentence or heading."
                )
            })

        phase_full_text = "".join(phase_chunks)
        all_phase_texts.append(phase_full_text)

    # Combine all 4 phases into one contiguous analysis output
    full_analysis = "\n\n".join(all_phase_texts)

    # Perform structural completeness check
    is_complete, missing_sections = validate_completeness(full_analysis)
    if is_complete and final_stop_reason in ["max_tokens", "length", "MAX_TOKENS"]:
        is_complete = False

    manifest = {
        "run_id": run_id,
        "complete": is_complete,
        "sections_required": len(MANDATORY_SECTIONS),
        "sections_completed": len(MANDATORY_SECTIONS) - len(missing_sections),
        "missing_sections": missing_sections,
        "model_calls": total_model_calls,
        "continuations": total_continuations,
        "final_stop_reason": final_stop_reason,
        "input_tokens": total_input_tokens,
        "output_tokens": total_output_tokens,
        "tokens_used": total_input_tokens + total_output_tokens,
        "analysis_length": len(full_analysis)
    }

    logger.info("=== DEEP SWEEP COMPLETED run_id=%s complete=%s missing=%s ===", run_id, is_complete, missing_sections)

    return {
        "analysis": full_analysis,
        "complete": is_complete,
        "stop_reason": final_stop_reason,
        "continuations": total_continuations,
        "input_tokens": total_input_tokens,
        "output_tokens": total_output_tokens,
        "tokens_used": total_input_tokens + total_output_tokens,
        "manifest": manifest
    }
