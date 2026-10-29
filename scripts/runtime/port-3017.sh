#!/usr/bin/env bash
# Controlled start/stop of the owner demo (hr-loop:local with the career worker) on one checkout.
#
#   scripts/runtime/port-3017.sh status
#   scripts/runtime/port-3017.sh stop
#   scripts/runtime/port-3017.sh start <checkout-dir> [--no-worker]
#   scripts/runtime/port-3017.sh switch <checkout-dir>        stop, start there, health check, roll back on failure
#
# Rollback to the previous stand is the same command pointed at the old checkout:
#   scripts/runtime/port-3017.sh switch /home/codi/Entwicklung/condyn-admin-role-discovery
#
# The demo database is a verified disposable database named in <checkout>/.hr-loop-local/state.json; stopping keeps it. No secret is
# printed or stored here: the operator environment is read from the main checkout's .env.local and the test-role file at start.
# No model call is made by this script; the career worker (if started) only works on jobs that a user submits.
set -uo pipefail

PORT="${HR_LOOP_LOCAL_PORT:-3017}"
ENV_FILE="${CONDYN_ENV_FILE:-/home/codi/Entwicklung/condyn-admin/.env.local}"
ROLE_FILE="${CONDYN_TEST_ROLE_FILE:-$HOME/.config/condyn/test-db-role.env}"
LOG_DIR="${CONDYN_RUNTIME_LOG_DIR:-$HOME/.local/state/condyn-runtime}"
# Semantic investigation of the role discovery: the labelled stand-in only ("no model"), explicit day limit (fails closed to 0 without it).
# Override per call to change; unset ROLE_DISCOVERY_SEMANTIC_PROVIDER by exporting it empty to disable the start. Real Gemini needs its own owner GO.
export ROLE_DISCOVERY_SEMANTIC_PROVIDER="${ROLE_DISCOVERY_SEMANTIC_PROVIDER-stand-in}"
export ROLE_DISCOVERY_DAY_LIMIT="${ROLE_DISCOVERY_DAY_LIMIT-1000}"

listener_pid() { ss -ltnpH "sport = :$PORT" 2>/dev/null | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2; }

# The script process that owns the listener: the node process running hr-decision-loop-local.ts (it has the SIGTERM handler that stops
# the server and the worker and keeps the database). The npm/tsx wrappers above it only forward badly and are left alone.
launcher_pid() {
  local pid; pid="$(listener_pid)"; [ -n "$pid" ] || return 1
  while [ -n "$pid" ] && [ "$pid" -gt 1 ]; do
    local cmd; cmd="$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null)"
    case "$cmd" in
      *"--import"*hr-decision-loop-local.ts*) echo "$pid"; return 0 ;;
    esac
    pid="$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')"
  done
  return 1
}

cmd_status() {
  local l; l="$(listener_pid)"
  if [ -z "$l" ]; then echo "port $PORT: free"; return 1; fi
  echo "port $PORT: listener pid $l cwd $(readlink "/proc/$l/cwd") launcher $(launcher_pid || echo none)"
  curl -s -o /dev/null -w "GET /career/demo -> %{http_code}\n" "http://127.0.0.1:$PORT/career/demo"
}

cmd_stop() {
  local l; l="$(launcher_pid)" || { echo "no hr-loop launcher on port $PORT"; return 0; }
  echo "SIGTERM launcher $l (cwd $(readlink "/proc/$l/cwd"))"
  kill -TERM "$l"
  for _ in $(seq 1 60); do [ -z "$(listener_pid)" ] && { echo "port $PORT: free"; return 0; }; sleep 1; done
  echo "port $PORT still busy after 60 s" >&2; return 1
}

cmd_start() {
  local dir="${1:?checkout dir}"; shift || true
  local worker=1; [ "${1:-}" = "--no-worker" ] && worker=0
  [ -f "$dir/scripts/hr-decision-loop-local.ts" ] || { echo "not a checkout: $dir" >&2; return 2; }
  [ -z "$(listener_pid)" ] || { echo "port $PORT is busy" >&2; return 1; }
  [ -f "$dir/.hr-loop-local/state.json" ] || { echo "no $dir/.hr-loop-local/state.json (the script would create a new database)" >&2; return 2; }
  mkdir -p "$LOG_DIR"; local log="$LOG_DIR/port-$PORT-$(date +%Y%m%dT%H%M%S).log"
  ( cd "$dir" && set -a && . "$ENV_FILE" && . "$ROLE_FILE" && set +a && unset DATABASE_URL CONDYN_ALLOW_SHARED_DATABASE \
    && HR_LOOP_LOCAL_PORT="$PORT" exec setsid npm run "$([ $worker = 1 ] && echo job-pool:local || echo hr-loop:local)" ) > "$log" 2>&1 < /dev/null &
  echo "started from $dir, log $log"
  for _ in $(seq 1 180); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/career/demo" 2>/dev/null)" = "200" ] && { echo "ready: GET /career/demo -> 200"; return 0; }
    sleep 2
  done
  echo "not ready after 360 s, see $log" >&2; return 1
}

cmd_switch() {
  local target="${1:?target checkout}"
  local old=""; old="$(listener_pid)"; [ -n "$old" ] && old="$(readlink "/proc/$old/cwd")"
  cmd_stop || return 1
  if cmd_start "$target"; then echo "switched to $target"; return 0; fi
  echo "target failed; rolling back to ${old:-none}" >&2
  cmd_stop >/dev/null 2>&1
  [ -n "$old" ] && cmd_start "$old"
  return 1
}

case "${1:-status}" in
  status) cmd_status ;;
  stop) cmd_stop ;;
  start) shift; cmd_start "$@" ;;
  switch) shift; cmd_switch "$@" ;;
  *) echo "usage: $0 status|stop|start <dir> [--no-worker]|switch <dir>" >&2; exit 2 ;;
esac
