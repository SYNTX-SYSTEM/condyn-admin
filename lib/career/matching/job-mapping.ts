import { z } from "zod";
import { ExtractedCapabilityItem } from "./scoring";

export const JobCapabilityRequirementSchema = z.object({
  capability_name: z.string().min(1),
  domain: z.string().optional().default("General"),
  weight: z.number().min(0.0).max(1.0, {
    message: "weight must be in range [0.0, 1.0]"
  }),
  required_level: z.string(),
  aliases: z.array(z.string()).optional().default([]),
  evidence_hint: z.string().optional()
});
export type JobCapabilityRequirement = z.infer<typeof JobCapabilityRequirementSchema>;

export const JobRoleProfileSchema = z.object({
  jobId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  description: z.string().optional().default(""),
  requirements: z.array(JobCapabilityRequirementSchema)
});
export type JobRoleProfile = z.infer<typeof JobRoleProfileSchema>;

export const MatchedJobCapabilitySchema = z.object({
  capabilityName: z.string(),
  requiredWeight: z.number(),
  extractedConfidence: z.number(),
  contribution: z.number()
});
export type MatchedJobCapability = z.infer<typeof MatchedJobCapabilitySchema>;

export const MissingJobCapabilitySchema = z.object({
  capabilityName: z.string(),
  requiredWeight: z.number(),
  requiredLevel: z.string(),
  evidenceHint: z.string().optional()
});
export type MissingJobCapability = z.infer<typeof MissingJobCapabilitySchema>;

export const WeakEvidenceJobCapabilitySchema = z.object({
  capabilityName: z.string(),
  requiredWeight: z.number(),
  extractedConfidence: z.number(),
  reason: z.string()
});
export type WeakEvidenceJobCapability = z.infer<typeof WeakEvidenceJobCapabilitySchema>;

export const JobMappingResultItemSchema = z.object({
  jobId: z.string(),
  title: z.string(),
  company: z.string(),
  fitScore: z.number(),
  matchedCapabilities: z.array(MatchedJobCapabilitySchema),
  missingCapabilities: z.array(MissingJobCapabilitySchema),
  weakEvidenceCapabilities: z.array(WeakEvidenceJobCapabilitySchema),
  rationale: z.string(),
  nextActions: z.array(z.string())
});
export type JobMappingResultItem = z.infer<typeof JobMappingResultItemSchema>;

export interface JobMappingOptions {
  minConfidenceThreshold?: number; // default 0.70
}

/**
 * Pure, deterministic Capability-to-Job Mapping Engine (Step 23).
 * Evaluates extracted candidate capabilities against concrete job role requirements.
 * Guarantees zero runtime LLM calls and complete immutability of input structures.
 */
