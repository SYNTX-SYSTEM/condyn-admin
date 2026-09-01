import { describe, expect, it } from "vitest";
import * as capabilityCore from "../../../../lib/career/capability-core";
import { createCareerAnalysisJobProcessor } from "../../../../lib/career/orchestration/worker";
import { createJob } from "../../../../lib/career/orchestration/job";

type Reference = {
  analysisId: string;
  jobId: string;
  discoveryRunId: string;
  convergenceRunId: string;
  sourceBundleHash: string;
  createdAt: string;
};

type ReferenceRepository = {
  save(reference: Reference): Promise<void>;
  getByAnalysisId(analysisId: string): Promise<Reference | null>;
};

type ProjectionReader = {
  read(analysisId: string): Promise<unknown | null>;
};

type ProjectionFactory = (dependencies: {
  references: ReferenceRepository;
  capabilityRepository: {
    getRunById(id: string): Promise<any>;
    getConvergenceRunById(id: string): Promise<any>;
  };
}) => ProjectionReader;

function referenceRepositoryFactory(): () => ReferenceRepository {
  const factory = (capabilityCore as unknown as {
    createInMemoryCapabilityProposalProjectionReferenceRepository?: () => ReferenceRepository;
  }).createInMemoryCapabilityProposalProjectionReferenceRepository;
  expect(factory).toBeTypeOf("function");
  if (typeof factory !== "function") throw new Error("F11 immutable projection reference repository is unavailable.");
  return factory;
}

function projectionReaderFactory(): ProjectionFactory {
  const factory = (capabilityCore as unknown as {
    createCapabilityProposalProjectionReader?: ProjectionFactory;
  }).createCapabilityProposalProjectionReader;
  expect(factory).toBeTypeOf("function");
  if (typeof factory !== "function") throw new Error("F11 proposal projection reader is unavailable.");
  return factory;
}

const reference: Reference = {
  analysisId: "ANL_F11",
  jobId: "JOB_F11",
  discoveryRunId: "RUN_F11",
  convergenceRunId: "CONV_F11",
  sourceBundleHash: "SOURCE_F11",
  createdAt: "2026-08-31T00:00:00.000Z"
};

const evidence = {
  evidenceId: "EVD_F11",
  sourceDocumentRef: "DOC_F11",
  declaredLocation: "section 1",
  exactQuote: "Designed deterministic source pipelines.",
  verification: { status: "VERIFIED", matchedDocId: "DOC_F11" }
};

const discoveryRun = {
  runId: "RUN_F11",
  sourceBundleHash: "SOURCE_F11",
  status: "COMPLETED",
  payload: {
    candidates: [{ candidateId: "CAND_F11", status: "EVIDENCE_PASSED", evidenceClaims: [evidence] }]
  }
};

const convergenceRun = {
  convergenceRunId: "CONV_F11",
  discoveryRunId: "RUN_F11",
  sourceBundleHash: "SOURCE_F11",
  status: "COMPLETED",
  payload: {
    canonicalDrafts: [{
      provisionalCapabilityId: "PCAP_F11",
      canonicalName: "Deterministic source pipelines",
      scope: "ATOMIC",
      structuralDefinition: "Builds deterministic source pipelines.",
      primaryDomain: "Engineering",
      evidenceIds: ["EVD_F11"],
      provenance: { sourceCandidateIds: ["CAND_F11"], sourceDocumentIds: ["DOC_F11"] },
      semanticDefinitionStatus: "NOT_RUN"
    }],
    proposedRelations: [{
      relationId: "REL_F11",
      sourceCapabilityRef: "PCAP_F11",
      targetCapabilityRef: "PCAP_F11",
      relationType: "RELATED_CAPABILITY",
      status: "PROPOSED",
      reason: "Same proposal graph.",
      createdBy: "SEMANTIC_RESOLVER",
      createdAt: "2026-08-31T00:00:00.000Z"
    }],
    reconciliation: { status: "PASSED" }
  }
};

