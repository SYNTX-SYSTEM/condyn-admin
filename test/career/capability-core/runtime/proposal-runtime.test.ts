import { describe, expect, it, vi } from "vitest";
import type { DocumentInput } from "../../../../lib/career/adapter";
import type { SourceDocument } from "../../../../lib/career/capability-core";
import * as capabilityCore from "../../../../lib/career/capability-core";

type DiscoveryResult =
  | { kind: "DISCOVERY_COMPLETED"; run: object }
  | { kind: "DISCOVERY_RUN_REUSED"; run: object }
  | { kind: "VERIFIED_SNAPSHOT_REUSED"; snapshot: object };

type CapabilityProposalRuntime = {
  execute(documents: DocumentInput[]): Promise<unknown>;
};

type PromptResolver = {
  resolveActivePrompt(slug: string): Promise<{
    slug: string;
    plainTextContent: string;
  }>;
};

type KernelResolver = {
  resolve(): Promise<{
    slug: string;
    plainTextContent: string;
  }>;
};

type CapabilityProposalRuntimeFactory = (dependencies: {
  repository: {
    createVerifiedCapabilitySnapshotPublisher: () => unknown;
  };
  activePromptResolver: PromptResolver;
  discovery: {
    kernelResolver: KernelResolver;
    run: (
      documents: SourceDocument[],
      dependencies: { repository: object; kernelResolver: KernelResolver }
    ) => Promise<DiscoveryResult>;
  };
  convergence: {
    kernelResolver: KernelResolver;
    run: (
      discoveryRun: object,
      dependencies: { repository: object; kernelResolver: KernelResolver }
    ) => Promise<{ run: object }>;
  };
}) => CapabilityProposalRuntime;

function getProposalRuntimeFactory(): CapabilityProposalRuntimeFactory {
  const factory = (
    capabilityCore as unknown as {
      createCapabilityProposalRuntime?: CapabilityProposalRuntimeFactory;
    }
  ).createCapabilityProposalRuntime;

  expect(factory).toBeTypeOf("function");
  if (typeof factory !== "function") {
    throw new Error("F10A Capability Proposal Runtime is not available.");
  }

  return factory;
}

const documents: DocumentInput[] = [
  { docId: "doc-b", title: " B ", content: "Second literal source." },
  { docId: "doc-a", title: "A", content: "First literal source." }
];

function createDedicatedKernelResolvers(activePromptResolver: PromptResolver): {
  discoveryKernelResolver: KernelResolver;
  convergenceKernelResolver: KernelResolver;
} {
  return {
    discoveryKernelResolver: {
      resolve: () => activePromptResolver.resolveActivePrompt("capability-discovery-v1")
    },
    convergenceKernelResolver: {
      resolve: () => activePromptResolver.resolveActivePrompt("capability-convergence-v1")
    }
  };
}

