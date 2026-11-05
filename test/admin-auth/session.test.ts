import { beforeEach, describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookie,
  adminSessionIsOpen,
  clearAdminSessions,
  closeAdminSession,
  credentialsMatch,
  expiredAdminSessionCookie,
  openAdminSession,
  readAdminCredentials,
  SESSION_TTL_MS
} from "../../lib/admin-auth/session";

/**
 * The admin gate moved from the browser to the server. These tests pin the two properties that made
 * the old gate worthless: no credential may come from a NEXT_PUBLIC_* variable (the build inlines
 * those into the bundle), and there must be NO fallback — the old code accepted 'condyn'/'condyn'
 * whenever the variables were absent, so removing them alone would have left default credentials.
 */
describe("server-side admin gate", () => {
  beforeEach(() => clearAdminSessions());

  it("reads the credentials from server-only variables", () => {
    expect(readAdminCredentials({ ADMIN_USERNAME: "u", ADMIN_PASSWORD: "p" })).toEqual({ username: "u", password: "p" });
  });

  it("authenticates NOBODY when the credentials are missing or blank: there is no default", () => {
    for (const environment of [
      {},
      { ADMIN_USERNAME: "u" },
      { ADMIN_PASSWORD: "p" },
      { ADMIN_USERNAME: "", ADMIN_PASSWORD: "p" },
      { ADMIN_USERNAME: "   ", ADMIN_PASSWORD: "p" },
      { ADMIN_USERNAME: "u", ADMIN_PASSWORD: "" }
    ]) {
      expect(readAdminCredentials(environment)).toBeNull();
    }
  });

  it("ignores NEXT_PUBLIC_* credentials entirely, so nothing is taken from the client bundle", () => {
    expect(readAdminCredentials({ NEXT_PUBLIC_ADMIN_USERNAME: "u", NEXT_PUBLIC_ADMIN_PASSWORD: "p" })).toBeNull();
  });

  it("matches only the exact pair", () => {
    const expected = { username: "admin", password: "correct-horse" };
    expect(credentialsMatch({ username: "admin", password: "correct-horse" }, expected)).toBe(true);
    for (const offered of [
      { username: "admin", password: "correct-hors" },
      { username: "admin", password: "correct-horsee" },
      { username: "admin", password: "" },
      { username: "Admin", password: "correct-horse" },
      { username: "", password: "correct-horse" },
      { username: "admin ", password: "correct-horse" }
    ]) {
      expect(credentialsMatch(offered, expected)).toBe(false);
    }
  });

  it("opens an unguessable session and recognises only that id", () => {
    const session = openAdminSession();
    expect(session.id).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(adminSessionIsOpen(session.id)).toBe(true);
    expect(adminSessionIsOpen(`${session.id}x`)).toBe(false);
    expect(adminSessionIsOpen("")).toBe(false);
    expect(adminSessionIsOpen(undefined)).toBe(false);
  });

  it("issues a different id every time", () => {
    const ids = new Set(Array.from({ length: 50 }, () => openAdminSession().id));
    expect(ids.size).toBe(50);
  });

  it("expires a session and does not keep it around", () => {
    const start = 1_000_000;
    const session = openAdminSession(start);
    expect(adminSessionIsOpen(session.id, start + SESSION_TTL_MS - 1)).toBe(true);
    expect(adminSessionIsOpen(session.id, start + SESSION_TTL_MS)).toBe(false);
  });

  it("closes a session on logout", () => {
    const session = openAdminSession();
    closeAdminSession(session.id);
    expect(adminSessionIsOpen(session.id)).toBe(false);
  });

  it("sets a cookie the browser's JavaScript cannot read and cross-site requests do not send", () => {
    const cookie = adminSessionCookie("abc", true);
    expect(cookie).toContain(`${ADMIN_SESSION_COOKIE}=abc`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Secure");
    expect(adminSessionCookie("abc", false)).not.toContain("Secure");
    expect(expiredAdminSessionCookie(true)).toContain("Max-Age=0");
  });
});
