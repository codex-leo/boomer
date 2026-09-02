export type GameMode = "song" | "actor";
export type ChallengeType = "truth-dare";

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
  enabledChallenges: ChallengeType[];
  status: string;
  currentRound: number;
  players: Player[];
}
