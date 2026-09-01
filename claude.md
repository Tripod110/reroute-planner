# Project Context

## What this is
A personal planning hub for a single user (me). It tracks everything —
school, work, gym, side projects — in one place, and an AI layer reasons
over that data to suggest schedule adjustments when things change.
Think GPS rerouting for a week, not a static calendar.

## Why it exists
I have a pattern of starting projects and losing follow-through. Prior
attempts died from things becoming obligations with no visibility and no
recovery path. This app is meant to make status visible and make missing
a beat recoverable instead of a reset to zero.

## Design rules (non-negotiable)
- Missing a cycle NEVER resets progress to zero — it resumes at the last
  comfortable cadence.
- Frequency/intensity increases are OPT-IN only, never automatic.
- The AI suggests reroutes; it does not silently reschedule things.

## Learning goal
I'm a CS student and this project is partly to learn development beyond
prompting — but not at the cost of burnout. Workflow: Claude drafts a
first take (architecture, data model, code) and explains its reasoning;
I read it, modify it to my liking, and ask when something doesn't make
sense. I don't need to draft things first myself before Claude can help.

## Stack
React + Vite (JavaScript), Firebase (Firestore + Auth, Google sign-in),
PWA installable on mobile. AI calls go through Cloud Functions so keys
never reach the client.

## Build order
1. Scaffold + auth (current)
2. Data model — Claude drafts a first take, I modify it
3. Rendering + check-off
4. AI reasoning layer — last

## Scope
Two entity types: recurring **Habits** (school/work/gym, cadence-based,
reroute-on-miss) and standalone **Projects** (started/not-finished or
close-to-done, tracked via a completion-% field, not recurring). A third
source, **Courses**, is synced live from Canvas (Rowan University) rather
than stored/created manually — see `DATA-MODEL.md` and `CANVAS-SETUP.md`.
