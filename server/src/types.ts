export type GameMode = "song" | "actor";
export type ChallengeType = "truth-dare";

export type RoomStatus =
  | "waiting"
  | "countdown"
  | "playing"
  | "round-result"
  | "finished";

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

export interface ActiveRound {
  questionId: string;
  startedAt: number;
  answeredPlayers: Set<string>;
}

export interface Room {
  id: string;
  hostId: string;

  mode: GameMode;
  totalRounds: number;
  enabledChallenges: ChallengeType[];

  players: Map<string, Player>;

  status: RoomStatus;

  currentRound: number;

  usedQuestionIds: Set<string>;

  activeRound?: ActiveRound;

  truthDareType: "truth" | "dare" | null;
  truthDareChallenge: string;
}
