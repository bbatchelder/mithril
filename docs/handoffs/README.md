# Session handoffs

This project is built across many focused sessions. Each session ends by writing a **handoff document**
that records what was done and what comes next, so a fresh session (or a different person/agent) can pick
up with full context.

## How it works

- One handoff per working session, named `NNNN-slug.md` (zero-padded, increasing), e.g.
  `0001-foundation-and-harness.md`.
- **The newest handoff is the entry point.** To bootstrap a session: read the highest-numbered file here,
  then skim `/CLAUDE.md` for durable rules.
- Handoffs are append-only history — don't rewrite old ones. If something in an old handoff turns out
  wrong, note the correction in the *next* handoff.
- Use `TEMPLATE.md` as the starting structure.

## Writing a good handoff

- Be concrete in **Next steps**: name files, list the exact component/variant, link the relevant Blueprint
  source path. The reader should be able to start without re-deriving context.
- Record **decisions and their rationale** — especially anything that diverges from Blueprint or that a
  future session might be tempted to "fix" without knowing why.
- Capture **gotchas** discovered this session (build quirks, tooling, fidelity traps).
- State what was **verified** (and how) vs. what is assumed.

## Reading order

Handoffs are numbered `0001`…`NNNN` in build order. Rather than maintain a hand-written index
here (it drifts), just sort the directory — the files are zero-padded, so lexical order is build order.

- **Start here:** the highest-numbered file is always the current entry point.
- `0001-foundation-tokens-harness-button.md` — where it began: scaffold, design tokens, the comparison
  harness, the handoff process, and the Button slice.
- `0058-project-complete.md` — the milestone marking the full Blueprint surface (~54 components) complete.
- Everything after `0058` is post-completion work (e.g. `0059` — the full 706-glyph icon port).
