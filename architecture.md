# Song Guessor Architecture

## Project Overview

Song Guessor (branded in the UI as **Boomer / Bollywood Guessor**) is a browser-based multiplayer guessing game. A host creates a room, shares a six-character code or QR invite URL, and starts a timed game. For each round, the server selects a song and sends its YouTube video ID to all room members. Players submit song-title guesses; the server validates them, awards points in correct-answer order, reveals the answer at the end of the round, and publishes a final leaderboard. The host can opt into the currently available `truth-dare` post-game challenge when creating the room.

The create screen exposes `song` and `actor` modes, but the current game implementation always selects from `SONG_QUESTIONS`, labels the gameplay as song guessing, and embeds song YouTube IDs. Actor-specific questions or behavior are **not currently implemented**.

## Technology Stack

### Frontend

- React 19 with TypeScript.
- Vite 8 build/dev server, using `@vitejs/plugin-react`.
- React Router DOM 7 with browser-history routing.
- Tailwind CSS 4 through `@tailwindcss/vite`; utility classes are used directly in page components. There is no separate Tailwind configuration file.
- Socket.IO Client 4 for realtime communication.
- `qrcode.react` for SVG QR-code generation in the lobby.

### Backend

- Node.js runtime, TypeScript, compiled with `tsc` to `server/dist`.
- Express 5 for the HTTP health endpoint and JSON/CORS middleware.
- Socket.IO 4 server, attached to Node's HTTP server.
- In-memory `Map`/`Set` state only; no database, cache, filesystem persistence, or authentication.

### Deployment and Configuration

- The frontend connects to `import.meta.env.VITE_SERVER_URL`, defaulting to `http://localhost:3000`.
- The backend listens on `process.env.PORT`, defaulting to `3000`, and allows `process.env.CLIENT_URL`, defaulting to `http://localhost:5173`, in both Express CORS and Socket.IO CORS settings.
- No `.env` file is committed (`.env` is ignored). The frontend includes `client/vercel.json` for SPA history fallback; there is no Render configuration, Dockerfile, CI workflow, or backend deployment manifest.
- Vercel frontend and Render backend are the intended deployment pattern:

```text
Browser -> Vercel-hosted Vite build -> Socket.IO connection -> Render-hosted Node/Express server
                         VITE_SERVER_URL                  CLIENT_URL / PORT
```

For that arrangement, Vercel would need `VITE_SERVER_URL` set to the backend public URL, and the backend would need `CLIENT_URL` set to the exact frontend origin. Render normally supplies `PORT`; otherwise the server falls back to 3000.

## Repository Structure

```text
client/
  index.html                 Vite HTML shell
  package.json               frontend scripts and dependencies
  vercel.json                Vercel rewrite of all SPA routes to index.html
  vite.config.ts             React and Tailwind Vite plugins
  tsconfig*.json             project-reference TypeScript configuration
  src/
    main.tsx                 React bootstrap
    App.tsx                  route declaration
    index.css                Tailwind import
    App.css                  unused Vite-template-style CSS (not imported)
    types.ts                 frontend Room, Player, and GameMode shapes
    lib/socket.ts            shared auto-connecting Socket.IO client
    pages/                   Home, CreateGame, JoinGame, Lobby, and Game screens
  public/                    favicon and icon assets
  assets/                    Vite/React/hero image assets
server/
  package.json               backend scripts and dependencies
  tsconfig.json              NodeNext TypeScript compilation to dist/
  src/
    server.ts                Express/Socket.IO entry point and protocol handlers
    types.ts                 authoritative server-side game types
    game/
      roomManager.ts         in-memory room lifecycle
      gameManager.ts         game start, question selection, active-round creation
      roundManager.ts        round duration and status transition
      questions.ts           static Bollywood song catalogue
      validation.ts          nickname validation
      answerValidator.ts     answer normalization and alias matching
      scoring.ts             position-based score calculation
```

The root contains only `.gitignore` besides these projects; it ignores dependency folders, build output, logs, and `.env` files.

## Frontend Architecture

`client/src/main.tsx` renders `App` inside React `StrictMode`. `App.tsx` owns only routing:

| Route | Screen | Responsibility |
|---|---|---|
| `/` | `Home` | Entry screen and mode-specific create links. |
| `/create` | `CreateGame` | Reads optional `mode` query parameter; collects nickname, mode, and 3/5/7/10/15 rounds; emits `create_room`. |
| `/join` and `/join/:roomCode` | `JoinGame` | Collects nickname and normalized room code; emits `join_room`. |
| `/lobby/:roomCode` | `Lobby` | Fetches room state, shows membership, host controls, QR/invite URL, and reacts to game countdown. |
| `/game/:roomCode` | `Game` | Owns gameplay, score/result, and truth-or-dare UI state and Socket.IO listeners. |

