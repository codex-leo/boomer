import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { socket } from "../lib/socket";
import type { GameMode } from "../types";

function CreateGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialMode =
    searchParams.get("mode") === "actor"
      ? "actor"
      : "song";

  const [name, setName] = useState("");
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [rounds, setRounds] = useState(5);
  const [truthDareEnabled, setTruthDareEnabled] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function createGame() {
    setError("");

    if (!name.trim()) {
      setError("Enter your nickname.");
      return;
    }

    setLoading(true);

    socket.emit(
      "create_room",
      {
        name,
        mode,
        totalRounds: rounds,
        enabledChallenges: truthDareEnabled ? ["truth-dare"] : [],
      },
      (response: {
        success: boolean;
        reason?: string;
        room?: {
          id: string;
          mode: GameMode;
          totalRounds: number;
        };
      }) => {
        setLoading(false);

        if (!response.success || !response.room) {
          setError(response.reason ?? "Unable to create game.");
          return;
        }

        navigate(`/lobby/${response.room.id}`);
      },
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[90vh] w-full max-w-md items-center">

        <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8">

          <p className="text-sm font-semibold text-yellow-400">
            CREATE GAME
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Set up your game
          </h1>

          <div className="mt-8 space-y-6">

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Your nickname
              </label>

              <input
                value={name}
                maxLength={20}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul"
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 outline-none transition focus:border-yellow-500"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-4">
              <input
                type="checkbox"
                checked={truthDareEnabled}
                onChange={(event) => setTruthDareEnabled(event.target.checked)}
                className="mt-1 h-4 w-4 accent-yellow-500"
              />
              <span>
                <span className="block font-semibold">Truth or Dare after the game</span>
                <span className="mt-1 block text-sm text-zinc-400">
                  Let the highest and lowest scorers play one final challenge.
                </span>
              </span>
            </label>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Game mode
              </label>

              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => setMode("song")}
                  className={`min-h-12 rounded-xl border font-semibold transition ${
                    mode === "song"
                      ? "border-yellow-500 bg-yellow-500 text-black"
                      : "border-zinc-700 bg-zinc-950"
                  }`}
                >
                  🎵 Songs
                </button>

                <button
                  type="button"
                  onClick={() => setMode("actor")}
                  className={`min-h-12 rounded-xl border font-semibold transition ${
                    mode === "actor"
                      ? "border-yellow-500 bg-yellow-500 text-black"
                      : "border-zinc-700 bg-zinc-950"
                  }`}
                >
                  🎤 Actors
                </button>

              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Number of rounds
              </label>

              <select
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4"
              >
                {[3, 5, 7, 10, 15].map((value) => (
                  <option key={value} value={value}>
                    {value} rounds
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={createGame}
              className="min-h-12 w-full rounded-xl bg-yellow-500 px-5 font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Game →"}
            </button>

          </div>
        </div>
      </div>
    </main>
  );
}

export default CreateGame;
