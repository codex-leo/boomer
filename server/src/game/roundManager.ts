import type { Room } from "../types.js";

export const ROUND_DURATION_MS = 30_000;

export function endRound(room: Room) {
  if (room.status !== "playing") {
    return false;
  }

  room.status = "round-result";

  return true;
}