import { ActivePromptCapabilityConvergenceResolver } from "../../../../lib/career/capability-core/convergence/prompt-resolver";
import { ActivePromptCapabilityKernelResolver } from "../../../../lib/career/capability-core/discovery/prompt-resolver";
import type {
  CapabilityProposalKernelResolver,
  CapabilityProposalRuntimeDependencies
} from "../../../../lib/career/capability-core/runtime";

declare const discoveryResolver: ActivePromptCapabilityKernelResolver;
declare const convergenceResolver: ActivePromptCapabilityConvergenceResolver;

const discoveryKernelResolver: CapabilityProposalKernelResolver = discoveryResolver;
const convergenceKernelResolver: CapabilityProposalKernelResolver = convergenceResolver;

const dependenciesWithoutUnusedPromptResolver: CapabilityProposalRuntimeDependencies = {
  repository: {},
  discovery: {
    kernelResolver: discoveryKernelResolver,
    async run() {
      return { kind: "VERIFIED_SNAPSHOT_REUSED", snapshot: {} };
    }
  },
  convergence: {
    kernelResolver: convergenceKernelResolver,
    async run() {
      return { run: {} };
    }
  }
};

void dependenciesWithoutUnusedPromptResolver;
