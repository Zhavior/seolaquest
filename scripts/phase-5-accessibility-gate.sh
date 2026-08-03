#!/usr/bin/env bash
set -Eeuo pipefail

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_directory}/.." && pwd)"
runner="${script_directory}/phase-5-accessibility-gate.mjs"

cd "${project_root}"

if [[ ! -f "${runner}" ]] || [[ ! -f "tests/accessibility/public-routes.json" ]]; then
  echo "ACCESSIBILITY GATE PREREQUISITE FAILED: gate runner or route manifest is missing." >&2
  exit 2
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "ACCESSIBILITY GATE PREREQUISITE FAILED: Node.js and npm are required." >&2
  exit 2
fi

if [[ -n "${A11Y_BASE_URL:-}" ]]; then
  exec node "${runner}" --base-url "${A11Y_BASE_URL}"
fi

gate_port="${A11Y_PORT:-4173}"
if [[ ! "${gate_port}" =~ ^[0-9]+$ ]] || (( gate_port < 1024 || gate_port > 65535 )); then
  echo "ACCESSIBILITY GATE PREREQUISITE FAILED: A11Y_PORT must be an integer from 1024 to 65535." >&2
  exit 2
fi

base_url="http://localhost:${gate_port}"
if curl --silent --show-error --fail --max-time 2 "${base_url}" >/dev/null 2>&1; then
  echo "ACCESSIBILITY GATE PREREQUISITE FAILED: ${base_url} is already in use. Set A11Y_PORT to a free port or A11Y_BASE_URL to the intended deployment." >&2
  exit 2
fi

if [[ "${A11Y_SKIP_BUILD:-0}" == "1" ]]; then
  if [[ ! -f ".next/BUILD_ID" ]]; then
    echo "ACCESSIBILITY GATE PREREQUISITE FAILED: A11Y_SKIP_BUILD=1 requires an existing production .next build." >&2
    exit 2
  fi
  echo "Using the existing production build because A11Y_SKIP_BUILD=1."
else
  echo "Building the production app for the accessibility release gate..."
  npm run build
fi

server_log="$(mktemp -t coquest-a11y-server.XXXXXX.log)"
npm run start -- --hostname localhost --port "${gate_port}" >"${server_log}" 2>&1 &
server_pid=$!

cleanup() {
  if kill -0 "${server_pid}" >/dev/null 2>&1; then
    kill "${server_pid}" >/dev/null 2>&1 || true
    wait "${server_pid}" 2>/dev/null || true
  fi
  rm -f "${server_log}"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

ready=0
startup_deadline=$((SECONDS + 60))
while (( SECONDS < startup_deadline )); do
  if curl --silent --show-error --fail --max-time 2 "${base_url}" >/dev/null 2>&1; then
    ready=1
    break
  fi
  if ! kill -0 "${server_pid}" >/dev/null 2>&1; then
    echo "ACCESSIBILITY GATE PREREQUISITE FAILED: production server exited during startup." >&2
    sed -n '1,200p' "${server_log}" >&2
    exit 2
  fi
  sleep 1
done

if [[ "${ready}" != "1" ]]; then
  echo "ACCESSIBILITY GATE PREREQUISITE FAILED: production server was not ready at ${base_url} within 60 seconds." >&2
  sed -n '1,200p' "${server_log}" >&2
  exit 2
fi

node "${runner}" --base-url "${base_url}"
