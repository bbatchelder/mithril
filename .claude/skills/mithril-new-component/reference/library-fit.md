# Does a third-party library fit mithril?

mithril is an **owned-source, token-styled** system: consumers copy the component source and own it,
and *all* visual coherence flows from `src/styles/tokens.css` (CVA + literal Tailwind classes). That
premise dictates which third-party libraries can become mithril components and which can't.

## The one question that decides it

**Does the library give you *behavior* (and let you render/style the DOM), or does it give you a
*finished, self-styled widget*?**

- **Headless / hook / primitive → fits.** It supplies logic (state, a11y, keyboard, validation) and
  you own every DOM node and style it from tokens. This is exactly how mithril already wraps Radix.
  The library becomes an *implementation detail* of a component you own. Examples that fit: Radix
  primitives, `react-dropzone` (`useDropzone`), `react-day-picker`, TanStack Table/Virtual.

- **Pre-styled, self-contained widget → fights the system.** It ships its own DOM, its own CSS (you
  `import "thing/dist/thing.css"`), and its own theming layer (CSS variables, `::part`, SCSS vars).
  You can't "own" it shadcn-style, it bypasses the token system, and re-skinning it to match mithril
  in both light/dark is a constant tax. These belong (if anywhere) in a **demo app** as a dependency,
  not in `src/components/ui/` as a design-system component. Example that doesn't fit: **FilePond**.

## Worked example — react-dropzone vs FilePond (the file-upload decision)

| | react-dropzone | FilePond |
|---|---|---|
| Shape | Headless hook (`useDropzone`) | Pre-built styled widget |
| You style with | mithril tokens (you own the DOM) | Override *its* CSS vars / SCSS |
| Imported CSS | none | required core + per-plugin CSS |
| Dark mode | free (mithril `.dark` tokens) | re-theme its variables separately |
| Owned-source / registry | clean — your code wrapping a hook | awkward — a skinned third-party widget |
| Verdict for mithril | **fits — chose this** | great library, wrong shape for the system |

FilePond is genuinely excellent (image preview, chunked uploads, EXIF) — but that value comes from
being a batteries-included styled widget, which is precisely what a token-driven owned-source library
can't absorb. The result was `src/components/ui/file-dropzone.tsx` on `react-dropzone`, styled
entirely from tokens, with all markup hand-owned. (See the [[mithril-composition-skill]] forms
reference for the FileInput-vs-FileDropzone split and the `getInputProps({ disabled })` gotcha.)

## Checklist before adding any UI npm dependency

1. Is it headless, or does it require importing its CSS? (CSS import → strong signal it doesn't fit.)
2. Can you render every DOM node yourself and style from tokens? If not, reconsider.
3. Is it React 19-compatible (peer deps, no legacy `findDOMNode`)? Check `npm view <pkg> peerDependencies`.
4. How heavy is it, and does it tree-shake? Prefer hooks (tiny) over engines (large).
5. If it *is* a styled widget you still want, put it in a **demo app**, not the component library.

Once it passes, return to `SKILL.md` step 1 and build the wrapper like any other mithril component;
remember step 5 there — add the package name to `tools/gen-registry.mjs` `NPM_PREFIXES` so the
registry lists it as a dependency.
