# Permanent Engineering Rules

## MUST

1. Keep room, round, score, winner, and final ranking decisions authoritative on the Socket.IO server.
2. Never trust client-reported scores, solve positions, winners, timers, selected questions, or game status.
3. Validate client-provided Socket.IO payloads on the server before using them, including room identifiers and any new user-entered fields.
4. Do not send song title, movie, aliases, or other answer-revealing metadata in a playable-round payload. Reveal only the metadata appropriate to the result screen.
5. Use legitimate YouTube embedding/playback. Do not download, extract, proxy, or redistribute YouTube audio.
6. Keep the project deployable with the existing environment configuration: `VITE_SERVER_URL` on the client and `CLIENT_URL`/`PORT` on the server.
7. Preserve mobile responsiveness for user-facing changes.
8. Keep the game’s current in-memory state model unless a database is explicitly requested.

## SHOULD

1. Keep Socket.IO as the realtime transport for multiplayer state updates.
2. Make minimal, targeted changes and preserve the existing play flow unless a behavior change is requested.
3. Put new authoritative room/game behavior in the existing backend managers or a clearly related backend module.
4. Consider cheating and information disclosure when defining events; send clients only what their current screen needs.
5. Consider timer races, disconnects, reconnection semantics, and stale listeners whenever changing room or round behavior.
6. Reuse existing validation, answer matching, and score utilities where appropriate.
7. Run both client and server builds after application changes.

## AVOID

1. Do not add authentication, accounts, or a database unless explicitly requested.
2. Do not let the browser decide game outcomes or use local countdowns as authoritative timers.
3. Do not expose answers or full question metadata early merely for UI convenience.
4. Do not introduce unnecessary dependencies or broad UI redesigns while fixing gameplay/backend issues.
5. Do not modify unrelated components, managers, or deployment behavior as incidental cleanup.
6. Do not assume `actor` mode has independent gameplay until it is actually implemented end to end.
