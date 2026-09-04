import { Link } from "react-router-dom";
import Grainient from "../components/Grainient";
import { Brush, Headphones } from "lucide-react";

function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 px-4 py-6 text-white sm:py-8">

      {/* Grainient Background */}
      <div className="pointer-events-none absolute inset-0">
        <Grainient
          color1="#EAB308"
          color2="#624a00"
          color3="#404040"
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-zinc-950/55" />

        {/* Subtle vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, transparent 15%, rgba(9,9,11,0.35) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[90vh] w-full max-w-4xl flex-col items-center justify-center">

        {/* Brand */}
        <div className="mb-10 text-center">
          <div className="mb-5 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />

            <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
              Boomer
            </p>

            <span className="h-2 w-2 rounded-full bg-yellow-400" />
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Fun games.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
            Pick a game, invite your friends, and see who can guess it first.
          </p>
        </div>

        {/* Game Cards */}
        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">

          {/* Song Guessor */}
          <Link
            to="/create?mode=song"
            className="group relative overflow-hidden rounded-2xl border bg-zinc-900/68 p-6 text-left transition-all duration-200 
            border-white/24
            hover:-translate-y-1 
            hover:border-yellow-500/60 hover:bg-zinc-900/90 hover:shadow-xl hover:shadow-yellow-500/5 backdrop-blur-sm"
          >
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-yellow-400/10 blur-2xl transition group-hover:bg-yellow-400/20" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
                  <Headphones />
                </div>

                <span className="text-zinc-200 transition group-hover:translate-x-1 group-hover:text-yellow-400">
                  →
                </span>
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Bollywood Song Guessor
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Hear the tune. Beat your friends to the answer.
              </p>
            </div>
          </Link>

          {/* Actor Guessor */}
          <Link
            to="/create?mode=bollyscribble"
            className="group relative overflow-hidden rounded-2xl border bg-zinc-900/68 p-6 text-left transition-all duration-200 
            border-white/24
            hover:-translate-y-1 
            hover:border-yellow-500/60 hover:bg-zinc-900/90 hover:shadow-xl hover:shadow-yellow-500/5 backdrop-blur-sm"
          >
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-yellow-400/10 blur-2xl transition group-hover:bg-yellow-400/20" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
                  <Brush />
                </div>

                <span className="text-zinc-200 transition group-hover:translate-x-1 group-hover:text-yellow-400">
                  →
                </span>
              </div>

              <h2 className="mt-5 text-xl font-bold">
                BollyScribble
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Draw a Bollywood movie. Let your friends guess!
              </p>
            </div>
          </Link>
        </div>

        {/* Join */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs text-zinc-300">
            Already have a game waiting?
          </p>

          <Link
            to="/join"
            className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white active:scale-95"
          >
            Join with room code

            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

      </div>
    </main>
  );
}

export default Home;