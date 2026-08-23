import type { CapabilityKernelOutput } from "../schema";
export function assertCapabilityCoverageAudit(output: CapabilityKernelOutput, sourceDocumentCount: number): void {
  const audit = output.coverage_audit; const atomic = output.capabilities.filter((item) => item.capability_scope === "ATOMIC").length; const composite = output.capabilities.length - atomic;
  if (audit.source_documents_examined !== sourceDocumentCount || audit.capability_count !== output.capabilities.length || audit.atomic_capability_count !== atomic || audit.composite_capability_count !== composite || atomic + composite !== audit.capability_count) throw new Error("ERR_CAPABILITY_COVERAGE_AUDIT_MISMATCH");
}
