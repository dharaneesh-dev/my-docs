# Sidebar Redesign Plan

Make the docs sidebar feel like a real product nav (à la Google Cloud docs / Linear): cleaner active state, support for arbitrarily nested sections, and a proper mobile drawer. Everything driven from one config object so adding a section is a one-line change.

## Goals

1. Replace the "pill + side bar + filled bg" active style with a single, calm active treatment.
2. Support recursive nesting (Category → Subcategory → … → Doc) instead of the current flat 1-level groups.
3. Mobile: sidebar becomes a slide-in drawer with overlay, opened from a hamburger in the top nav. Auto-closes on navigation.
4. Make the whole tree configurable from `src/lib/docs-manifest.ts` — no code changes needed to add/reorder/nest sections.

## Visual design (active + hover)

- Active row: subtle `bg-accent/60`, `text-foreground`, `font-medium`, no left bar, no pill. A 2px left border on the row's container handles the "you are here" cue in a quieter way.
- Hover: `bg-muted/60`, `text-foreground`. No shape change, no rounded-r-full pills.
- Group header: small caps label, muted, with chevron. No background on hover except a faint `bg-muted/40`.
- Indentation: 12px per nesting level via a `depth` prop. A thin vertical guide line (`border-l border-border/60`) runs down each nested branch so the hierarchy reads at a glance.
- Spacing: tighter vertical rhythm (28px row height) so deeper trees still fit.

## Nesting model

Change `DocEntry` to support a tree:

```ts
type DocNode =
  | { kind: "doc"; slug: string; title: string; icon?: string }
  | { kind: "section"; label: string; icon?: string; defaultOpen?: boolean; children: DocNode[] };

export const DOCS_TREE: DocNode[] = [
  { kind: "section", label: "AI", children: [
    { kind: "section", label: "Foundations", children: [
      { kind: "doc", slug: "machine-learning", title: "ML & Deep Learning" },
    ]},
    { kind: "doc", slug: "agentic-ai", title: "Agentic AI Systems" },
  ]},
  { kind: "section", label: "Systems", children: [ ... ]},
];
```

Keep a derived flat `DOCS` array (computed from the tree) so existing routes, search, TOC, and prev/next still work without churn.

## Recursive renderer

One `<SidebarNode node depth />` component that:
- Renders a `<Link>` if `kind === "doc"`.
- Renders a collapsible group if `kind === "section"`, recursing on `children`.
- Auto-opens any section whose subtree contains the active route.
- Persists open/closed state per-section in `localStorage` (key: `sidebar:open:<label-path>`).

This removes the hand-rolled `Group` + `groups.map` and makes nesting depth unlimited.

## Mobile behavior

- Breakpoint: `< md` (768px) uses drawer; `>= md` uses static rail.
- Top nav gets a hamburger button (mobile only) wired to a `useSidebar` context (simple `useState` + provider in `__root.tsx`).
- Drawer: fixed left panel, `w-[82vw] max-w-[320px]`, slides in from left with `translate-x` transition, dark overlay behind it. Closes on overlay click, ESC, or any nav link click (`onNavigate` already exists).
- Body scroll-locked while open.
- Desktop layout is unchanged.

## Files to change

- `src/lib/docs-manifest.ts` — add `DocNode` tree, keep derived flat `DOCS`.
- `src/components/docs/sidebar.tsx` — rewrite to recursive renderer + new active styling + persisted open state.
- `src/components/docs/sidebar-mobile.tsx` — new drawer wrapper (overlay + slide-in).
- `src/components/docs/top-nav.tsx` — add hamburger button on mobile, wired to sidebar context.
- `src/routes/__root.tsx` (or `docs.$slug.tsx` layout) — provide `SidebarOpenContext`, mount mobile drawer.
- `src/styles.css` — (only if needed) one utility for the vertical guide line color.

## Config ergonomics

After the change, adding a deeply nested doc looks like this — no component edits:

```ts
{ kind: "section", label: "Inference", children: [
  { kind: "section", label: "Runtimes", children: [
    { kind: "doc", slug: "onnx-runtime", title: "ONNX Runtime" },
    { kind: "doc", slug: "openvino",     title: "OpenVINO" },
  ]},
]}
```

## Preview verification

After implementing:
1. Desktop: confirm active row uses calm bg + left border, no pill artifacts.
2. Resize to mobile width — sidebar disappears, hamburger appears, tap opens drawer, tap link closes drawer and navigates.
3. Add a 2-level nested test section in the manifest, confirm guides and indentation render correctly and parents auto-open on deep active routes.

## Out of scope

- No changes to TOC, search, theme toggle, or doc page rendering.
- No new dependencies.
