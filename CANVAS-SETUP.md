# Canvas Integration Setup

Wires the app to Rowan's Canvas (`canvas.rowan.edu`) to pull active
courses and their upcoming assignments. Read-only for now — nothing in
the app writes back to Canvas.

## 1. Generate a personal access token

1. Log into Canvas at https://canvas.rowan.edu
2. Go to **Account -> Settings** (https://canvas.rowan.edu/profile/settings)
3. Scroll to **Approved Integrations** -> **+ New Access Token**
4. Purpose: "Reroute Planner" (or anything you'll recognize later)
5. Leave the expiry blank, or set one and regenerate when it lapses
6. Copy the token immediately — Canvas only shows it once

## 2. Configure the local server

```bash
cp .env.example .env
```

Edit `.env` and paste the token into `CANVAS_TOKEN`. `CANVAS_DOMAIN` is
already set to `canvas.rowan.edu`. **Never commit `.env`** — it's
gitignored, and the token is a real credential with access to your
Canvas account.

## 3. Run it

Two processes, in separate terminals:

```bash
npm run server   # proxies Canvas API calls, keeps the token server-side
npm run dev      # the app itself, http://localhost:5173
```

Open the app, scroll to **Courses**, click **Sync from Canvas**.

## Why a separate server at all

The token is a real credential — if it shipped in client-side JS anyone
could pull it out of the browser bundle. `server/` is a minimal Express
proxy that holds the token and talks to Canvas on the app's behalf,
matching the same rule `claude.md` sets for AI keys. It's a placeholder
for a Cloud Function once Firebase is wired up (see STATUS.md) — same
shape, different host.

## What's synced

- Active courses (`enrollment_state=active`)
- Each course's upcoming assignments with a due date (`bucket=upcoming`)

Sync is manual (button click) for now, not automatic/scheduled — see
STATUS.md for what's next.