export function mapCapabilitiesToJobs(
  rawCapabilities: ExtractedCapabilityItem[] | any[],
  rawJobs: JobRoleProfile[],
  options: JobMappingOptions = {}
): JobMappingResultItem[] {
  const minConfidence = options.minConfidenceThreshold ?? 0.70;

  // Normalize capabilities defensively without mutating input
  const capabilities: ExtractedCapabilityItem[] = rawCapabilities.map((cap) => ({
    name: cap.name || cap.capability_name || "",
    domain: cap.domain || "General",
    confidence: typeof cap.confidence === "number" ? cap.confidence : 0.85
  }));

  const results: JobMappingResultItem[] = [];

  for (const job of rawJobs) {
    const validJob = JobRoleProfileSchema.parse(job);

    const matchedCapabilities: MatchedJobCapability[] = [];
    const missingCapabilities: MissingJobCapability[] = [];
    const weakEvidenceCapabilities: WeakEvidenceJobCapability[] = [];

    let totalWeight = 0.0;
    let earnedScore = 0.0;

    for (const req of validJob.requirements) {
      totalWeight += req.weight;

      const reqNorm = req.capability_name.toLowerCase().trim();
      const aliasNorms = (req.aliases || []).map((a) => a.toLowerCase().trim());

      // Search for match by exact normalized name or aliases
      const match = capabilities.find((cap) => {
        const capNorm = cap.name.toLowerCase().trim();
        if (capNorm === reqNorm) return true;
        if (aliasNorms.includes(capNorm)) return true;
        return false;
      });

      if (!match) {
        // Missing completely
        missingCapabilities.push({
          capabilityName: req.capability_name,
          requiredWeight: req.weight,
          requiredLevel: req.required_level,
          evidenceHint: req.evidence_hint
        });
      } else if (match.confidence < minConfidence) {
        // Weak evidence: match exists but confidence is below threshold
        const partialContribution = req.weight * Math.max(0.0, match.confidence * 0.5);
        earnedScore += partialContribution;

        weakEvidenceCapabilities.push({
          capabilityName: req.capability_name,
          requiredWeight: req.weight,
          extractedConfidence: match.confidence,
          reason: `Evidenzdichte (${(match.confidence * 100).toFixed(0)}%) liegt unter dem Grenzwert von ${(minConfidence * 100).toFixed(0)}%.`
        });
      } else {
        // Strong matched capability
        const contribution = req.weight * Math.min(1.0, match.confidence);
        earnedScore += contribution;

        matchedCapabilities.push({
          capabilityName: req.capability_name,
          requiredWeight: req.weight,
          extractedConfidence: match.confidence,
          contribution: Number(contribution.toFixed(4))
        });
      }
    }

    const rawScore = totalWeight > 0 ? earnedScore / totalWeight : 0.0;
    const fitScore = Math.min(1.0, Math.max(0.0, Number(rawScore.toFixed(4))));

    // Synthesize explainable rationale
    const rationaleParts: string[] = [];
    if (matchedCapabilities.length > 0) {
      const topMatched = [...matchedCapabilities]
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 2)
        .map((m) => m.capabilityName);
      rationaleParts.push(`Starke Übereinstimmung in: ${topMatched.join(", ")}.`);
    }
    if (missingCapabilities.length > 0) {
      const topMissing = [...missingCapabilities]
        .sort((a, b) => b.requiredWeight - a.requiredWeight)
        .slice(0, 2)
        .map((m) => m.capabilityName);
      rationaleParts.push(`Fehlende Anforderungen: ${topMissing.join(", ")}.`);
    }
    if (weakEvidenceCapabilities.length > 0) {
      rationaleParts.push(
        `Schwache Evidenz für ${weakEvidenceCapabilities.length} Fähigkeit(en).`
      );
    }
    if (rationaleParts.length === 0) {
      rationaleParts.push("Keine spezifischen Anforderungen für diese Rolle definiert.");
    }

    const rationale = `Fit Score ${(fitScore * 100).toFixed(1)}%: ${rationaleParts.join(" ")}`;

    // Generate actionable Next Actions
    const nextActions: string[] = [];
    for (const missing of missingCapabilities) {
      if (missing.requiredWeight >= 0.5) {
        nextActions.push(
          `Gezielter Erwerb/Nachweis für hoch gewichtete Fähigkeit "${missing.capabilityName}" (${missing.requiredLevel}).`
        );
      }
    }
    for (const weak of weakEvidenceCapabilities) {
      nextActions.push(
        `Zusätzliche Quellen hochladen zur Untermauerung von "${weak.capabilityName}".`
      );
    }
    if (fitScore >= 0.85) {
      nextActions.push(
        `Hoher Fit Score: Bewerbungsunterlagen auf Rolle "${validJob.title}" bei ${validJob.company} zuschneiden.`
      );
    }

    results.push({
      jobId: validJob.jobId,
      title: validJob.title,
      company: validJob.company,
      fitScore,
      matchedCapabilities,
      missingCapabilities,
      weakEvidenceCapabilities,
      rationale,
      nextActions
    });
  }

  // Sort descending by fitScore
  results.sort((a, b) => b.fitScore - a.fitScore);

  return results;
}
