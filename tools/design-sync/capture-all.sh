#!/usr/bin/env bash
#
# Capture rendered DOM (+ a ground-truth screenshot) for every gallery showcase,
# light+dark, into dist-design/captures/. Drives a headless `agent-browser`
# session against the dev server's isolated harness (?component=<id>&theme=…).
#
# Usage:
#   tools/design-sync/capture-all.sh                 # all components
#   tools/design-sync/capture-all.sh 1 10            # slice (1-based, inclusive)
#   tools/design-sync/capture-all.sh dialog toast    # explicit id list
#
# Requires: the dev server on $MITHRIL_URL (default :5173 — `tap run mithril-demo
# -- pnpm run dev`), and the `agent-browser` CLI. If every capture fails instantly
# with "daemon may be busy or unresponsive", the agent-browser daemon wedged on a
# cold start: `agent-browser close --all` and re-run (resume via slice/id args).
set -uo pipefail
TOOLS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$TOOLS/../.." && pwd)"
OUT="$REPO/dist-design"
BASE_URL="${MITHRIL_URL:-http://localhost:5173}"
S=mithril-ds-capture

if ! curl -s -o /dev/null "$BASE_URL"; then
    echo "FATAL: dev server not reachable at $BASE_URL (tap run mithril-demo -- pnpm run dev)" >&2
    exit 1
fi

node "$TOOLS/gen-meta.mjs"
mkdir -p "$OUT/captures"
agent-browser --session $S set viewport 900 900 >/dev/null

ids=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$OUT/meta.json','utf8')).components.map(c=>c.id).join('\n'))")
# Optional slice: <from> <to> (1-based, inclusive), or an explicit id list.
if [ $# -ge 2 ] && [[ "$1" =~ ^[0-9]+$ ]]; then ids=$(echo "$ids" | sed -n "${1},${2}p")
elif [ $# -ge 1 ]; then ids="$*"; fi

capture_one() {
    local id="$1" theme="$2"
    local url="$BASE_URL/?component=$id"
    [ "$theme" = dark ] && url="$url&theme=dark"
    agent-browser --session $S open "$url" >/dev/null 2>&1
    agent-browser --session $S wait --load networkidle >/dev/null 2>&1 || true
    agent-browser --session $S wait 800 >/dev/null 2>&1
    agent-browser --session $S eval --stdin --json < "$TOOLS/extract.js" > "$OUT/captures/$id.$theme.json" 2>/dev/null
    # sanity: must contain the app root (JSON-escaped), i.e. not a chrome error page
    grep -qF 'id=\"root\"' "$OUT/captures/$id.$theme.json"
}

for id in $ids; do
    for theme in light dark; do
        if ! capture_one "$id" "$theme"; then
            echo "RETRY $id.$theme (bad capture)"
            sleep 3
            if ! curl -s -o /dev/null "$BASE_URL"; then
                echo "FATAL: dev server down at $id.$theme" >&2
                exit 1
            fi
            capture_one "$id" "$theme" || { echo "FATAL: capture failed twice for $id.$theme" >&2; exit 1; }
        fi
        agent-browser --session $S screenshot --full "$OUT/captures/$id.$theme.png" >/dev/null 2>&1
        echo "$id.$theme: $(wc -c < "$OUT/captures/$id.$theme.json" | tr -d ' ') bytes"
    done
done
echo DONE
