/* GRÜN lab network sentinel (preloaded with NODE_OPTIONS=--require): every outbound connection to a non-loopback host is recorded in
 * LAB_NET_LOG and refused, so no request can leave the machine (no live Gemini). Loopback (the disposable database, the local Gemini
 * stand-in, the Next server itself) and unix sockets stay open. */
const fs = require("node:fs");
const net = require("node:net");
const log = process.env.LAB_NET_LOG;
const record = (kind, target) => { if (log) fs.appendFileSync(log, `${JSON.stringify({ kind, target: String(target ?? "").slice(0, 160), pid: process.pid, at: new Date().toISOString() })}\n`); };
const loopbackHost = (host) => host === undefined || host === null || host === "" || host === "localhost" || host === "::1" || host === "[::1]" || /^127\./.test(host);
const hostOf = (target) => { try { return new URL(typeof target === "string" ? target : target.url || target.href).hostname; } catch { return null; } };
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const host = hostOf(input);
  if (host !== null && loopbackHost(host)) return originalFetch(input, init);
  record("fetch", typeof input === "string" ? input : input && (input.url || input.href));
  throw new Error("LAB_NETWORK_BLOCKED fetch");
};
for (const name of ["http", "https"]) {
  const client = require(`node:${name}`);
  const request = client.request, get = client.get;
  const guard = (original) => function (target, ...rest) {
    const host = typeof target === "string" || target instanceof URL ? hostOf(target) : target && (target.hostname || target.host);
    if (loopbackHost(host === null ? undefined : String(host).replace(/:\d+$/, ""))) return original.call(this, target, ...rest);
    record(name, typeof target === "string" ? target : target && (target.href || target.hostname || target.host));
    throw new Error(`LAB_NETWORK_BLOCKED ${name}`);
  };
  client.request = guard(request); client.get = guard(get);
}
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const options = args[0];
  const host = typeof options === "object" && options !== null ? options.host : typeof args[1] === "string" ? args[1] : undefined;
  const path = typeof options === "object" && options !== null ? options.path : typeof options === "string" ? options : undefined;
  if (path === undefined && !loopbackHost(host)) { record("tcp", host); throw new Error("LAB_NETWORK_BLOCKED tcp"); }
  return connect.apply(this, args);
};
