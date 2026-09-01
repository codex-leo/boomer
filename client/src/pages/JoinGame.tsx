import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { socket } from "../lib/socket";

function JoinGame() {
  const navigate = useNavigate();
  const { roomCode } = useParams();

  const [name, setName] = useState("");
  const [code, setCode] = useState(roomCode ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function joinGame() {
    setError("");

    const normalizedCode = code.trim().toUpperCase();

    if (!name.trim()) {
      setError("Enter your nickname.");
      return;
    }

    if (!normalizedCode) {
      setError("Enter a room code.");
      return;
    }

    setLoading(true);

    socket.emit(
      "join_room",
      {
        roomId: normalizedCode,
        name,
      },
      (response: {
        success: boolean;
        reason?: string;
      }) => {
        setLoading(false);

        if (!response.success) {
          setError(response.reason ?? "Unable to join game.");
          return;
        }

        navigate(`/lobby/${normalizedCode}`);
      },
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[90vh] w-full max-w-md items-center">

        <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8">

          <p className="text-sm font-semibold text-yellow-400">
            JOIN GAME
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Enter the lobby
          </h1>

          <div className="mt-8 space-y-6">

            <div>
              <label className="mb-2 block text-sm font-medium">
                Room code
              </label>

              <input
                value={code}
                maxLength={6}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase())
                }
                placeholder="A7K92P"
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 font-mono text-lg uppercase tracking-widest outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Your nickname
              </label>

              <input
                value={name}
                maxLength={20}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ram"
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 outline-none focus:border-yellow-500"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={joinGame}
              className="min-h-12 w-full rounded-xl bg-yellow-500 font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join Game →"}
            </button>

          </div>
        </div>
      </div>
    </main>
  );
}

export default JoinGame;