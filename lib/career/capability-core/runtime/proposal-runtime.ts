import type { DocumentInput } from "../../adapter";
import type { SourceDocument } from "../source";
import { toCapabilitySourceDocuments } from "./source-bridge";

export interface CapabilityProposalKernelResolver {
  resolve(): Promise<{
    kernelVersion: string;
    templateId: string;
    versionId: string;
    checksum: string;
    plainTextContent: string;
  }>;
}

export type CapabilityProposalDiscoveryResult =
  | { kind: "DISCOVERY_COMPLETED"; run: object }
  | { kind: "DISCOVERY_RUN_REUSED"; run: object }
  | { kind: "VERIFIED_SNAPSHOT_REUSED"; snapshot: object };

export type CapabilityProposalConvergenceResult = {
  run: object;
  kind?: "CONVERGENCE_COMPLETED" | "CONVERGENCE_RUN_REUSED";
};

export interface CapabilityProposalRuntimeDependencies<Repository extends object = object> {
  repository: Repository;
  discovery: {
    kernelResolver: CapabilityProposalKernelResolver;
    run(
      documents: SourceDocument[],
      dependencies: { repository: Repository; kernelResolver: CapabilityProposalKernelResolver }
    ): Promise<CapabilityProposalDiscoveryResult>;
  };
  convergence: {
    kernelResolver: CapabilityProposalKernelResolver;
    run(
      discoveryRun: object,
      dependencies: { repository: Repository; kernelResolver: CapabilityProposalKernelResolver }
    ): Promise<CapabilityProposalConvergenceResult>;
  };
}

export type CapabilityProposalRuntimeResult =
  | {
      kind: "PROPOSALS_CONVERGED";
      sourceDocuments: SourceDocument[];
      discoveryRun: object;
      convergenceRun: object;
      discoveryDisposition: "EXECUTED" | "REUSED";
      convergenceDisposition: "EXECUTED" | "REUSED";
    }
  | {
      kind: "VERIFIED_SNAPSHOT_REUSED";
      sourceDocuments: SourceDocument[];
      snapshot: object;
      discoveryDisposition: "VERIFIED_SNAPSHOT_REUSED";
    };

export interface CapabilityProposalRuntime {
  execute(documents: DocumentInput[]): Promise<CapabilityProposalRuntimeResult>;
}

/**
 * Bounded F10A proposal orchestration. Discovery and Convergence own all
 * validation, evidence filtering, and artifact persistence semantics. Its
 * returned RUN_/CONV_ state remains proposal state, not verified capability
 * truth or a Phase-4 publication.
 */
export function createCapabilityProposalRuntime<Repository extends object>(
  dependencies: CapabilityProposalRuntimeDependencies<Repository>
): CapabilityProposalRuntime {
  return {
    async execute(documents: DocumentInput[]): Promise<CapabilityProposalRuntimeResult> {
      const sourceDocuments = toCapabilitySourceDocuments(documents);
      const discovery = await dependencies.discovery.run(sourceDocuments, {
        repository: dependencies.repository,
        kernelResolver: dependencies.discovery.kernelResolver
      });

      if (discovery.kind === "VERIFIED_SNAPSHOT_REUSED") {
        // This is an already-existing verified snapshot state. Do not fabricate
        // proposal artifacts or run Convergence merely to continue.
        return {
          kind: "VERIFIED_SNAPSHOT_REUSED",
          sourceDocuments,
          snapshot: discovery.snapshot,
          discoveryDisposition: "VERIFIED_SNAPSHOT_REUSED"
        };
      }

      const convergence = await dependencies.convergence.run(discovery.run, {
        repository: dependencies.repository,
        kernelResolver: dependencies.convergence.kernelResolver
      });

      return {
        kind: "PROPOSALS_CONVERGED",
        sourceDocuments,
        discoveryRun: discovery.run,
        convergenceRun: convergence.run,
        discoveryDisposition:
          discovery.kind === "DISCOVERY_COMPLETED" ? "EXECUTED" : "REUSED",
        convergenceDisposition:
          convergence.kind === "CONVERGENCE_RUN_REUSED" ? "REUSED" : "EXECUTED"
      };
    }
  };
}
