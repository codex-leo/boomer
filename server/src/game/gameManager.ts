import type { Room } from "../types.js";
import { SONG_QUESTIONS } from "./questions.js";

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function startGame(room: Room) {
  if (room.status !== "waiting") {
    return {
      success: false,
      reason: "Game has already started.",
    } as const;
  }

  if (room.players.size < 1) {
    return {
      success: false,
      reason: "No players in room.",
    } as const;
  }

  room.currentRound = 0;
  room.usedQuestionIds.clear();
  room.status = "countdown";

  return {
    success: true,
  } as const;
}

export function createNextRound(room: Room) {
  if (room.currentRound >= room.totalRounds) {
    room.status = "finished";

    return {
      success: false,
      finished: true,
    } as const;
  }

  const availableQuestions =
    SONG_QUESTIONS.filter(
      (question) =>
        !room.usedQuestionIds.has(question.id),
    );

  if (availableQuestions.length === 0) {
    room.usedQuestionIds.clear();
  }

  const questions =
    availableQuestions.length > 0
      ? availableQuestions
      : SONG_QUESTIONS;

  const question =
    questions[
      Math.floor(Math.random() * questions.length)
    ];

  room.usedQuestionIds.add(question.id);

  room.currentRound += 1;

  room.activeRound = {
    questionId: question.id,
    startedAt: Date.now(),
    answeredPlayers: new Set(),
  };

  room.status = "playing";

  return {
    success: true,
    question: {
      id: question.id,
      youtubeId: question.youtubeId,
    },
  } as const;
}

export function getQuestionAnswer(
  questionId: string,
) {
  return SONG_QUESTIONS.find(
    (question) => question.id === questionId,
  );
}