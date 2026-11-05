import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookie,
  adminSessionIsOpen,
  closeAdminSession,
  credentialsMatch,
  expiredAdminSessionCookie,
  openAdminSession,
  readAdminCredentials
} from "../../../../lib/admin-auth/session";

/**
 * The admin gate, server-side. The browser never learns the credentials: it posts them here and
 * receives an opaque, httpOnly session cookie it cannot read from JavaScript.
 */
const secure = (request: Request): boolean => new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";

function sessionIdOf(request: Request): string | undefined {
  const header = request.headers.get("cookie");
  if (header === null) return undefined;
  for (const pair of header.split(";")) {
    const [name, ...rest] = pair.trim().split("=");
    if (name === ADMIN_SESSION_COOKIE) return rest.join("=");
  }
  return undefined;
}

/** Whether this browser already holds an open session. It never reveals whether a gate is configured. */
export async function GET(request: Request) {
  return NextResponse.json({ authenticated: adminSessionIsOpen(sessionIdOf(request)) });
}

export async function POST(request: Request) {
  const expected = readAdminCredentials();
  if (expected === null) {
    // Fail closed: without server-side credentials nobody is let in, and the reason is logged, not served.
    console.error("ERR_ADMIN_GATE_NOT_CONFIGURED: ADMIN_USERNAME and ADMIN_PASSWORD are not set; no login is possible.");
    return NextResponse.json({ authenticated: false, code: "ERR_ADMIN_GATE_NOT_CONFIGURED" }, { status: 503 });
  }
  let offered: { username?: unknown; password?: unknown };
  try {
    offered = await request.json();
  } catch {
    return NextResponse.json({ authenticated: false, code: "ERR_ADMIN_LOGIN_MALFORMED" }, { status: 400 });
  }
  if (typeof offered?.username !== "string" || typeof offered?.password !== "string") {
    return NextResponse.json({ authenticated: false, code: "ERR_ADMIN_LOGIN_MALFORMED" }, { status: 400 });
  }
  if (!credentialsMatch({ username: offered.username, password: offered.password }, expected)) {
    // One message for a wrong user and a wrong password: which of the two was wrong is not disclosed.
    return NextResponse.json({ authenticated: false, code: "ERR_ADMIN_LOGIN_INVALID" }, { status: 401 });
  }
  const session = openAdminSession();
  const response = NextResponse.json({ authenticated: true, expiresAt: new Date(session.expiresAt).toISOString() });
  response.headers.set("set-cookie", adminSessionCookie(session.id, secure(request)));
  return response;
}

export async function DELETE(request: Request) {
  closeAdminSession(sessionIdOf(request));
  const response = NextResponse.json({ authenticated: false });
  response.headers.set("set-cookie", expiredAdminSessionCookie(secure(request)));
  return response;
}
