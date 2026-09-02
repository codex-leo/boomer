import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import type { Room } from "./types.js";
import {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  getRoomForPlayer,
} from "./game/roomManager.js";

import { startGame, createNextRound } from "./game/gameManager.js";

import { validateNickname } from "./game/validation.js";

import { getQuestionAnswer } from "./game/gameManager.js";

import { answerMatches } from "./game/answerValidator.js";

import { calculateScore } from "./game/scoring.js";

import { endRound, ROUND_DURATION_MS } from "./game/roundManager.js";

const PORT = Number(process.env.PORT) || 3000;

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();

app.use(
  cors({
    origin: CLIENT_URL,
  }),
);

app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "boomer-server",
  });
});

function startRoundTimer(room: Room) {
  setTimeout(() => {
    if (room.status !== "playing") {
      return;
    }

    const ended = endRound(room);

    if (!ended) {
      return;
    }

    const question = room.activeRound
      ? getQuestionAnswer(room.activeRound.questionId)
      : undefined;

    io.to(room.id).emit("round_ended", {
      round: room.currentRound,

      answer: question
        ? {
            title: question.title,
            movie: question.movie,
          }
        : null,

      players: getLeaderboard(room),
    });

    if (room.currentRound >= room.totalRounds) {
      room.status = "finished";

      const truthDarePlayers = getTruthDarePlayers(room);

      io.to(room.id).emit("game_finished", {
        players: getLeaderboard(room),
        truthDarePlayers,
      });
      return;
    }

    setTimeout(() => {
      if (room.status !== "round-result") {
        return;
      }

      beginNextRound(room);
    }, 3000);
  }, ROUND_DURATION_MS);
}

function getLeaderboard(room: Room) {
  return [...room.players.values()]
    .sort((a, b) => b.score - a.score)
    .map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      isHost: player.isHost,
    }));
}

function getTruthDarePlayers(room: Room) {
  const leaderboard = getLeaderboard(room);

  if (leaderboard.length < 2) {
    return null;
  }

  return {
    giver: leaderboard[0],
    receiver: leaderboard[leaderboard.length - 1],
  };
}

function beginNextRound(room: Room) {
  room.status = "countdown";

  io.to(room.id).emit("game_countdown", {
    round: room.currentRound + 1,
    totalRounds: room.totalRounds,
  });

  setTimeout(() => {
    if (room.status !== "countdown") {
      return;
    }

    const nextRound = createNextRound(room);

    if (!nextRound.success) {
      const truthDarePlayers = getTruthDarePlayers(room);

      io.to(room.id).emit("game_finished", {
        players: getLeaderboard(room),
        truthDarePlayers,
      });
    }

    io.to(room.id).emit("round_started", {
      round: room.currentRound,
      totalRounds: room.totalRounds,
      question: nextRound.question,
      duration: ROUND_DURATION_MS,
    });

    startRoundTimer(room);
  }, 3000);
}

