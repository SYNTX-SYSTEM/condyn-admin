"use client";

import { useEffect, useRef, useState } from "react";
import { readJobPoolUpload } from "./useJobPool";
import { validateJobScope, type JobScope, type JobScopeValidation } from "../job-pool/job-scope";

/** Validates the selected job scope against the exact upload it names (one read per scope; stale reads are dropped). */
export function useJobScopeValidation(scope: JobScope | null, fetcher?: typeof fetch): JobScopeValidation {
  const [validation, setValidation] = useState<JobScopeValidation>(scope === null ? { state: "NONE" } : { state: "CHECKING", scope });
  const generation = useRef(0);
  const uploadId = scope?.jobPoolUploadId ?? null;
  const roleId = scope?.poolRoleId ?? null;
  useEffect(() => {
    const current = generation.current + 1;
    generation.current = current;
    if (uploadId === null || roleId === null) { setValidation({ state: "NONE" }); return; }
    const exact: JobScope = { jobPoolUploadId: uploadId, poolRoleId: roleId };
    setValidation({ state: "CHECKING", scope: exact });
    void readJobPoolUpload(uploadId, fetcher)
      .then((view): JobScopeValidation => view.state === "AVAILABLE" ? validateJobScope(exact, view.upload) : { state: "INVALID", scope: exact, reason: view.state === "NOT_FOUND" ? "UPLOAD_NOT_FOUND" : "READ_FAILED" })
      .catch((): JobScopeValidation => ({ state: "INVALID", scope: exact, reason: "READ_FAILED" }))
      .then(next => { if (generation.current === current) setValidation(next); });
  }, [uploadId, roleId, fetcher]);
  return validation;
}
