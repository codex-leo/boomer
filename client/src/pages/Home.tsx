import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white px-4 py-8">
      <div className="mx-auto flex min-h-[90vh] w-full max-w-4xl flex-col items-center justify-center text-center">

        <div className="mb-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
            Boomer
          </p>

          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            🎬 Bollywood Guessor
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-zinc-400 sm:text-lg">
            Guess faster. Score higher. Humiliate your friends.
          </p>
        </div>

        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">

          <Link
            to="/create?mode=song"
            className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left transition hover:-translate-y-1 hover:border-yellow-500"
          >
            <div className="text-4xl">🎵</div>

            <h2 className="mt-4 text-xl font-bold">
              Song Guessor
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Hear the tune. Beat your friends to the answer.
            </p>
          </Link>

          <Link
            to="/create?mode=actor"
            className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left transition hover:-translate-y-1 hover:border-yellow-500"
          >
            <div className="text-4xl">🎤</div>

            <h2 className="mt-4 text-xl font-bold">
              Actor Guessor
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Identify the actor from their voice.
            </p>
          </Link>

        </div>

        <Link
          to="/join"
          className="mt-8 text-sm font-semibold text-zinc-400 underline underline-offset-4 hover:text-white"
        >
          Have a room code? Join a game →
        </Link>

      </div>
    </main>
  );
}

export default Home;