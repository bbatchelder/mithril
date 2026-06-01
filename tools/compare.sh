#!/usr/bin/env bash
#
# Pixel + computed-style comparison harness: mithril vs. Blueprint reference.
#
# Usage:  tools/compare.sh <component> [light|dark|both]
#   <component>   component id present in BOTH gallery registries (e.g. "button")
#   theme         light | dark | both   (default: both)
#
# Drives two headless agent-browser sessions to the two dev servers, each opened
# in isolated single-component mode (?component=<id>&theme=<theme>), and writes to
# tools/comparison/screenshots/:
#   <component>.<theme>.mithril.png     full-page screenshot (mithril  :5173)
#   <component>.<theme>.blueprint.png   full-page screenshot (Blueprint   :5174)
#   <component>.<theme>.diff.png        full-page pixel-diff image (auto-aligned)
#   <component>.<theme>.<key>.spec.png  per-specimen diff crop (only for flagged keys)
#   <component>.<theme>.{mithril,blueprint}.styles.json
#   <component>.<theme>.{mithril,blueprint}.rects.json
# then prints, per theme:
#   1. a computed-style diff for every paired [data-compare] specimen,
#   2. a PER-SPECIMEN visual diff — each [data-compare]/[data-vcompare] element cropped
#      by its own rect and compared (the reliable gate; see diff-specimens.mjs), and
#   3. a full-page visual diff — SSIM over the auto-aligned screenshots, a holistic
#      catch-all (a guide, not a gate; see diff-pixels.mjs).
#
# Dev servers are auto-started if not already reachable (and left running).
#
# NOTE: do NOT pipe this script to `tail`/`head` — if it has to auto-start a dev
# server, the spawned vite/esbuild can inherit the pipe's write end and the pipe
# never closes (the script looks hung). Redirect to a file instead and grep it:
#   tools/compare.sh <id> both > /tmp/cmp-<id>.log 2>&1 ; grep -E 'SSIM|match ·' /tmp/cmp-<id>.log
# (When the servers are already up — e.g. managed by `tap` — nothing is spawned
# and piping is safe, but the file-redirect habit is the reliable default.)

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
    # Detach stdin from /dev/null too (not just stdout/stderr → file): otherwise the
    # spawned vite/esbuild can keep this script's stdout pipe open and a `| tail`
    # caller deadlocks (see header note). Full redirection makes piping safe.
    (cd "$dir" && nohup pnpm dev >"/tmp/mithril-compare-$name.log" 2>&1 </dev/null &)
    for _ in $(seq 1 60); do
        if curl -sf -o /dev/null --max-time 1 "http://localhost:$port"; then
            echo "✓ $name up on :$port"
            return
        fi
        sleep 0.5
    done
    echo "✗ $name failed to come up on :$port — see /tmp/mithril-compare-$name.log" >&2
    exit 1
}

ensure_server "$AUI_PORT" mithril "$ROOT"
ensure_server "$BP_PORT" blueprint "$ROOT/tools/blueprint-reference"

# Computed-style capture expression (color-normalized; see capture-styles.js).
STYLE_EVAL="$(cat "$ROOT/tools/comparison/capture-styles.js")"
# Bounding-rect capture expression (per-specimen crops; see capture-rects.js).
RECT_EVAL="$(cat "$ROOT/tools/comparison/capture-rects.js")"

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
    agent-browser --session "$session" eval "$RECT_EVAL" --json >"$stem.rects.json"
}

for theme in "${THEMES[@]}"; do
    echo
    echo "── $COMPONENT · $theme ─────────────────────────────────"
    capture mithril "$AUI_PORT" "$theme" "aui"
    capture blueprint "$BP_PORT" "$theme" "bp"
    echo "  screenshots: $COMPONENT.$theme.{mithril,blueprint}.png"
    node "$ROOT/tools/comparison/diff-styles.mjs" \
        "$OUT/$COMPONENT.$theme.mithril.styles.json" \
        "$OUT/$COMPONENT.$theme.blueprint.styles.json" \
        "$COMPONENT · $theme"
    echo
    node "$ROOT/tools/comparison/diff-specimens.mjs" \
        "$OUT/$COMPONENT.$theme.mithril.png" \
        "$OUT/$COMPONENT.$theme.blueprint.png" \
        "$OUT/$COMPONENT.$theme.mithril.rects.json" \
        "$OUT/$COMPONENT.$theme.blueprint.rects.json" \
        "$OUT/$COMPONENT.$theme" \
        "$COMPONENT · $theme"
    echo
    node "$ROOT/tools/comparison/diff-pixels.mjs" \
        "$OUT/$COMPONENT.$theme.mithril.png" \
        "$OUT/$COMPONENT.$theme.blueprint.png" \
        "$OUT/$COMPONENT.$theme.diff.png" \
        "$COMPONENT · $theme"
done

echo
echo "✓ done → $OUT"
