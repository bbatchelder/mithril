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
# Full-page examples ride along as "id width" pairs; captured after the components
# at their own viewport width (?example=<id> harness, captures/example-<id>.*).
ex_specs=$(node -e "console.log((JSON.parse(require('fs').readFileSync('$OUT/meta.json','utf8')).examples??[]).map(e=>e.id+' '+e.width).join('\n'))")
# Optional slice: <from> <to> (1-based, inclusive), or an explicit id list. Both
# forms restrict the run: a slice skips examples; an id list matches either kind.
if [ $# -ge 2 ] && [[ "$1" =~ ^[0-9]+$ ]]; then ids=$(echo "$ids" | sed -n "${1},${2}p"); ex_specs=""
elif [ $# -ge 1 ]; then
    requested="$*"
    ids=$(echo "$ids" | grep -Fx -f <(printf '%s\n' $requested) || true)
    ex_specs=$(echo "$ex_specs" | awk -v req=" $requested " 'index(req, " " $1 " ")' || true)
fi

# capture_one <capture-key> <theme> <harness-query>  → captures/<capture-key>.<theme>.json
capture_one() {
    local key="$1" theme="$2" query="$3"
    local url="$BASE_URL/?$query"
    [ "$theme" = dark ] && url="$url&theme=dark"
    agent-browser --session $S open "$url" >/dev/null 2>&1
    agent-browser --session $S wait --load networkidle >/dev/null 2>&1 || true
    agent-browser --session $S wait 800 >/dev/null 2>&1
    agent-browser --session $S eval --stdin --json < "$TOOLS/extract.js" > "$OUT/captures/$key.$theme.json" 2>/dev/null
    # sanity: must contain the app root (JSON-escaped), i.e. not a chrome error page
    grep -qF 'id=\"root\"' "$OUT/captures/$key.$theme.json"
}

# capture_both <capture-key> <harness-query> — light+dark with one retry each
capture_both() {
    local key="$1" query="$2"
    for theme in light dark; do
        if ! capture_one "$key" "$theme" "$query"; then
            echo "RETRY $key.$theme (bad capture)"
            sleep 3
            if ! curl -s -o /dev/null "$BASE_URL"; then
                echo "FATAL: dev server down at $key.$theme" >&2
                exit 1
            fi
            capture_one "$key" "$theme" "$query" || { echo "FATAL: capture failed twice for $key.$theme" >&2; exit 1; }
        fi
        agent-browser --session $S screenshot --full "$OUT/captures/$key.$theme.png" >/dev/null 2>&1
        echo "$key.$theme: $(wc -c < "$OUT/captures/$key.$theme.json" | tr -d ' ') bytes"
    done
}

for id in $ids; do
    capture_both "$id" "component=$id"
done

# Examples render full-bleed at their own width (the card width in the kit).
if [ -n "$ex_specs" ]; then
    while read -r id width; do
        [ -n "$id" ] || continue
        agent-browser --session $S set viewport "$width" 1000 >/dev/null
        capture_both "example-$id" "example=$id"
    done <<< "$ex_specs"
fi
echo DONE