`lib/socket.ts` exports one module-level Socket.IO client. It auto-connects when imported, uses `VITE_SERVER_URL` or localhost, and is shared by all pages. There is no explicit reconnect, authentication, or connection-error UI.

### `Game.tsx` state and screens

`CreateGame.tsx` lets the host enable or disable post-game challenge modules. The selected `enabledChallenges` array is sent to the server when the room is created.

`Game.tsx` stores transient client presentation state: three-second countdown and local visible timer; round and total-round numbers; the received YouTube ID; answer text, answer result, and correct-submission lock; revealed answer and sorted player list; final challenge state; and Play Again request state. It registers its listeners when mounted, emits `request_player_id`, and removes listeners on unmount.

On `game_countdown`, it displays local values 3, 2, and 1. On `round_started`, it receives only the question ID and YouTube ID, starts a local 30-second visual timer from the supplied duration, and renders an invisible 1px YouTube iframe with `autoplay=1`, `controls=0`, and `rel=0`. The visible panel contains only gameplay text, so audio is intended to play without displaying video. Browser autoplay policy, embed availability, and user/device settings can prevent this playback.

The page sends `submit_answer` without a callback. Incorrect guesses leave the input enabled; a correct result disables the input locally. Score ordering and round closure always come from the server. Once `game_finished` arrives, the normal game screen is replaced by final scores and, when applicable, the truth-or-dare UI.

### Lobby invites and QR codes

`Lobby.tsx` computes `${window.location.origin}/join/${roomCode}`. It renders that value as an SVG QR code and offers Clipboard API copy with a brief `Copied!` state. This makes the invite point at the same deployed frontend origin; the URL itself does not carry player identity or a server credential.

## Backend Architecture

`server/src/server.ts` creates Express, configures CORS for exactly `CLIENT_URL`, exposes `GET /health` returning `{ status: "ok", service: "boomer-server" }`, creates an HTTP server, and attaches Socket.IO with the same allowed origin. It is also the coordination layer: it validates event inputs, joins sockets to Socket.IO rooms, starts timers, serializes rooms for clients, emits updates, and handles disconnects.

The `roomManager` owns the process-wide `Map<string, Room>`. It caps the system at `MAX_ROOMS = 2`, allocates six-character uppercase hexadecimal room IDs, caps each room at 15 players, and transfers host status to the first remaining player when the host disconnects.

The `gameManager` starts a waiting room by resetting its round number and used-question IDs, then puts it into `countdown`. It selects one unused item from `SONG_QUESTIONS` at random, clears the used set and allows reuse only after all catalogue entries have been used, increments `currentRound`, creates `activeRound`, and moves the room to `playing`. `getQuestionAnswer` looks up full metadata only on the server.

`roundManager` defines `ROUND_DURATION_MS = 30_000` and changes a playing room to `round-result`. `server.ts` schedules the 30-second timer and the three-second post-result delay. It ends immediately when every currently stored player has answered correctly; otherwise the duration timer ends it.

`validation.ts` trims nicknames and requires 1--20 characters. `answerValidator.ts` lowercases and trims answers, removes non-letter/non-number/non-space Unicode characters, collapses whitespace, and requires exact equality with a normalized alias. `scoring.ts` awards points by the count/order of correct answerers.

## Game Lifecycle

The server-side `RoomStatus` flow is:

```text
waiting
  -> countdown (startGame / beginNextRound)
  -> playing (createNextRound)
  -> round-result (endRound)
  -> countdown (if another configured round remains)
  -> ...
  -> finished
```

The host's `start_game` causes `startGame` to set `countdown`, then `server.ts` emits `game_countdown` and calls `beginNextRound`. `beginNextRound` sets `countdown` and emits `game_countdown` again, so the first countdown is emitted twice for a newly started game. After three seconds it creates the round, emits `round_started`, and starts the server timer.

At round end, `round_ended` reveals the title and movie and includes a sorted leaderboard. If more rounds remain, a three-second delay invokes `beginNextRound`; otherwise the room becomes `finished` and emits `game_finished`.

## Room Lifecycle

