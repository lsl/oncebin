#!/usr/bin/env bash
# Smoke test: store a secret via oncebin.sh, retrieve it, verify round-trip.
# Starts wrangler dev, runs the test, then tears down.
#
# Usage: ./test.sh

set -euo pipefail

cd "$(dirname "$0")"

PORT=8787
BASE="http://localhost:$PORT"
PID=

cleanup() {
  if [ -n "$PID" ]; then
    kill "$PID" 2>/dev/null
    wait "$PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Ensure local D1 schema is up to date
npx wrangler d1 migrations apply oncebin-db --local 2>/dev/null

# Start dev server in background
npx wrangler dev --port "$PORT" &>"$PWD/.test-server.log" &
PID=$!

# Wait for server to be ready
printf 'Waiting for dev server'
for i in $(seq 1 30); do
  if curl -sf "$BASE/" >/dev/null 2>&1; then
    printf ' ready\n'
    break
  fi
  if ! kill -0 "$PID" 2>/dev/null; then
    printf ' FAILED (server exited)\n'
    cat .test-server.log
    exit 1
  fi
  printf '.'
  sleep 1
done

if ! curl -sf "$BASE/" >/dev/null 2>&1; then
  printf ' FAILED (timeout)\n'
  cat .test-server.log
  exit 1
fi

PASS=0
FAIL=0

run_test() {
  local name="$1"
  shift
  if "$@"; then
    printf '  PASS  %s\n' "$name"
    PASS=$((PASS + 1))
  else
    printf '  FAIL  %s\n' "$name"
    FAIL=$((FAIL + 1))
  fi
}

# --- Tests ---

test_store_and_get() {
  local secret="test-secret-$$-$(date +%s)"
  local url
  url=$(ONCEBIN_URL="$BASE" bash ./public/oncebin.sh "$secret")

  local got
  got=$(ONCEBIN_URL="$BASE" bash ./public/oncebin.sh get "$url")

  [ "$got" = "$secret" ]
}

test_pipe_store_and_get() {
  local secret="piped-secret-$$"
  local url
  url=$(printf '%s' "$secret" | ONCEBIN_URL="$BASE" bash ./public/oncebin.sh)

  local got
  got=$(ONCEBIN_URL="$BASE" bash ./public/oncebin.sh get "$url")

  [ "$got" = "$secret" ]
}

test_burn_once() {
  local url
  url=$(ONCEBIN_URL="$BASE" bash ./public/oncebin.sh "burn-once-test")

  # First read succeeds
  ONCEBIN_URL="$BASE" bash ./public/oncebin.sh get "$url" >/dev/null

  # Second read must fail
  ! ONCEBIN_URL="$BASE" bash ./public/oncebin.sh get "$url" 2>/dev/null
}

test_multiline() {
  local secret
  secret=$(printf 'line one\nline two\nline three')
  local url
  url=$(printf '%s' "$secret" | ONCEBIN_URL="$BASE" bash ./public/oncebin.sh)

  local got
  got=$(ONCEBIN_URL="$BASE" bash ./public/oncebin.sh get "$url")

  [ "$got" = "$secret" ]
}

printf '\nRunning tests...\n'
run_test "store and get (arg)"  test_store_and_get
run_test "store and get (pipe)" test_pipe_store_and_get
run_test "burn-once semantics"  test_burn_once
run_test "multiline content"    test_multiline

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
