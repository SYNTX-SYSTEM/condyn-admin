/** Typed failure of the Job Pool connection; `status` is the HTTP status the route maps it to. */
export class JobPoolError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly issues: Array<{ path: string; message: string }> = []
  ) {
    super(`${code}: ${message}`);
    this.name = "JobPoolError";
  }
}

export const isJobPoolError = (value: unknown): value is JobPoolError => value instanceof JobPoolError;