describe("F11 immutable Capability Proposal projection", () => {
  it("persists one exact analysis/job lineage idempotently and rejects artifact replacement", async () => {
    const repository = referenceRepositoryFactory()();
    await repository.save(reference);
    await expect(repository.save({ ...reference })).resolves.toBeUndefined();
    await expect(repository.save({ ...reference, convergenceRunId: "CONV_OTHER" })).rejects.toThrow("ERR_IMMUTABLE_CAPABILITY_PROPOSAL_PROJECTION_REFERENCE_CONFLICT");
    await expect(repository.save({ ...reference, analysisId: "ANL_OTHER", convergenceRunId: "CONV_OTHER" })).rejects.toThrow("ERR_IMMUTABLE_CAPABILITY_PROPOSAL_PROJECTION_REFERENCE_CONFLICT");
    await expect(repository.getByAnalysisId(reference.analysisId)).resolves.toEqual(reference);
  });

  it("reads only the exact referenced completed RUN_/CONV_ lineage as non-authoritative proposals", async () => {
    const references = referenceRepositoryFactory()();
    await references.save(reference);
    const reader = projectionReaderFactory()({
      references,
      capabilityRepository: {
        getRunById: async (id) => id === "RUN_F11" ? discoveryRun : null,
        getConvergenceRunById: async (id) => id === "CONV_F11" ? convergenceRun : null
      }
    });

    const projection = await reader.read("ANL_F11");
    expect(projection).toMatchObject({
      projectionKind: "CAPABILITY_PROPOSAL",
      projectionState: "PROPOSED",
      evidenceState: "EVIDENCE_PASSED",
      semanticDefinitionState: "NOT_RUN",
      authorityState: "NONE",
      capabilities: [{
        id: "PCAP_F11",
        evidenceState: "EVIDENCE_PASSED",
        semanticDefinitionState: "NOT_RUN",
        authorityState: "NONE",
        evidence: [{ evidenceId: "EVD_F11", sourceDocumentId: "DOC_F11", exactQuote: evidence.exactQuote, verificationState: "SOURCE_MATCH_VERIFIED" }]
      }],
      relations: [{ id: "REL_F11", state: "PROPOSED" }]
    });
    expect(JSON.stringify(projection)).not.toMatch(/modelConfidence|proposedDemonstratedLevel|AUTHORITATIVE|CURRENT|LATEST|HEAD|DECISION_READY|COMPLETE/);
  });

  it("returns null for historical analyses and fails closed instead of searching another run on invalid lineage", async () => {
    const references = referenceRepositoryFactory()();
    const reader = projectionReaderFactory()({
      references,
      capabilityRepository: {
        getRunById: async () => discoveryRun,
        getConvergenceRunById: async () => convergenceRun
      }
    });
    await expect(reader.read("ANL_LEGACY")).resolves.toBeNull();
    await references.save({ ...reference, analysisId: "ANL_BROKEN", sourceBundleHash: "WRONG" });
    await expect(reader.read("ANL_BROKEN")).rejects.toThrow("ERR_CAPABILITY_PROPOSAL_PROJECTION_LINEAGE_INVALID");
  });

  it("persists deterministic proposal lineage once, confirms it idempotently on recovery, and excludes snapshot reuse", async () => {
    const makeJob = () => ({
      ...createJob("CAREER_ANALYSIS", {
        sourceType: "TEXT",
        sourceData: { documents: [{ type: "text", content: "F11 source" }] }
      }),
      jobId: "JOB_F11_PROCESSOR"
    });
    const normalizedDocs = [{ docId: "DOC_F11_PROCESSOR", title: "F11", content: "F11 source" }];
    const proposal = {
      kind: "PROPOSALS_CONVERGED",
      discoveryRun: { runId: "RUN_F11_PROCESSOR", sourceBundleHash: "SOURCE_F11_PROCESSOR" },
      convergenceRun: { convergenceRunId: "CONV_F11_PROCESSOR", completedAt: "2026-09-01T00:00:00.000Z" }
    };
    const references = referenceRepositoryFactory()();
    const createProcessor = (
      existing: object | null,
      result: unknown,
      events: string[],
      referenceStore: ReferenceRepository = references
    ) => {
      return {
        references: referenceStore,
        processor: createCareerAnalysisJobProcessor({
          canonicalAnalysisRepository: {
            load: async () => existing,
            save: async () => { events.push("canonical-save"); }
          },
          prepareDocuments: async () => ({ normalizedDocs }),
          capabilityProposalExecutor: { execute: async () => result },
          projectionReferenceRepository: referenceStore,
          executeLegacyCareerAnalysis: async () => ({
            resultAnalysisId: "ANL_F11_PROCESSOR",
            analysis: { analysisId: "ANL_F11_PROCESSOR" }
          })
        })
      };
    };

    const newEvents: string[] = [];
    const newPath = createProcessor(null, proposal, newEvents);
    await expect(newPath.processor(makeJob(), async () => undefined)).resolves.toEqual({ resultAnalysisId: "ANL_F11_PROCESSOR" });
    expect(newEvents).toEqual(["canonical-save"]);
    await expect(newPath.references.getByAnalysisId("ANL_F11_PROCESSOR")).resolves.toEqual({
      analysisId: "ANL_F11_PROCESSOR", jobId: "JOB_F11_PROCESSOR", discoveryRunId: "RUN_F11_PROCESSOR",
      convergenceRunId: "CONV_F11_PROCESSOR", sourceBundleHash: "SOURCE_F11_PROCESSOR", createdAt: "2026-09-01T00:00:00.000Z"
    });

    const recoveryEvents: string[] = [];
    const recovery = createProcessor({ analysisId: "ANL_F11_PROCESSOR" }, proposal, recoveryEvents);
    await recovery.processor(makeJob(), async () => undefined);
    expect(recoveryEvents).toEqual([]);
    await expect(recovery.references.getByAnalysisId("ANL_F11_PROCESSOR")).resolves.not.toBeNull();

    const snapshotReferences = referenceRepositoryFactory()();
    const snapshot = createProcessor({ analysisId: "ANL_F11_PROCESSOR" }, {
      kind: "VERIFIED_SNAPSHOT_REUSED",
      snapshot: { snapshotId: "SNAPSHOT_F11" }
    }, [], snapshotReferences);
    await snapshot.processor(makeJob(), async () => undefined);
    await expect(snapshot.references.getByAnalysisId("ANL_F11_PROCESSOR")).resolves.toBeNull();
  });

  it("fails instead of silently dropping converged proposal lineage when no reference repository is configured", async () => {
    const processor = createCareerAnalysisJobProcessor({
      canonicalAnalysisRepository: { load: async () => ({ analysisId: "ANL_F11_MISSING_REFERENCE" }), save: async () => undefined },
      prepareDocuments: async () => ({ normalizedDocs: [{ docId: "DOC", title: "Doc", content: "content" }] }),
      capabilityProposalExecutor: {
        execute: async () => ({
          kind: "PROPOSALS_CONVERGED",
          discoveryRun: { runId: "RUN", sourceBundleHash: "SOURCE" },
          convergenceRun: { convergenceRunId: "CONV", completedAt: "2026-09-01T00:00:00.000Z" }
        })
      },
      executeLegacyCareerAnalysis: async () => ({ resultAnalysisId: "ANL_F11_MISSING_REFERENCE", analysis: {} })
    });
    await expect(processor({
      ...createJob("CAREER_ANALYSIS", { sourceType: "TEXT", sourceData: { documents: [] } }),
      jobId: "JOB_F11_MISSING_REFERENCE"
    }, async () => undefined)).rejects.toThrow("ERR_CAPABILITY_PROPOSAL_PROJECTION_REFERENCE_INVALID");
  });

  it("fails closed for mismatched artifact identity, reconciliation, and draft provenance", async () => {
    const invalidCases = [
      {
        name: "reference analysis identity",
        requestedAnalysisId: "ANL_F11_REQUESTED",
        reference: { ...reference, analysisId: "ANL_F11_OTHER" }
      },
      {
        name: "discovery identity",
        discovery: { ...discoveryRun, runId: "RUN_OTHER" }
      },
      {
        name: "convergence identity",
        convergence: { ...convergenceRun, convergenceRunId: "CONV_OTHER" }
      },
      {
        name: "reconciliation",
        convergence: { ...convergenceRun, payload: { ...convergenceRun.payload, reconciliation: { status: "FAILED" } } }
      },
      {
        name: "non-PCAP draft",
        convergence: { ...convergenceRun, payload: { ...convergenceRun.payload, canonicalDrafts: [{ ...convergenceRun.payload.canonicalDrafts[0], provisionalCapabilityId: "CAP_NOT_PROPOSAL" }] } }
      },
      {
        name: "semantic-definition status",
        convergence: { ...convergenceRun, payload: { ...convergenceRun.payload, canonicalDrafts: [{ ...convergenceRun.payload.canonicalDrafts[0], semanticDefinitionStatus: "PASSED" }] } }
      },
      {
        name: "borrowed candidate evidence",
        discovery: { ...discoveryRun, payload: { candidates: [
          { candidateId: "CAND_F11", status: "EVIDENCE_PASSED", evidenceClaims: [] },
          { candidateId: "CAND_OTHER", status: "EVIDENCE_PASSED", evidenceClaims: [evidence] }
        ] } }
      },
      {
        name: "derived source-document provenance",
        convergence: { ...convergenceRun, payload: { ...convergenceRun.payload, canonicalDrafts: [{ ...convergenceRun.payload.canonicalDrafts[0], provenance: { sourceCandidateIds: ["CAND_F11"], sourceDocumentIds: ["DOC_OTHER"] } }] } }
      }
    ];
    for (const invalidCase of invalidCases) {
      const invalidReference = invalidCase.reference ?? reference;
      const reader = projectionReaderFactory()({
        references: { save: async () => undefined, getByAnalysisId: async () => invalidReference },
        capabilityRepository: {
          getRunById: async () => invalidCase.discovery ?? discoveryRun,
          getConvergenceRunById: async () => invalidCase.convergence ?? convergenceRun
        }
      });
      await expect(reader.read(invalidCase.requestedAnalysisId ?? reference.analysisId), invalidCase.name)
        .rejects.toThrow("ERR_CAPABILITY_PROPOSAL_PROJECTION_LINEAGE_INVALID");
    }
  });
});
