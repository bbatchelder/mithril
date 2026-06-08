# Voice, Tone, and Anti-Patterns

How to write copy in this register — and the visual mistakes that immediately break the aesthetic.

## 1. Voice and tone (UI copy)

- **Direct, technical, sentence-case.** "Run pipeline", not "Let's run your pipeline!"
- **Verb-led button labels.** "Save", "Build", "Deploy", "Discard". Never "Click here".
- Errors name the system, the cause, and the next action. *"Pipeline `etl_v3` failed at step 2
  (transform). View logs."*
- Empty states explain what the surface is for and offer one primary action. No mascots.
- Use the user's domain terminology consistently (Object, Dataset, Pipeline, Alert, Case…). Pick
  analogous terms in your product and stick to them.

## 2. Visual anti-patterns (things that break the aesthetic)

- Gradients in chrome (backgrounds, headers, buttons).
- Soft drop shadows on inline content. (A 1px ring + tiny offset on buttons via `shadow-button` is
  fine; floaty card-lift shadows on inline panels are not — reserve `shadow-elevation-*` /
  `shadow-overlay-*` for actual overlays.)
- Rounded corners above 6px on chrome. mithril's canonical radius is `rounded-mithril` (4px); never
  `rounded-2xl`. Only pills/avatars (`rounded-full`) round further.
- Hero illustrations, mascots, emoji in the chrome.
- Centered marketing-style layouts inside the product. A splash/home may center a hero;
  **operational surfaces never do** — they tile edge-to-edge.
- Heavy use of the primary accent. It's a tool, not a wash. Multiple primary-intent buttons on one
  surface is a smell.
- Mixing intent colors on every button (gray + primary + green + red on one toolbar). Pick one primary
  intent per surface; everything else is default gray or minimal/outlined.
- Body text larger than 14px (`text-body`).
- Excessive whitespace — "breathing room" reads as *unfinished* here.
- Pastel backgrounds, glassmorphism, neumorphism.
- Custom display fonts. Use the system stack (`font-sans`) — never Inter/Geist/Manrope/etc.; they
  render softer at 12–14px.
- Extended colors (indigo, violet, turquoise, …) used in chrome — they're for data viz, categorical
  tags, and object-type icons only.
- Runtime `var()` tokens in inline styles — Tailwind v4 tree-shakes them and the style silently drops.
  Use literal utility classes (`bg-blue-3`, `shadow-elevation-2`, `ease-mithril`). This is the single most
  common way a "correct" mithril design renders wrong.
- Mixing light and dark inside one region without threading dark through portals — wrap a *region* in
  `.dark` / `[data-mode="dark"]` and pass `dark={dark}` to any overlay that portals out of it.

## 3. Code-level anti-patterns

mithril's component-composition bites (Button vs AnchorButton for disabled+tooltip, Tooltip-inside-
Popover ordering, Toast singleton, `MenuPopover` for menu-in-popover, focus-driven popover
`anchorOnly`, dark-through-portals, icon-by-name registry, controlled `NumericInput` as string) live in
the **[`mithril`](../../mithril/SKILL.md) composition skill**, not here — that's the skill for *wiring*
components. This skill governs the *look*. When you're about to reach for a component, switch to it.
