# Guidance for Coding Agents

## Before Making Changes

- Read `architecture.md` first.
- Inspect the relevant existing code and trace the actual event/data flow before changing it. Do not infer behavior from filenames alone.
- Prefer the smallest change that solves the requested problem.
- Keep application changes within the requested scope; do not modify unrelated files.

## Repository Rules

- Keep the React/Vite frontend and Node/Socket.IO backend separated in `client/` and `server/`.
- Keep Socket.IO server-side code authoritative for room state, round state, validation, scores, and winners.
- Preserve current game behavior unless the request explicitly changes it. In particular, note that `actor` mode is currently only a stored selection; gameplay uses the song catalogue.
- Do not introduce a database, authentication, or persistent sessions unless explicitly requested.
- Avoid unnecessary dependencies and large refactors, especially for a localized bug fix.
- Keep the UI mobile-friendly; existing pages use Tailwind responsive utilities.
- Treat `VITE_SERVER_URL`, `CLIENT_URL`, and `PORT` as deployment configuration, not hard-coded production values.

## Debugging Rules

When fixing a bug:

1. Reproduce or trace the actual client/server flow.
2. Identify the root cause and affected Socket.IO events/state transitions.
3. Make the smallest appropriate change.
4. Check for race conditions, delayed timers, stale React state, disconnects, and duplicate Socket.IO listeners.
5. Run the client and server builds.
6. Explain what changed, why, and anything not verified.

## Working Style

- Do not rewrite working components unnecessarily.
- Reuse existing managers and utilities (`roomManager`, `gameManager`, `roundManager`, validation, answer matching, scoring) instead of duplicating logic.
- Add or update types when a Socket.IO payload or state shape changes; current frontend and backend types are separate and need deliberate coordination.
- Keep client displays as consumers of server events. Do not move authoritative decisions into browser timers or React state.
- Preserve the current YouTube embed approach unless the request specifically changes playback behavior.

## Verification

After changes:

- Run `npm run build` in `client/`.
- Run `npm run build` in `server/`.
- Report build errors and warnings that affect the requested work.
- Mention any behavior that could not be verified, especially browser autoplay, realtime multi-client timing, and external deployment configuration.
