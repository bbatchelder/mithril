# AI Surfaces (Deep Dive)

Patterns for AI-product surfaces in the operator register — chat side-panels, agent/flow builders,
tool-call traces, streaming responses, citations, and eval/observability. These are vendor-neutral
distillations; mithril targets this surface family directly (the SOC demo, the project's AI direction).
Render everything in mithril tokens — quiet gray chrome, color reserved for state.

## 1. The AI side panel

The most common AI surface: a **dark side panel** docked beside the main content, distinct from the
surrounding shell, that follows the user across views. ~450px wide, wrapped in a `.dark` /
`[data-mode="dark"]` region so it stays dark even over light main content. Dock side is a product
choice; the constant is "a dark side panel with a composer pinned at the bottom."

**Empty state**: a small product/AI glyph, a title + subtitle, and (optionally) a few stacked
assistant-selection cards (each: name + one-line capability blurb, with a "Default" pill on the
primary one), above a minimal-button entry point to a custom assistant.

**Composer (footer)**: a `<textarea>` (~40px tall, `rounded-mithril`) with placeholder "Ask a question…",
a recessed background relative to the panel (e.g. `bg-[var(--code-background)]` or a ~30% black overlay
in dark), and affordances on the right edge (send, optionally mic / attach).

**Header strip**: title, an optional retention/scope pill, new-chat `+`, a thread switcher, and close
`×`. Multi-threaded history with a switcher is common.

> Reminder: this panel portals nothing by itself, but any Popover/Menu/Tooltip *inside* it that portals
> to `document.body` must receive `dark={dark}` — see the [`mithril`](../../mithril/SKILL.md) skill.

## 2. Chat / message composition

- **Messages**: prose in sans (`text-body`); tool I/O, code, and structured payloads in **mono with
  syntax highlighting**. User vs assistant differentiated by alignment/background, not loud color.
- **Card-based reveal**: tool calls, reasoning steps, and citations render as **expandable cards or
  inline bubbles, never modals** — the conversation stays linear and scrollable.
- **Streaming**: token-by-token rendering with a subtle pulsing cursor; markdown rendered
  incrementally. Offer a text loading message or a spinner while the first token is pending.

## 3. Tool-call rendering & traces

When the agent runs a tool, **render the call, never hide it** — power users want to see what the model
did.

- Inline: each invocation is an **expandable block card** showing the generated prompt/args (input) and
  the result (output), mono + highlighted.
- Deep trace: a **timeline of nested spans** with parent/child shown by indentation, **color-coded by
  span source** (e.g. function vs action vs LLM call — a sanctioned use of extended/categorical color,
  since it's data). Selecting a span opens a **detail drawer** with execution time, prompt/response,
  token usage, and a stack trace for failures.

## 4. Citations & grounding

Two simultaneous renderings:

1. **Inline citation bubbles** in the response text; click behavior is type-aware (a record citation
   opens the object, a document citation opens the cited page, a URL navigates out).
2. A **"Sources" affordance at the bottom of each message** aggregating the cited material for that turn.

Keep citation classes to a small, learnable set (records / documents / URLs).

## 5. Agent / flow builder

For configuring an agent or a multi-step LLM flow (composes with the node-graph editor in
[layout-and-shell.md](layout-and-shell.md) §4.4):

- **Three-pane editor**: left = inputs/blocks palette; center = the flow (chain-of-thought rendered as
  expandable/collapsible block cards with inline tool-call review); right = a run panel that doubles as
  the eval surface (prior runs listed; tests created from any run).
- The signature primitive is an **LLM block** — a card with stacked sections: prompt (multiline sans),
  tools (chip-list from a dropdown), and a typed output variable. Model selection lives inside the
  block. A small eval-hook affordance (a flask/marker glyph) flags a parameter for evaluation.
- A single-form **assistant config** alternative: name/description/avatar header; tabs for system
  prompt, retrieval context, tools, model, conversation starters; a Save / Test / Publish cluster;
  bottom monitoring/usage tabs. System-prompt editing uses a `/`-command palette to inject variables.

## 6. Evals & observability

- **Evals**: a tabular grid of test cases with auto-computed Passed/Failed badges and an aggregate
  pass-% banner. Hovering a row reveals Open / Debug → a debug view with input/output, expected-vs-
  actual, and syntax-highlighted previews. Multi-target runs show a **side-by-side comparison**.
- **Metrics dashboard**: charts aggregated across runs (token / request volume, compute, latency) —
  build it with the observability grammar in [observability-surfaces.md](observability-surfaces.md).

## 7. Empty / loading / error states

- **Loading**: a customizable text message or a spinner; stream block cards in as they execute.
- **Failed tool call**: the trace span renders with an error indicator; the detail drawer surfaces the
  stack trace and error message. Eval rows flip to `Failed` and expose the stack.
- **No-knowledge fallback**: surface a suggested next action (file a question / try a different source)
  rather than a dead end.

## 8. AI visual idiom summary

- **Panels**: 2- or 3-pane layouts — history/files left, work area center, run/eval/assist right. The
  assist side panel is the canonical dock.
- **Typography**: sans for chat; mono + syntax highlighting for tool I/O, prompts in traces, and code.
- **Color**: trace spans color-coded by source; pass/fail badges in status color. Chrome stays gray.
- **Iconography**: a consistent AI/spark entry glyph; a marker (flask) for eval hooks; a neutral
  default avatar.
- **Card-based reveal**: tool calls, steps, and citations are expandable cards or inline bubbles —
  never modal.