1. `create_room` rejects a socket already found in a room, validates nickname/mode/round count/challenge selection, creates an in-memory waiting room, inserts the host player, joins the socket to the Socket.IO room, acknowledges, and emits `room_updated`.
2. `join_room` normalizes the code, validates nickname, rejects an already-roomed socket, validates room availability and case-insensitive duplicate names, adds a non-host player only while waiting, joins the Socket.IO room, acknowledges, and emits `room_updated`.
3. `get_room` returns serialized public room state. Serialization exposes ID, host ID, mode, round count, status, current round, and the player array; it does not expose questions, used IDs, or active-round details.
4. On socket disconnect, the player is immediately removed. An empty room is deleted. If the departing player was host, the first remaining `Map` player becomes host. Remaining sockets receive `room_updated`.
5. After `finished`, the host can emit `play_again`. The server resets every player's score, round counters, used questions, active round, and transient challenge state while retaining the same room code, players, host, mode, total rounds, and enabled challenge selection. It emits `game_reset` and `room_updated`; clients navigate back to the lobby.

Reconnection/identity restoration is **not implemented**. Socket IDs are player IDs, so reconnecting creates a new ID and the previous disconnect has already removed the old player. Rooms are not restored after a process restart.

## Round Lifecycle

1. The server randomly selects a static song not yet used in the room when possible.
2. It stores `questionId`, `startedAt`, and a server-side `answeredPlayers` set in `activeRound` and sends clients only `{ id, youtubeId }`.
3. During 30 seconds, `submit_answer` accepts only players in the room while status is `playing`, an active round exists, and that socket has not already solved it.
4. Each incorrect answer receives an individual `answer_result` with zero points and does not consume the player's answer slot. A correct answer is recorded, scored, acknowledged individually, and triggers a room-wide leaderboard refresh.
5. The server ends the round when time expires or all current room players have correctly answered. It reveals title/movie only in `round_ended`.
6. It waits three seconds before the next countdown, unless the configured round count has been reached, when it emits `game_finished`.

## Socket.IO Protocol

| Direction | Event | Payload | Purpose |
|---|---|---|---|
| Client -> server | `request_player_id` | none | Ask for the current Socket.IO ID. |
| Server -> client | `your_player_id` | `{ id }` | Return current Socket.IO ID for final-game role checks. |
| Client -> server | `get_room` | `{ roomId }`, acknowledgement | Fetch public room state. |
| Client -> server | `create_room` | `{ name, mode, totalRounds }`, acknowledgement | Create a room and host player. |
| Client -> server | `join_room` | `{ roomId, name }`, acknowledgement | Join a waiting room. |
| Server -> room | `room_updated` | `{ room: serializedRoom }` | Publish membership/host changes and initial room creation. |
| Client -> server | `start_game` | `{ roomId }`, acknowledgement | Host-only request to begin. |
| Client -> server | `play_again` | `{ roomId }`, acknowledgement | Host-only request to reset a finished game in the same room. |
| Server -> room | `game_reset` | `{ room: serializedRoom }` | Tell all players to return to the reset lobby. |
| Server -> room | `game_countdown` | `{ round, totalRounds }` | Tell lobby/game clients to navigate/show a three-second countdown. |
| Server -> room | `round_started` | `{ round, totalRounds, question: { id, youtubeId }, duration }` | Start a playable round without answer metadata. |
| Client -> server | `submit_answer` | `{ roomId, answer }` | Submit a title guess. No acknowledgement. |
| Server -> sender | `answer_result` | `{ correct, points, position? }` | Return the sender's validation and score outcome. |
| Server -> room | `leaderboard_updated` | `{ players }` | Publish scores after a correct answer. |
| Server -> room | `round_ended` | `{ round, answer: { title, movie } \| null, players }` | Reveal answer and round scores. |
| Server -> room | `game_finished` | `{ players, truthDarePlayers: { giver, receiver } \| null }` | Publish final scores and optional final-game roles; null when `truth-dare` is disabled. |
| Client -> server | `spin_truth_dare` | `{ roomId }` | Lowest-ranked player requests a random truth/dare type. |
| Server -> room | `truth_dare_result` | `{ type: "truth" \| "dare" }` | Publish random selection. |
| Client -> server | `submit_truth_dare_challenge` | `{ roomId, challenge }` | Highest-ranked player sends challenge text. |
| Server -> room | `truth_dare_challenge` | `{ challenge }` | Publish stored challenge text. |

## Data Models / Types

