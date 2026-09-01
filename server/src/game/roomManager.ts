import crypto from "node:crypto";
import type { GameMode, Player, Room } from "../types.js";

export const MAX_ROOMS = 2;
export const MAX_PLAYERS_PER_ROOM = 15;

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
}

function generateUniqueRoomCode(): string {
  let code = generateRoomCode();

  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  return code;
}

export function createRoom(
  hostId: string,
  mode: GameMode,
  totalRounds: number,
): Room | null {
  if (rooms.size >= MAX_ROOMS) {
    return null;
  }

  const room: Room = {
    id: generateUniqueRoomCode(),
    hostId,
    mode,
    totalRounds,
    players: new Map(),
    status: "waiting",
    currentRound: 0,
    usedQuestionIds: new Set(),
    truthDareType: null,
    truthDareChallenge: "",
  };

  rooms.set(room.id, room);

  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function addPlayer(
  roomId: string,
  player: Player,
): { success: true; room: Room } | { success: false; reason: string } {
  const room = rooms.get(roomId);

  if (!room) {
    return {
      success: false,
      reason: "Room not found.",
    };
  }

  if (room.status !== "waiting") {
    return {
      success: false,
      reason: "Game has already started.",
    };
  }

  if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
    return {
      success: false,
      reason: "Room is full.",
    };
  }

  room.players.set(player.id, player);

  return {
    success: true,
    room,
  };
}

export function removePlayer(
  roomId: string,
  playerId: string,
): Room | undefined {
  const room = rooms.get(roomId);

  if (!room) {
    return undefined;
  }

  room.players.delete(playerId);

  // Nobody remains → destroy the room.
  if (room.players.size === 0) {
    rooms.delete(roomId);
    return undefined;
  }

  // Host left → transfer host to the first remaining player.
  if (room.hostId === playerId) {
    const newHost = room.players.values().next().value;

    if (newHost) {
      newHost.isHost = true;
      room.hostId = newHost.id;
    }
  }

  return room;
}

export function getRoomCount(): number {
  return rooms.size;
}

export function getRoomForPlayer(playerId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.has(playerId)) {
      return room;
    }
  }

  return undefined;
}