io.on("connection", (socket) => {

  socket.on("request_player_id", () => {
    socket.emit("your_player_id", {
      id: socket.id,
    });
  });

  socket.on(
    "get_room",
    (
      data: {
        roomId: unknown;
      },
      callback,
    ) => {
      const roomId =
        typeof data?.roomId === "string"
          ? data.roomId.trim().toUpperCase()
          : "";

      if (!roomId) {
        callback({
          success: false,
          reason: "Invalid room code.",
        });

        return;
      }

      const room = getRoom(roomId);

      if (!room) {
        callback({
          success: false,
          reason: "Room not found.",
        });

        return;
      }

      callback({
        success: true,
        room: serializeRoom(room),
      });
    },
  );

  socket.on(
    "create_room",
    (
      data: {
        name: unknown;
        mode: unknown;
        totalRounds: unknown;
      },
      callback,
    ) => {
      const existingRoom = getRoomForPlayer(socket.id);

      if (existingRoom) {
        callback({
          success: false,
          reason: "You are already in a game.",
        });

        return;
      }
      const nickname = validateNickname(data?.name);

      if (!nickname.valid) {
        callback({
          success: false,
          reason: nickname.reason,
        });

        return;
      }

      if (data.mode !== "song" && data.mode !== "actor") {
        callback({
          success: false,
          reason: "Invalid game mode.",
        });

        return;
      }

      const totalRounds = Number(data.totalRounds);

      if (
        !Number.isInteger(totalRounds) ||
        totalRounds < 1 ||
        totalRounds > 30
      ) {
        callback({
          success: false,
          reason: "Rounds must be between 1 and 30.",
        });

        return;
      }

      const room = createRoom(socket.id, data.mode, totalRounds);

      if (!room) {
        callback({
          success: false,
          reason: "All game rooms are currently full.",
        });

        return;
      }

      const player = {
        id: socket.id,
        name: nickname.value,
        score: 0,
        isHost: true,
      };

      room.players.set(socket.id, player);

      socket.join(room.id);

      callback({
        success: true,
        room: {
          id: room.id,
          mode: room.mode,
          totalRounds: room.totalRounds,
        },
        player,
      });

      io.to(room.id).emit("room_updated", {
        room: serializeRoom(room),
      });
    },
  );

  socket.on(
    "join_room",
    (
      data: {
        roomId: unknown;
        name: unknown;
      },
      callback,
    ) => {
      const roomId =
        typeof data?.roomId === "string"
          ? data.roomId.trim().toUpperCase()
          : "";

      const nickname = validateNickname(data?.name);

      if (!roomId) {
        callback({
          success: false,
          reason: "Invalid room code.",
        });

        return;
      }

      if (!nickname.valid) {
        callback({
          success: false,
          reason: nickname.reason,
        });

        return;
      }

      const existingRoom = getRoomForPlayer(socket.id);

      if (existingRoom) {
        callback({
          success: false,
          reason: "You are already in a game.",
        });

        return;
      }

      const room = getRoom(roomId);

      if (!room) {
        callback({
          success: false,
          reason: "Room not found.",
        });

        return;
      }

      const duplicateName = [...room.players.values()].some(
        (player) => player.name.toLowerCase() === nickname.value.toLowerCase(),
      );

      if (duplicateName) {
        callback({
          success: false,
          reason: "That nickname is already being used.",
        });

        return;
      }

      const player = {
        id: socket.id,
        name: nickname.value,
        score: 0,
        isHost: false,
      };

      const result = addPlayer(roomId, player);

      if (!result.success) {
        callback(result);

        return;
      }

      socket.join(roomId);

      callback({
        success: true,
        room: {
          id: room.id,
          mode: room.mode,
          totalRounds: room.totalRounds,
        },
        player,
      });

      io.to(roomId).emit("room_updated", {
        room: serializeRoom(room),
      });
    },
  );

  socket.on(
    "start_game",
    (
      data: {
        roomId: unknown;
      },
      callback,
    ) => {
      const roomId =
        typeof data?.roomId === "string"
          ? data.roomId.trim().toUpperCase()
          : "";

      const room = getRoom(roomId);

      if (!room) {
        callback({
          success: false,
          reason: "Room not found.",
        });

        return;
      }

      if (room.hostId !== socket.id) {
        callback({
          success: false,
          reason: "Only the host can start the game.",
        });

        return;
      }

      if (room.status !== "waiting") {
        callback({
          success: false,
          reason: "Game cannot be started right now.",
        });

        return;
      }

      const result = startGame(room);

      if (!result.success) {
        callback(result);
        return;
      }

      callback({
        success: true,
      });

      io.to(room.id).emit("game_countdown", {
        round: room.currentRound + 1,
        totalRounds: room.totalRounds,
      });

      beginNextRound(room);
    },
  );

  socket.on("submit_answer", (data: { roomId: unknown; answer: unknown }) => {
    const roomId =
      typeof data?.roomId === "string" ? data.roomId.trim().toUpperCase() : "";

    const answer = typeof data?.answer === "string" ? data.answer : "";

    const room = getRoom(roomId);

    if (!room) {
      return;
    }

    if (room.status !== "playing") {
      return;
    }

    const player = room.players.get(socket.id);

    if (!player) {
      return;
    }

    if (!room.activeRound) {
      return;
    }

    if (room.activeRound.answeredPlayers.has(socket.id)) {
      return;
    }

    const question = getQuestionAnswer(room.activeRound.questionId);

    if (!question) {
      return;
    }

    const correct = answerMatches(answer, question.aliases);

    if (!correct) {
      socket.emit("answer_result", {
        correct: false,
        points: 0,
      });

      return;
    }

    room.activeRound.answeredPlayers.add(socket.id);

    const position = room.activeRound.answeredPlayers.size - 1;

    const points = calculateScore(position);

    player.score += points;

    socket.emit("answer_result", {
      correct: true,
      points,
      position: position + 1,
    });

    const leaderboard = getLeaderboard(room);

    io.to(room.id).emit("leaderboard_updated", {
      players: leaderboard,
    });

    const totalPlayers = room.players.size;

    const answeredPlayers = room.activeRound.answeredPlayers.size;

    if (answeredPlayers >= totalPlayers) {
      const ended = endRound(room);

      if (ended) {
        const question = room.activeRound
          ? getQuestionAnswer(room.activeRound.questionId)
          : undefined;

        io.to(room.id).emit("round_ended", {
          round: room.currentRound,

          answer: question
            ? {
                title: question.title,
                movie: question.movie,
              }
            : null,

          players: getLeaderboard(room),
        });

        if (room.currentRound >= room.totalRounds) {
          room.status = "finished";

          const truthDarePlayers = getTruthDarePlayers(room);

          io.to(room.id).emit("game_finished", {
            players: getLeaderboard(room),
            truthDarePlayers,
          });
          return;
        }

        setTimeout(() => {
          if (room.status !== "round-result") {
            return;
          }

          beginNextRound(room);
        }, 3000);
      }
    }
  });

  socket.on("spin_truth_dare", (data: { roomId: unknown }) => {
    const roomId =
      typeof data?.roomId === "string" ? data.roomId.trim().toUpperCase() : "";

    if (!roomId) {
      return;
    }

    const room = getRoom(roomId);

    if (!room) {
      return;
    }

    const truthDarePlayers = getTruthDarePlayers(room);

    if (!truthDarePlayers) {
      return;
    }

    if (room.truthDareType !== null) {
      return;
    }

    if (socket.id !== truthDarePlayers.receiver.id) {
      return;
    }

    const type = Math.random() < 0.5 ? "truth" : "dare";
    room.truthDareType = type;

    io.to(room.id).emit("truth_dare_result", {
      type,
    });
  });

  socket.on(
    "submit_truth_dare_challenge",
    (data: { roomId: unknown; challenge: unknown }) => {
      const roomId =
        typeof data?.roomId === "string"
          ? data.roomId.trim().toUpperCase()
          : "";

      const challenge =
        typeof data?.challenge === "string" ? data.challenge.trim() : "";

      if (!roomId) {
        return;
      }

      const room = getRoom(roomId);

      if (!room) {
        return;
      }

      const truthDarePlayers = getTruthDarePlayers(room);

      if (!truthDarePlayers) {
        return;
      }

      // Only the top player can give the challenge.
      if (socket.id !== truthDarePlayers.giver.id) {
        return;
      }

      // Store the challenge.
      room.truthDareChallenge = challenge;

      // Tell everyone in the room.
      io.to(room.id).emit("truth_dare_challenge", {
        challenge,
      });
    },
  );

  socket.on("disconnect", () => {

    const room = getRoomForPlayer(socket.id);

    if (!room) {
      return;
    }

    const updatedRoom = removePlayer(room.id, socket.id);

    // Room was deleted because nobody remains.
    if (!updatedRoom) {
      return;
    }

    io.to(updatedRoom.id).emit("room_updated", {
      room: serializeRoom(updatedRoom),
    });
  });
});

function serializeRoom(room: ReturnType<typeof getRoom>) {
  if (!room) {
    return null;
  }

  return {
    id: room.id,
    hostId: room.hostId,
    mode: room.mode,
    totalRounds: room.totalRounds,
    status: room.status,
    currentRound: room.currentRound,
    players: [...room.players.values()],
  };
}

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🎬 Server running on port ${PORT}`);
});