describe("F10A Capability Proposal Runtime", () => {
  it.each([
    ["completed", { kind: "DISCOVERY_COMPLETED", run: { runId: "RUN_completed", status: "COMPLETED", payload: { candidates: [{ status: "EVIDENCE_REJECTED" }] } } }],
    ["reused", { kind: "DISCOVERY_RUN_REUSED", run: { runId: "RUN_reused", status: "COMPLETED", payload: { candidates: [{ status: "EVIDENCE_REJECTED" }] } } }]
  ] as const)("bridges sources and passes the exact %s Discovery RUN_ to Convergence", async (_mode, discoveryResult) => {
    const createVerifiedCapabilitySnapshotPublisher = vi.fn();
    const repository = {
      identity: "same-repository",
      createVerifiedCapabilitySnapshotPublisher
    };
    const activePromptResolver: PromptResolver = {
      resolveActivePrompt: vi.fn(async (slug: string) => ({
        slug,
        plainTextContent: `${slug}-kernel`
      }))
    };
    const { discoveryKernelResolver, convergenceKernelResolver } =
      createDedicatedKernelResolvers(activePromptResolver);
    const convergenceRun = { runId: "CONV_01", status: "COMPLETED" };
    const discovery = vi.fn(async (
      sourceDocuments: SourceDocument[],
      dependencies: { repository: object; kernelResolver: KernelResolver }
    ) => {
      expect(sourceDocuments.map((document) => document.docId)).toEqual(["doc-b", "doc-a"]);
      expect(sourceDocuments.every((document) => document.pages === undefined)).toBe(true);
      expect(dependencies.repository).toBe(repository);
      expect(dependencies.kernelResolver).toBe(discoveryKernelResolver);
      return discoveryResult;
    });
    const convergence = vi.fn(async (
      discoveryRun: object,
      dependencies: { repository: object; kernelResolver: KernelResolver }
    ) => {
      expect(discoveryRun).toBe(discoveryResult.run);
      expect((discoveryRun as { payload: { candidates: Array<{ status: string }> } }).payload.candidates).toEqual([
        { status: "EVIDENCE_REJECTED" }
      ]);
      expect(dependencies.repository).toBe(repository);
      expect(dependencies.kernelResolver).toBe(convergenceKernelResolver);
      return { run: convergenceRun };
    });

    const result = await getProposalRuntimeFactory()({
      repository,
      activePromptResolver,
      discovery: { kernelResolver: discoveryKernelResolver, run: discovery },
      convergence: { kernelResolver: convergenceKernelResolver, run: convergence }
    }).execute(documents);

    expect(discovery).toHaveBeenCalledTimes(1);
    expect(convergence).toHaveBeenCalledTimes(1);
    expect(createVerifiedCapabilitySnapshotPublisher).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      sourceDocuments: [
        { docId: "doc-b", pages: undefined },
        { docId: "doc-a", pages: undefined }
      ],
      discoveryRun: discoveryResult.run,
      convergenceRun,
      discoveryDisposition: _mode === "completed" ? "EXECUTED" : "REUSED",
      convergenceDisposition: "EXECUTED"
    });
    expect(JSON.stringify(result)).not.toMatch(/VFY_|CAP_|PHASE4_VERIFIED/);
  });

  it("stops explicitly when Discovery reuses a verified snapshot and never fabricates proposal artifacts", async () => {
    const createVerifiedCapabilitySnapshotPublisher = vi.fn();
    const repository = {
      identity: "same-repository",
      createVerifiedCapabilitySnapshotPublisher
    };
    const activePromptResolver: PromptResolver = {
      resolveActivePrompt: vi.fn(async (slug: string) => ({ slug, plainTextContent: "unused" }))
    };
    const { discoveryKernelResolver, convergenceKernelResolver } =
      createDedicatedKernelResolvers(activePromptResolver);
    const discovery = vi.fn(async () => ({
      kind: "VERIFIED_SNAPSHOT_REUSED" as const,
      snapshot: { snapshotId: "sealed-phase-4-snapshot" }
    }));
    const convergence = vi.fn(async () => ({ run: { runId: "CONV_should_not_exist" } }));

    const result = await getProposalRuntimeFactory()({
      repository,
      activePromptResolver,
      discovery: { kernelResolver: discoveryKernelResolver, run: discovery },
      convergence: { kernelResolver: convergenceKernelResolver, run: convergence }
    }).execute(documents);

    expect(discovery).toHaveBeenCalledTimes(1);
    expect(convergence).not.toHaveBeenCalled();
    expect(createVerifiedCapabilitySnapshotPublisher).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      kind: "VERIFIED_SNAPSHOT_REUSED",
      sourceDocuments: [
        { docId: "doc-b", pages: undefined },
        { docId: "doc-a", pages: undefined }
      ],
      discoveryDisposition: "VERIFIED_SNAPSHOT_REUSED"
    });
    expect(JSON.stringify(result)).not.toMatch(/RUN_|CONV_|VFY_|CAP_|PHASE4_VERIFIED/);
  });

  it("uses only dedicated kernels and keeps kernel plaintext out of proposal artifacts", async () => {
    const discoverySecret = "F10A_DISCOVERY_SECRET_MARKER_7A91";
    const convergenceSecret = "F10A_CONVERGENCE_SECRET_MARKER_4C28";
    const createVerifiedCapabilitySnapshotPublisher = vi.fn();
    const repository = { createVerifiedCapabilitySnapshotPublisher };
    const activePromptResolver: PromptResolver = {
      resolveActivePrompt: vi.fn(async (slug: string) => {
        if (slug === "capability-discovery-v1") {
          return { slug, plainTextContent: discoverySecret };
        }
        if (slug === "capability-convergence-v1") {
          return { slug, plainTextContent: convergenceSecret };
        }
        throw new Error(`unexpected prompt slug: ${slug}`);
      })
    };
    const { discoveryKernelResolver, convergenceKernelResolver } =
      createDedicatedKernelResolvers(activePromptResolver);
    const persistedDiscoveryRun = {
      runId: "RUN_secret-boundary",
      status: "COMPLETED",
      payload: { candidates: [] }
    };
    const persistedConvergenceRun = {
      runId: "CONV_secret-boundary",
      status: "COMPLETED",
      payload: { groups: [] }
    };
    const discovery = vi.fn(async (
      _sourceDocuments: SourceDocument[],
      dependencies: { repository: object; kernelResolver: KernelResolver }
    ) => {
      expect((await dependencies.kernelResolver.resolve()).plainTextContent).toBe(discoverySecret);
      return { kind: "DISCOVERY_COMPLETED" as const, run: persistedDiscoveryRun };
    });
    const convergence = vi.fn(async (
      discoveryRun: object,
      dependencies: { repository: object; kernelResolver: KernelResolver }
    ) => {
      expect(discoveryRun).toBe(persistedDiscoveryRun);
      expect((await dependencies.kernelResolver.resolve()).plainTextContent).toBe(convergenceSecret);
      return { run: persistedConvergenceRun };
    });

    const result = await getProposalRuntimeFactory()({
      repository,
      activePromptResolver,
      discovery: { kernelResolver: discoveryKernelResolver, run: discovery },
      convergence: { kernelResolver: convergenceKernelResolver, run: convergence }
    }).execute(documents);

    expect(activePromptResolver.resolveActivePrompt).toHaveBeenCalledWith("capability-discovery-v1");
    expect(activePromptResolver.resolveActivePrompt).toHaveBeenCalledWith("capability-convergence-v1");
    expect(activePromptResolver.resolveActivePrompt).not.toHaveBeenCalledWith("capability-deep-sweep");
    expect(JSON.stringify(persistedDiscoveryRun)).not.toContain(discoverySecret);
    expect(JSON.stringify(persistedDiscoveryRun)).not.toContain(convergenceSecret);
    expect(JSON.stringify(persistedConvergenceRun)).not.toContain(discoverySecret);
    expect(JSON.stringify(persistedConvergenceRun)).not.toContain(convergenceSecret);
    expect(JSON.stringify(result)).not.toContain(discoverySecret);
    expect(JSON.stringify(result)).not.toContain(convergenceSecret);
    expect(createVerifiedCapabilitySnapshotPublisher).not.toHaveBeenCalled();
  });
});
