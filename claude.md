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
prompting. Explain your choices. Don't write logic I haven't specified.
Before adding anything not explicitly requested, ask.

## Stack
React + Vite (JavaScript), Firebase (Firestore + Auth, Google sign-in),
PWA installable on mobile. AI calls go through Cloud Functions so keys
never reach the client.

## Build order
1. Scaffold + auth (current)
2. Data model — I write this myself
3. Rendering + check-off
4. AI reasoning layer — last
