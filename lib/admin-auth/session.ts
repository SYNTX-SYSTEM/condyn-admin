import { randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Server-side admin authentication. It replaces the client-side comparison in `ConDynPanel.tsx`,
 * which read NEXT_PUBLIC_ADMIN_USERNAME / NEXT_PUBLIC_ADMIN_PASSWORD — `next build` inlines every
 * NEXT_PUBLIC_* variable as a literal, so those credentials were published in the client bundle and
 * the gate could be read off, bypassed or replayed by anyone who fetched the JavaScript. Worse, the
 * code fell back to 'condyn'/'condyn' when the variables were absent, so merely REMOVING them would
 * have left default credentials behind.
 *
 * The credentials now live in server-only variables and never reach the browser. Sessions are kept
 * in this process only: nothing to forge, nothing to decrypt, and no new secret to configure. They
 * are lost on restart, which for an admin panel means a new login, not data loss.
 */
export const ADMIN_SESSION_COOKIE = "condyn_admin_session";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type AdminCredentials = { username: string; password: string };

/** Absent or blank credentials authenticate NOBODY — there is deliberately no default. */
export function readAdminCredentials(environment: Record<string, string | undefined> = process.env): AdminCredentials | null {
  const username = environment.ADMIN_USERNAME;
  const password = environment.ADMIN_PASSWORD;
  if (typeof username !== "string" || username.trim() === "") return null;
  if (typeof password !== "string" || password === "") return null;
  return { username, password };
}

/** Constant-time comparison; a length difference must not be observable through timing either. */
function equals(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function credentialsMatch(offered: AdminCredentials, expected: AdminCredentials): boolean {
  const user = equals(offered.username, expected.username);
  const pass = equals(offered.password, expected.password);
  return user && pass;
}

const sessions = new Map<string, number>();

function sweep(now: number): void {
  for (const [id, expiresAt] of sessions) if (expiresAt <= now) sessions.delete(id);
}

export function openAdminSession(now: number = Date.now()): { id: string; expiresAt: number } {
  sweep(now);
  const id = randomBytes(32).toString("base64url");
  const expiresAt = now + SESSION_TTL_MS;
  sessions.set(id, expiresAt);
  return { id, expiresAt };
}

export function adminSessionIsOpen(id: string | undefined, now: number = Date.now()): boolean {
  if (id === undefined || id === "") return false;
  sweep(now);
  const expiresAt = sessions.get(id);
  return expiresAt !== undefined && expiresAt > now;
}

export function closeAdminSession(id: string | undefined): void {
  if (id !== undefined && id !== "") sessions.delete(id);
}

/** Test seam only: the process-local store would otherwise leak between cases. */
export function clearAdminSessions(): void {
  sessions.clear();
}

export function adminSessionCookie(id: string, secure: boolean): string {
  const parts = [`${ADMIN_SESSION_COOKIE}=${id}`, "Path=/", "HttpOnly", "SameSite=Strict", `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function expiredAdminSessionCookie(secure: boolean): string {
  const parts = [`${ADMIN_SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
