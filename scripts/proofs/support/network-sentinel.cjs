/* eslint-disable @typescript-eslint/no-require-imports -- preloaded with node --require, so it must be CommonJS */
/**
 * Network sentinel of the JOB POOL FIRST proofs (preloaded with NODE_OPTIONS=--require). Every outbound request of
 * the process (fetch, http, https, and TCP to a non-loopback host) is recorded in PROOF_NETWORK_LOG and refused, so a
 * proof can show that a refused path never tried to reach Gemini. Loopback TCP (the disposable test database) and
 * unix sockets stay open.
 */
const fs = require("node:fs");
const net = require("node:net");

const log = process.env.PROOF_NETWORK_LOG;
const record = (kind, target) => {
  if (log) fs.appendFileSync(log, `${JSON.stringify({ kind, target: String(target ?? "").slice(0, 160), pid: process.pid })}\n`);
};
const refusal = (kind) => new Error(`PROOF_NETWORK_BLOCKED ${kind}`);

globalThis.fetch = async (input) => {
  record("fetch", typeof input === "string" ? input : input && (input.url || input.href));
  throw refusal("fetch");
};
for (const name of ["http", "https"]) {
  const client = require(`node:${name}`);
  const blocked = (target) => {
    record(name, typeof target === "string" ? target : target && (target.href || target.host || target.hostname));
    throw refusal(name);
  };
  client.request = blocked;
  client.get = blocked;
}
const loopback = (host) => host === undefined || host === "localhost" || host === "::1" || /^127\./.test(host);
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const options = args[0];
  const host = typeof options === "object" && options !== null ? options.host : typeof args[1] === "string" ? args[1] : undefined;
  const path = typeof options === "object" && options !== null ? options.path : typeof options === "string" ? options : undefined;
  if (path === undefined && !loopback(host)) {
    record("tcp", host);
    throw refusal("tcp");
  }
  return connect.apply(this, args);
};
