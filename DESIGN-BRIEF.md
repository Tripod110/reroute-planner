# Design Pass — Handoff Brief

Read this first in the new context window. It's everything needed to run
the UI/design pass (task #7 in the prior session) without re-deriving
context. Full project history is in `STATUS.md`, `claude.md`, and
`DATA-MODEL.md` if you need more than this summary.

## Model

Run this session on **Opus, effort high or xhigh** — not Sonnet.
Opus has meaningfully stronger visual/design instincts (spacing, color
relationships, hierarchy); this was a deliberate choice made with the
user before scoping this brief, not a default. Switch back to Sonnet for
regular functional work once the design pass is done.

## What this app is

Reroute Planner — a personal single-user planning hub (habits, projects,
Canvas course sync, and a Gemini-backed assistant). Built by a CS student
partly to learn development, not just to ship. Full context in
`claude.md`; the non-negotiable design *rules* there (never reset a
missed habit to zero, frequency increases are opt-in, AI suggests but
never decides) are product-logic rules, not visual ones — don't let them
constrain the visual design pass, they're mentioned only so you don't
misread them as styling constraints if you skim that file.

## What's built and working right now

Everything is functionally complete and tested (build order steps 1–4
done, see `STATUS.md` for the full log): Firebase Auth + Firestore
persistence, Habits (calendar + list view, check-off), Projects
(completion-% slider, stalled/near-done badges), Canvas sync merged into
the calendar, a deterministic habit-reroute-suggestion engine, and a
Gemini chat assistant panel. **This design pass changes none of that
logic or component structure — CSS and markup only.**

## The task

1. Prototype 2–3 distinct visual directions as a standalone HTML/CSS
   artifact first (fast to iterate, zero risk to the working app) — load
   the `artifact-design` skill before starting. Don't present just one
   option; open-ended "make it nicer" briefs drift without a choice point.
2. Get the user to pick a direction.
3. Port the chosen direction's CSS into the real files below. Don't
   restructure the React components or change class names unless a
   direction genuinely requires new markup hooks — prefer restyling
   existing structure.
4. Verify in-browser at both desktop and the 375×812 mobile viewport
   (this was tested working in an earlier hardening pass — don't
   regress it), and in both light and dark mode (`prefers-color-scheme`
   is already wired up, see below).
5. Run `npm run lint` and `npm run build` when done — this repo has no
   visual regression tests, so a clean build is the only automated
   signal; the mobile/dark-mode checks above are manual and required.

## Explicit decision already made: keep vanilla CSS

No Tailwind, no component library (shadcn/Radix/etc). The app already
has a real foundation — CSS custom properties for light/dark theming, a
working spacing/type rhythm — and pulling in a framework now is pure
churn for a solo app, not a genuine improvement. Extend what's there.

## Files that matter for this pass

- `src/index.css` — global tokens (CSS variables), base element styles
  (`h1`, `h2`, `button`, `code`), the `#root` container, light/dark
  `@media (prefers-color-scheme: dark)` overrides.
- `src/App.css` — component-level styles (`.item`, `.item-list`,
  `.calendar`, `.badge`, `.add-form`, etc.) — most of the app's actual
  visual surface lives here.
- Components (styling targets, don't restructure without reason):
  `AddHabitForm.jsx`, `AddProjectForm.jsx`, `AssistantPanel.jsx`,
  `CalendarView.jsx`, `CoursesView.jsx`, `HabitItem.jsx`, `HabitList.jsx`,
  `ProjectItem.jsx`, `ProjectList.jsx`, `RerouteSuggestions.jsx`,
  `SignIn.jsx` — all under `src/components/`.

## Current design tokens (from `src/index.css`, as of this writing)

```css
:root {
  --text: #6b6375;
  --text-h: #08060d;
  --bg: #fff;
  --border: #e5e4e7;
  --code-bg: #f4f3ec;
  --accent: #aa3bff;
  --accent-bg: rgba(170, 59, 255, 0.1);
  --accent-border: rgba(170, 59, 255, 0.5);
  --social-bg: rgba(244, 243, 236, 0.5);
  --shadow: rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px;
  --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
  --heading: system-ui, 'Segoe UI', Roboto, sans-serif;
  --mono: ui-monospace, Consolas, monospace;
}
/* dark mode override block exists too — see the file directly */
```

Purple accent (`#aa3bff` / `#c084fc` dark) is the current identity color
— free to propose changing it as part of a visual direction, just do it
deliberately and show it in the artifact preview, not as a silent change.

## Screens/components to cover in the mockup

- Habits: Calendar view (7-day grid) and List view toggle, check-off
  interaction, Add-habit form
- Projects: completion-% slider, near-done/stalled badges, Add-project
  form
- Courses: Canvas sync button, course/assignment list, due-date badges
- Reroute suggestions: the accept/dismiss suggestion cards above Habits
- Assistant: chat panel, message bubbles, "Today's briefing" button

## Sequencing — why this comes before PWA/hosting

This (#7) is scoped to run before task #4 (PWA installable — needs
icons that reflect the *final* look) and task #5 (hosting/deploy — no
point deploying, then redeploying after every visual tweak). Don't start
either of those in this session; hand back to the user when the design
pass is done.

## Verifying your work

```bash
npm run dev      # http://localhost:5173
npm run server   # only needed if testing Canvas/Assistant features, not required for pure CSS work
npm run lint
npm run build
```

Node is installed on this machine (v24.19.0) and `npm install` has
already been run — no environment setup needed.