- `GameMode`: `"song" | "actor"`.
- `ChallengeType`: currently `"truth-dare"`; `Room.enabledChallenges` is an extensible list for future post-game challenge modules.
- `RoomStatus`: `"waiting" | "countdown" | "playing" | "round-result" | "finished"`.
- `Player`: socket `id`, display `name`, numeric `score`, and `isHost` flag.
- `ActiveRound`: selected `questionId`, timestamp `startedAt`, and `answeredPlayers: Set<string>` containing only correct solvers.
- Server `Room`: ID, host ID, mode, total rounds, enabled challenge list, `Map` of players, status, current round, used-question ID set, optional active round, and final truth/dare type/challenge state.
- `SongQuestion`: ID, title, movie, optional artist, YouTube ID, and accepted aliases. The current data entries do not set `artist`.
- Client `Room`: public serialized subset with `players: Player[]` and `status: string`; it does not model `ActiveRound`, question data, or truth/dare fields.

## Song / Question System

`server/src/game/questions.ts` contains a static `SONG_QUESTIONS` array of 38 Bollywood songs. Every round uses that catalogue irrespective of selected mode. A selected question's `youtubeId` is sent to clients for direct YouTube embedding. Title, movie, aliases, and optional artist remain server-side until result reveal (the reveal still excludes artist and aliases).

Aliases are manually declared per song. Matching is exact after normalization, not fuzzy and not substring-based. An answer must equal an accepted normalized alias; for example, punctuation/case/extra spacing are tolerated, but unlisted misspellings are rejected.

## Scoring

Correct-answer position is zero-based from the insertion size of `activeRound.answeredPlayers` after adding the current solver. The exact score schedule is:

| Correct solver order | Points |
|---|---:|
| First | 1000 |
| Second | 800 |
| Third | 600 |
| Fourth | 400 |
| Fifth and later | 250 |

Incorrect guesses score 0 and may be retried. There is no time-decay calculation; `startedAt` is stored but not used by scoring. Leaderboards are sorted only by descending score, so equal-score ordering follows JavaScript's stable sort / player insertion order rather than an explicit tie-break rule.

## Known Architectural Limitations

- State is memory-only: a server restart removes rooms, players, scores, used questions, and active games.
- The process permits only two rooms, each capped at 15 players.
- Reconnect/resume is not implemented; a disconnection removes the player immediately. No client-side session persistence exists.
- Mid-game join is rejected, while mid-game departure reduces the number of correct answers needed for early round completion.
- There is no HTTP API beyond `/health`, database, user authentication, rate limiting, or persistent analytics.
- Socket payload validation is partial: room, nickname, mode, and answer types are guarded, but challenge text has no length/content validation and payload schemas are not centralized.
- `actor` mode is selectable and stored but has no actor-specific question, playback, validation, or UI implementation.
- Post-game challenges are modular at the room configuration boundary via `enabledChallenges`; only `truth-dare` is implemented today. When disabled, no Truth/Dare panel is shown and its server events are rejected.
- Play Again resets the current room for another waiting-to-playing cycle without changing its room code or player membership.
- The first game countdown is emitted twice by the start flow.
- The `Game` page does not request an initial room/game snapshot; direct navigation, a late connection, or remount during an already-running game can miss prior realtime events.
- Client timers/countdowns are visual approximations driven by receipt time; the server alone enforces actual round duration.
- YouTube embedding depends on third-party availability and browser autoplay/embed restrictions. The app embeds YouTube directly; it does not download or extract audio. The client can hide the iframe's in-page controls and request `stopVideo`, but phone lock-screen/media-center controls are owned by the browser/OS Media Session and cannot be reliably hidden or disabled by this application; some devices may still reveal that media is playing.
- Backend deployment configuration is not committed, and restricted CORS means production origins must be configured correctly outside the repository. The frontend's Vercel rewrite is committed in `client/vercel.json`.

## Important Invariants

- The server owns room membership, host identity, game status, selected question IDs, correct-solver order, scores, round endings, and final ranking.
- Only a socket currently stored in the room can submit an answer; only the host socket can start a waiting game.
- All room sockets receive the same `{ id, youtubeId }` question payload for a started round.
- Answer metadata is not included in `round_started`; the server sends title/movie only in `round_ended`.
- A player can receive points at most once per active round because the server records correct solvers in `answeredPlayers`.
- Room IDs are uppercase six-character codes and remain the key for both in-memory room lookup and Socket.IO room broadcast.
- Round transitions and finalization are scheduled and performed server-side, not by a client timer.
