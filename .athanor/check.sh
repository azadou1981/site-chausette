#!/usr/bin/env bash
# usage: check.sh [quick [pattern]]
set -u
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/share/athanor/tools/bin:$PATH"
mode="${1:-full}"; pat="${2:-}"
fail=0
step() { local n="$1"; shift; echo "== $n"; timeout 600 "$@" > .athanor/.verif/"$n".log 2>&1 || { echo "FAIL: $n"; tail -n 20 .athanor/.verif/"$n".log; fail=1; }; }
mkdir -p .athanor/.verif
step backend-test bash -c "cd backend && npx vitest run $pat"
step frontend-test bash -c "cd frontend && npx vitest run $pat"
if [ "$mode" != quick ]; then
  step backend-types bash -c "cd backend && npx tsc --noEmit"
  step frontend-build bash -c "cd frontend && npm run build"
  step colours bash -c "grep -rqi '#F6E6D1' frontend/src/*.css && grep -rqi '#ED2939' frontend/src/*.css"
  step health bash -c '
    cd backend; JWT_SECRET=$(printf "x%.0s" {1..40}) PORT=4789 node --import tsx src/server.ts & pid=$!
    for i in $(seq 20); do curl -sf http://localhost:4789/api/health && ok=1 && break; sleep 0.5; done
    kill $pid; [ "${ok:-}" = 1 ]'
  step deliverable-smoke bash deliverable/smoke.sh
  step e2e bash -c "cd e2e && PLAYWRIGHT_BROWSERS_PATH=$HOME/.local/share/athanor/tools/pw npx playwright test"
fi
if [ $fail = 0 ]; then echo "CHECK: PASSED"; else echo "CHECK: FAILED"; exit 1; fi
