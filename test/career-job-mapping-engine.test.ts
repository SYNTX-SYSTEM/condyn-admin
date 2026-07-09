import { describe, it, expect } from "vitest";
import {
  mapCapabilitiesToJobs,
  JobRoleProfile,
  JobMappingResultItemSchema,
  JobRoleProfileSchema
} from "../lib/career/matching/job-mapping";

describe("CONDYN Career Analysis Protocol v1.0 — Step 23: Capability-to-Job Mapping Engine", () => {
  const sampleJobs: JobRoleProfile[] = [
    {
      jobId: "job_arch_lead",
      title: "Principal Cloud Systems Architect",
      company: "Siemens AG",
      description: "Leading enterprise distributed infrastructure architecture.",
      requirements: [
        {
          capability_name: "Distributed Systems Architecture",
          domain: "Systems",
          weight: 0.6,
          required_level: "L5",
          aliases: ["Distributed Systems", "Cloud Systems Architecture"]
        },
        {
          capability_name: "Kubernetes Orchestration",
          domain: "DevOps",
          weight: 0.4,
          required_level: "L4",
          aliases: ["k8s", "Kubernetes"]
        }
      ]
    },
    {
      jobId: "job_devops_eng",
      title: "DevOps Platform Engineer",
      company: "BMW Group",
      description: "Managing enterprise cloud CI/CD and container platforms.",
      requirements: [
        {
          capability_name: "Kubernetes Orchestration",
          domain: "DevOps",
          weight: 0.7,
          required_level: "L4",
          aliases: ["k8s", "Kubernetes"]
        },
        {
          capability_name: "Terraform Infrastructure as Code",
          domain: "DevOps",
          weight: 0.3,
          required_level: "L3",
          aliases: ["Terraform", "IaC"]
        }
      ]
    }
  ];

  it("1. should achieve fitScore >= 0.95 for a perfect capability match", () => {
    const perfectCandidate = [
      { name: "Distributed Systems Architecture", confidence: 1.0 },
      { name: "Kubernetes Orchestration", confidence: 1.0 }
    ];

    const results = mapCapabilitiesToJobs(perfectCandidate, [sampleJobs[0]]);
    expect(results).toHaveLength(1);

    const topJob = results[0];
    expect(topJob.jobId).toBe("job_arch_lead");
    expect(topJob.fitScore).toBeGreaterThanOrEqual(0.95);
    expect(topJob.matchedCapabilities).toHaveLength(2);
    expect(topJob.missingCapabilities).toHaveLength(0);
    expect(topJob.weakEvidenceCapabilities).toHaveLength(0);

    // Ensure output strictly conforms to Zod schema
    const validated = JobMappingResultItemSchema.parse(topJob);
    expect(validated.jobId).toBe("job_arch_lead");
  });

  it("2. should significantly lower fitScore when a high-weight requirement is missing", () => {
    // Missing Distributed Systems Architecture (weight 0.6)
    const partialCandidate = [
      { name: "Kubernetes Orchestration", confidence: 1.0 }
    ];

    const results = mapCapabilitiesToJobs(partialCandidate, [sampleJobs[0]]);
    const topJob = results[0];

    // Max possible score is 0.4 since weight 0.6 is missing
    expect(topJob.fitScore).toBeCloseTo(0.4, 2);
    expect(topJob.missingCapabilities).toHaveLength(1);
    expect(topJob.missingCapabilities[0].capabilityName).toBe("Distributed Systems Architecture");
    expect(topJob.nextActions.length).toBeGreaterThan(0);
  });

  it("3. should correctly flag weak evidence when confidence < 0.70", () => {
    const weakCandidate = [
      { name: "Distributed Systems Architecture", confidence: 0.95 },
      { name: "Kubernetes Orchestration", confidence: 0.45 } // below default threshold 0.70
    ];

    const results = mapCapabilitiesToJobs(weakCandidate, [sampleJobs[0]]);
    const topJob = results[0];

    expect(topJob.matchedCapabilities).toHaveLength(1);
    expect(topJob.weakEvidenceCapabilities).toHaveLength(1);
    expect(topJob.weakEvidenceCapabilities[0].capabilityName).toBe("Kubernetes Orchestration");
    expect(topJob.weakEvidenceCapabilities[0].extractedConfidence).toBe(0.45);
    expect(topJob.rationale).toContain("Schwache Evidenz");
  });

  it("4. should match capabilities using semantic aliases/synonyms", () => {
    // Candidate has alias "k8s" instead of canonical "Kubernetes Orchestration"
    const aliasCandidate = [
      { name: "Distributed Systems", confidence: 0.90 }, // alias match
      { name: "k8s", confidence: 0.90 } // alias match
    ];

    const results = mapCapabilitiesToJobs(aliasCandidate, [sampleJobs[0]]);
    const topJob = results[0];

    expect(topJob.matchedCapabilities).toHaveLength(2);
    expect(topJob.fitScore).toBeGreaterThanOrEqual(0.85);
  });

  it("5. should sort jobs strictly descending by fitScore", () => {
    const candidate = [
      { name: "Kubernetes", confidence: 1.0 },
      { name: "Terraform", confidence: 1.0 }
    ];

    const results = mapCapabilitiesToJobs(candidate, sampleJobs);

    expect(results).toHaveLength(2);
    // DevOps platform engineer should rank first because both K8s and Terraform match
    expect(results[0].jobId).toBe("job_devops_eng");
    expect(results[0].fitScore).toBeGreaterThan(results[1].fitScore);
  });

  it("6. should guarantee immutability of input candidate capabilities and job profiles", () => {
    const candidateFreeze = Object.freeze([
      Object.freeze({ name: "Kubernetes", confidence: 0.88 })
    ]);
    const jobFreeze = Object.freeze([
      JobRoleProfileSchema.parse(sampleJobs[0])
    ]);

    expect(() => {
      mapCapabilitiesToJobs(candidateFreeze as any, jobFreeze as any);
    }).not.toThrow();
  });
});
