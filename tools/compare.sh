#!/usr/bin/env bash
#
# Pixel + computed-style comparison harness: analyst-ui vs. Blueprint reference.
#
# Usage:  tools/compare.sh <component> [light|dark|both]
#   <component>   component id present in BOTH gallery registries (e.g. "button")
#   theme         light | dark | both   (default: both)
#
# Drives two headless agent-browser sessions to the two dev servers, each opened
# in isolated single-component mode (?component=<id>&theme=<theme>), and writes to
# tools/comparison/screenshots/:
#   <component>.<theme>.analyst.png     full-page screenshot (analyst-ui  :5173)
#   <component>.<theme>.blueprint.png   full-page screenshot (Blueprint   :5174)
#   <component>.<theme>.{analyst,blueprint}.styles.json
# then prints a computed-style diff for every paired [data-compare] specimen.
#
# Dev servers are auto-started if not already reachable (and left running).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/tools/comparison/screenshots"
AUI_PORT=5173
BP_PORT=5174
VIEWPORT_W=900
VIEWPORT_H=900

COMPONENT="${1:-}"
THEME_ARG="${2:-both}"
if [ -z "$COMPONENT" ]; then
    echo "usage: tools/compare.sh <component> [light|dark|both]" >&2
    exit 2
fi
case "$THEME_ARG" in
    light) THEMES=(light) ;;
    dark) THEMES=(dark) ;;
    both) THEMES=(light dark) ;;
    *) echo "theme must be light|dark|both (got '$THEME_ARG')" >&2; exit 2 ;;
esac

mkdir -p "$OUT"

# --- ensure a dev server is reachable, starting it in the background if not ---
ensure_server() {
    local port="$1" name="$2" dir="$3"
    if curl -sf -o /dev/null --max-time 2 "http://localhost:$port"; then
        echo "✓ $name already running on :$port"
        return
    fi
    echo "… starting $name dev server on :$port"
    (cd "$dir" && nohup pnpm dev >"/tmp/analyst-compare-$name.log" 2>&1 &)
    for _ in $(seq 1 60); do
        if curl -sf -o /dev/null --max-time 1 "http://localhost:$port"; then
            echo "✓ $name up on :$port"
            return
        fi
        sleep 0.5
    done
    echo "✗ $name failed to come up on :$port — see /tmp/analyst-compare-$name.log" >&2
    exit 1
}

ensure_server "$AUI_PORT" analyst "$ROOT"
ensure_server "$BP_PORT" blueprint "$ROOT/tools/blueprint-reference"

# Computed-style capture expression (color-normalized; see capture-styles.js).
STYLE_EVAL="$(cat "$ROOT/tools/comparison/capture-styles.js")"

capture() {
    local side="$1" port="$2" theme="$3" session="$4"
    local url="http://localhost:$port/?component=$COMPONENT&theme=$theme"
    local stem="$OUT/$COMPONENT.$theme.$side"
    agent-browser --session "$session" set viewport "$VIEWPORT_W" "$VIEWPORT_H" >/dev/null
    agent-browser --session "$session" open "$url" >/dev/null
    agent-browser --session "$session" wait --load networkidle >/dev/null 2>&1 || true
    # Bail clearly if the component id isn't in this gallery's registry.
    local count
    count="$(agent-browser --session "$session" eval 'document.querySelectorAll("[data-compare]").length' --json | node -e 'process.stdin.on("data",d=>{try{console.log(JSON.parse(d).data.result)}catch{console.log(0)}})')"
    if [ "${count:-0}" -eq 0 ]; then
        echo "✗ no [data-compare] specimens for '$COMPONENT' on $side ($url)" >&2
        echo "  (is '$COMPONENT' registered in that gallery, with tagged specimens?)" >&2
        exit 1
    fi
    agent-browser --session "$session" screenshot --full "$stem.png" >/dev/null
    agent-browser --session "$session" eval "$STYLE_EVAL" --json >"$stem.styles.json"
}

for theme in "${THEMES[@]}"; do
    echo
    echo "── $COMPONENT · $theme ─────────────────────────────────"
    capture analyst "$AUI_PORT" "$theme" "aui"
    capture blueprint "$BP_PORT" "$theme" "bp"
    echo "  screenshots: $COMPONENT.$theme.{analyst,blueprint}.png"
    node "$ROOT/tools/comparison/diff-styles.mjs" \
        "$OUT/$COMPONENT.$theme.analyst.styles.json" \
        "$OUT/$COMPONENT.$theme.blueprint.styles.json" \
        "$COMPONENT · $theme"
done

echo
echo "✓ done → $OUT"
