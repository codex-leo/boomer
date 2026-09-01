export type GameMode = "song" | "actor";

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

export interface Room {
  id: string;
  hostId: string;
  mode: GameMode;
  totalRounds: number;
  status: string;
  currentRound: number;
  players: Player[];
}