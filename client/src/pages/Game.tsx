import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { socket } from "../lib/socket";
import type { Player } from "../types";

interface RoundStartedData {
    round: number;
    totalRounds: number;
    question: {
        id: string;
        youtubeId: string;
    };
    duration: number;
}

interface RoundEndedData {
    round: number;

    answer: {
        title: string;
        movie: string;
    } | null;

    players: Player[];
}

interface CountdownData {
    round: number;
    totalRounds: number;
}

interface AnswerResult {
    correct: boolean;
    points: number;
    position?: number;
}

interface GameFinishedData {
    players: Player[];

    truthDarePlayers: {
        giver: TruthDarePlayer;
        receiver: TruthDarePlayer;
    } | null;
}

interface TruthDarePlayer {
    id: string;
    name: string;
    score: number;
}


function Game() {
    const { roomCode } = useParams();
    const navigate = useNavigate();

    const [countdown, setCountdown] = useState<number | null>(null);

    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const [round, setRound] = useState(0);
    const [totalRounds, setTotalRounds] = useState(0);

    const [youtubeId, setYoutubeId] = useState<string | null>(null);
    const youtubeFrameRef = useRef<HTMLIFrameElement | null>(null);
    const countdownTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const [answer, setAnswer] = useState("");

    const [submitted, setSubmitted] = useState(false);

    const [answerResult, setAnswerResult] =
        useState<AnswerResult | null>(null);

    const [roundEnded, setRoundEnded] = useState(false);

    const [revealedAnswer, setRevealedAnswer] =
        useState<{
            title: string;
            movie: string;
        } | null>(null);

    const [players, setPlayers] = useState<Player[]>([]);

    const [currentPlayerId, setCurrentPlayerId] =
        useState<string | null>(null);

    const [truthDarePlayers, setTruthDarePlayers] =
        useState<GameFinishedData["truthDarePlayers"]>(null);

    const [truthDareType, setTruthDareType] =
        useState<"truth" | "dare" | null>(null);

    const [truthDareChallenge, setTruthDareChallenge] = useState("");

    const [slotType, setSlotType] =
        useState<"truth" | "dare">("truth");

    const [isSpinning, setIsSpinning] =
        useState(false);

    const [gameFinished, setGameFinished] = useState(false);
    const [playingAgain, setPlayingAgain] = useState(false);
    const [playAgainError, setPlayAgainError] = useState("");

    const isHost = players.some(
        (player) => player.id === currentPlayerId && player.isHost,
    );

    function stopYouTubePlayback() {
        const frame = youtubeFrameRef.current;

        if (!frame) {
            return;
        }

        // Ask the YouTube player to stop, then navigate the iframe away from
        // the media source so an unmount cannot leave playback running.
        frame.contentWindow?.postMessage(
            JSON.stringify({
                event: "command",
                func: "stopVideo",
                args: [],
            }),
            "https://www.youtube.com",
        );
        frame.src = "about:blank";
    }

    function clearCountdownTimers() {
        for (const timer of countdownTimersRef.current) {
            clearTimeout(timer);
        }

        countdownTimersRef.current = [];
    }

    function spinTruthDare() {
        if (isSpinning) {
            return;
        }

        setIsSpinning(true);
        setTruthDareType(null);

        socket.emit("spin_truth_dare", { roomId: roomCode });
    }

    useEffect(() => {
        if (!isSpinning) {
            return;
        }

        const interval = setInterval(() => {
            setSlotType((current) =>
                current === "truth" ? "dare" : "truth",
            );
        }, 120);

        return () => {
            clearInterval(interval);
        };
    }, [isSpinning]);

    useEffect(() => {
        function handleCountdown(data: CountdownData) {
            clearCountdownTimers();
            stopYouTubePlayback();

            setRound(data.round);
            setTotalRounds(data.totalRounds);

            setYoutubeId(null);
            setTimeLeft(null);
            setAnswer("");
            setSubmitted(false);
            setAnswerResult(null);

            setCountdown(3);

            countdownTimersRef.current = [
                setTimeout(() => setCountdown(2), 1000),
                setTimeout(() => setCountdown(1), 2000),
                setTimeout(() => setCountdown(0), 3000),
            ];
        }

        function handleYourPlayerId(data: { id: string }) {
            setCurrentPlayerId(data.id);
        }

        function handleRoundStarted(data: RoundStartedData) {
            stopYouTubePlayback();
            setRoundEnded(false);
            setRevealedAnswer(null);
            setRound(data.round);
            setTotalRounds(data.totalRounds);

            setYoutubeId(data.question.youtubeId);

            setCountdown(null);
            setTimeLeft(Math.ceil(data.duration / 1000));

            setAnswer("");
            setSubmitted(false);
            setAnswerResult(null);
        }

        function handleAnswerResult(data: AnswerResult) {
            setAnswerResult(data);

            if (data.correct) {
                setSubmitted(true);
            }
        }

        function handleLeaderboard(data: {
            players: Player[];
        }) {
            setPlayers(data.players);
        }

        function handleRoundEnded(data: RoundEndedData) {
            stopYouTubePlayback();
            setYoutubeId(null);
            setRoundEnded(true);
            setTimeLeft(null);

            setRevealedAnswer(data.answer);

            setPlayers(data.players);
        }

        function handleGameFinished(data: GameFinishedData) {
            setGameFinished(true);

            setPlayers(data.players);

            setTruthDarePlayers(data.truthDarePlayers);
        }

        function handleGameReset() {
            navigate(`/lobby/${roomCode}`);
        }

        function handleTruthDareResult(data: {
            type: "truth" | "dare";
        }) {
            setTimeout(() => {
                setTruthDareType(data.type);
                setIsSpinning(false);
            }, 1500);
        }

        function handleTruthDareChallenge(data: { challenge: string }) {
            setTruthDareChallenge(data.challenge);
        }

        socket.on("round_ended", handleRoundEnded);
        socket.on("game_countdown", handleCountdown);
        socket.on("your_player_id", handleYourPlayerId);
        socket.on("round_started", handleRoundStarted);
        socket.on("answer_result", handleAnswerResult);
        socket.on("leaderboard_updated", handleLeaderboard);
        socket.on(
            "game_finished",
            handleGameFinished,
        );
        socket.on(
            "truth_dare_result",
            handleTruthDareResult,
        );
        socket.on("truth_dare_challenge", handleTruthDareChallenge);
        socket.on("game_reset", handleGameReset);

        socket.emit("request_player_id");

        return () => {
            clearCountdownTimers();
            stopYouTubePlayback();
            socket.off("game_countdown", handleCountdown);
            socket.off("round_started", handleRoundStarted);
            socket.off("answer_result", handleAnswerResult);
            socket.off(
                "leaderboard_updated",
                handleLeaderboard,
            );
            socket.off("round_ended", handleRoundEnded);
            socket.off(
                "game_finished",
                handleGameFinished,
            );
            socket.off(
                "truth_dare_result",
                handleTruthDareResult,
            );
            socket.off("your_player_id", handleYourPlayerId);
            socket.off("truth_dare_challenge", handleTruthDareChallenge);
            socket.off("game_reset", handleGameReset);
        };
    }, [navigate, roomCode]);

    useEffect(() => {
        if (timeLeft === null || roundEnded) {
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((current) => {
                if (current === null || current <= 1) {
                    return 0;
                }

                return current - 1;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [timeLeft, roundEnded]);

    function submitAnswer() {
        if (!answer.trim() || submitted) {
            return;
        }

        socket.emit(
            "submit_answer",
            {
                roomId: roomCode,
                answer,
            },
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 px-4 py-5 text-white">

            {gameFinished ? (
                <div className="mx-auto w-full max-w-2xl">

                    <div className="text-center">

                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
                            Game Complete
                        </p>

                        <h1 className="mt-2 text-4xl font-black sm:text-5xl">
                            🏆 Final Scores
                        </h1>

                        <p className="mt-2 text-zinc-400">
                            What a game!
                        </p>

                    </div>

                    <div className="mt-8 space-y-3">

                        {players.map((player, index) => (
                            <div
                                key={player.id}
                                className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
                            >

                                <div className="flex items-center gap-4">

                                    <span className="text-2xl">
                                        {index === 0
                                            ? "🥇"
                                            : index === 1
                                                ? "🥈"
                                                : index === 2
                                                    ? "🥉"
                                                    : `#${index + 1}`}
                                    </span>

                                    <span className="font-bold">
                                        {player.name}
                                    </span>

                                </div>

                                <span className="text-xl font-black">
                                    {player.score}
                                </span>

                            </div>
                        ))}

                    </div>
                        {truthDarePlayers && (
                        <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-center">

                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
                                One Last Challenge
                            </p>

                            <h2 className="mt-2 text-3xl font-black">
                                😈 Truth or Dare?
                            </h2>

                            <p className="mt-3 text-zinc-400">
                                <span className="font-bold text-white">
                                    {truthDarePlayers.giver.name}
                                </span>

                                {" "}gets to give a challenge to{" "}

                                <span className="font-bold text-white">
                                    {truthDarePlayers.receiver.name}
                                </span>
                            </p>

                            <div className="mt-8">
                                {!truthDareType && !isSpinning && currentPlayerId ===
                                    truthDarePlayers.receiver.id ? (
                                    <button
                                        onClick={spinTruthDare}
                                        disabled={isSpinning}
                                        className="mt-6 rounded-2xl bg-white px-8 py-3 font-black text-black transition hover:scale-105 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSpinning ? "SPINNING..." : "SPIN"}
                                    </button>
                                ) : (
                                    <p className="mt-6 text-sm text-zinc-500">
                                        Waiting for {truthDarePlayers.receiver.name}
                                        {" "}to spin...
                                    </p>
                                )}

                                {isSpinning && (
                                    <div className="mx-auto mt-6 flex h-32 w-64 items-center justify-center overflow-hidden rounded-2xl border-2 border-yellow-400 bg-zinc-950 shadow-lg">
                                        <div className="animate-[truthDareSlot_0.25s_linear_infinite] text-5xl font-black uppercase">
                                            {slotType === "truth" ? "TRUTH 🗣️" : "DARE 😈"}
                                        </div>
                                    </div>
                                )}

                                {truthDareType && !isSpinning && (
                                    <div className="mt-6">

                                        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                                            Your challenge type
                                        </p>

                                        <h3 className="mt-2 text-5xl font-black uppercase">
                                            {truthDareType === "truth"
                                                ? "TRUTH 🗣️"
                                                : "DARE 😈"}
                                        </h3>

                                    </div>
                                )}

                                {truthDareType &&
                                    !isSpinning &&
                                    currentPlayerId === truthDarePlayers.giver.id && (
                                        <div className="mt-8">
                                            <p className="text-sm text-zinc-400">
                                                Give {truthDarePlayers.receiver.name} a{" "}
                                                <span className="font-bold uppercase text-yellow-400">
                                                    {truthDareType}
                                                </span>
                                            </p>

                                            <input
                                                type="text"
                                                value={truthDareChallenge}
                                                onChange={(event) =>
                                                    setTruthDareChallenge(event.target.value)
                                                }
                                                placeholder="Optional — give a challenge..."
                                                className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
                                            />

                                            <button
                                                onClick={() => {
                                                    socket.emit("submit_truth_dare_challenge", {
                                                        roomId: roomCode,
                                                        challenge: truthDareChallenge,
                                                    });
                                                }}
                                                className="mt-4 w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black transition hover:bg-yellow-300"
                                            >
                                                GIVE CHALLENGE 😈
                                            </button>
                                        </div>
                                    )}
                                {truthDareType &&
                                    !isSpinning &&
                                    currentPlayerId === truthDarePlayers.receiver.id &&
                                    truthDareChallenge !== "" && (
                                        <div className="mt-8 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-6">
                                            <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                                                Your Challenge
                                            </p>

                                            <p className="mt-3 text-xl font-bold text-white">
                                                {truthDareChallenge}
                                            </p>
                                        </div>
                                    )}

                                {truthDareType &&
                                    !isSpinning &&
                                    currentPlayerId === truthDarePlayers.receiver.id &&
                                    truthDareChallenge === "" && (
                                        <div className="mt-8 rounded-2xl border border-zinc-700 bg-zinc-950 p-6">
                                            <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                                                Your Challenge
                                            </p>

                                            <p className="mt-3 text-lg font-semibold text-white">
                                                Your {truthDareType === "truth" ? "TRUTH 🗣️" : "DARE 😈"} is
                                                ready!
                                            </p>

                                            <p className="mt-2 text-sm text-zinc-400">
                                                Your challenge will be given to you physically.
                                            </p>
                                        </div>
                                    )}
                            </div>

                        </section>
                    )}

                    {isHost && (
                        <div className="mt-8 text-center">
                            {playAgainError && (
                                <p className="mb-3 text-sm text-red-300">{playAgainError}</p>
                            )}
                            <button
                                type="button"
                                disabled={playingAgain}
                                onClick={() => {
                                    setPlayingAgain(true);
                                    setPlayAgainError("");
                                    socket.emit(
                                        "play_again",
                                        { roomId: roomCode },
                                        (response: { success: boolean; reason?: string }) => {
                                            if (!response.success) {
                                                setPlayingAgain(false);
                                                setPlayAgainError(response.reason ?? "Unable to restart game.");
                                            }
                                        },
                                    );
                                }}
                                className="min-h-12 rounded-xl bg-yellow-500 px-6 font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
                            >
                                {playingAgain ? "Returning to lobby..." : "Play Again"}
                            </button>
                        </div>
                    )}

                </div>
            ) : (

                <div className="mx-auto w-full max-w-3xl">

                    {/* Header */}

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">
                                Song Guessor
                            </p>

                            <h1 className="mt-1 text-xl font-black sm:text-2xl">
                                Round {round} / {totalRounds}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            {timeLeft !== null && !roundEnded && (
                                <div
                                    className={`rounded-full px-4 py-2 text-sm font-black ${timeLeft <= 5
                                            ? "bg-red-500 text-white"
                                            : "bg-zinc-900 text-white"
                                        }`}
                                >
                                    ⏱️ {timeLeft}s
                                </div>
                            )}

                            <div className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold">
                                🎬 {roomCode}
                            </div>
                        </div>

                    </div>

                    {/* Countdown */}

                    {countdown !== null && countdown > 0 && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">

                            <div className="text-center">

                                <p className="text-sm font-bold uppercase tracking-[0.4em] text-yellow-400">
                                    Get ready
                                </p>

                                <div className="mt-5 text-9xl font-black">
                                    {countdown}
                                </div>

                            </div>

                        </div>
                    )}

                    {/* Question */}

                    <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
                        {!roundEnded && (
                            <div className="overflow-hidden rounded-2xl bg-black">

                                {youtubeId ? (
                                    <div className="relative aspect-video w-full overflow-hidden">
                                        <iframe
                                            key={youtubeId}
                                            ref={youtubeFrameRef}
                                            className="absolute left-1/2 top-1/2 h-px w-px -translate-x-1/2 -translate-y-1/2 opacity-0"
                                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=0&disablekb=1&modestbranding=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                                            title="Song audio"
                                            allow="autoplay; encrypted-media"
                                        />

                                        <div className="flex h-full items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-6xl">🎵</div>

                                                <p className="mt-4 text-lg font-bold">
                                                    Listen carefully...
                                                </p>

                                                <p className="mt-1 text-sm text-zinc-500">
                                                    Guess the song as fast as you can!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex aspect-video items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-5xl">🎵</div>
                                            <p className="mt-3 text-zinc-400">
                                                Get ready...
                                            </p>
                                        </div>
                                    </div>
                                )}

                            </div>)}

                        {roundEnded && (
                            <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-center">

                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                                    The Answer Was
                                </p>

                                {revealedAnswer ? (
                                    <>
                                        <h2 className="mt-2 text-2xl font-black">
                                            {revealedAnswer.title}
                                        </h2>

                                        <p className="mt-1 text-zinc-400">
                                            {revealedAnswer.movie}
                                        </p>
                                    </>
                                ) : (
                                    <p className="mt-2 text-zinc-400">
                                        Answer unavailable
                                    </p>
                                )}

                            </div>
                        )}

                        {roundEnded && (
                            <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

                                <div className="text-center">

                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                                        Round Complete
                                    </p>

                                    <h2 className="mt-1 text-2xl font-black">
                                        🏆 Scores
                                    </h2>

                                </div>

                                <div className="mt-5 space-y-2">

                                    {players.map((player, index) => (
                                        <div
                                            key={player.id}
                                            className="flex items-center justify-between rounded-xl bg-zinc-950 p-3"
                                        >

                                            <div className="flex items-center gap-3">

                                                <span className="w-7 text-center text-lg font-black">
                                                    {index === 0
                                                        ? "🥇"
                                                        : index === 1
                                                            ? "🥈"
                                                            : index === 2
                                                                ? "🥉"
                                                                : index + 1}
                                                </span>

                                                <span className="font-semibold">
                                                    {player.name}
                                                </span>

                                            </div>

                                            <span className="font-black">
                                                {player.score}
                                            </span>

                                        </div>
                                    ))}

                                </div>

                            </section>
                        )}

                        {!roundEnded && (
                            <div className="mt-6">

                                <p className="mb-2 text-sm font-semibold text-zinc-400">
                                    What song is this?
                                </p>

                                <div className="flex flex-col gap-3 sm:flex-row">

                                    <input
                                        value={answer}
                                        disabled={!youtubeId || submitted}
                                        onChange={(e) =>
                                            setAnswer(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                submitAnswer();
                                            }
                                        }}
                                        placeholder="Type your answer..."
                                        className="h-12 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 outline-none focus:border-yellow-500 disabled:opacity-50"
                                    />

                                    <button
                                        type="button"
                                        disabled={
                                            !youtubeId ||
                                            !answer.trim() ||
                                            submitted
                                        }
                                        onClick={submitAnswer}
                                        className="min-h-12 rounded-xl bg-yellow-500 px-6 font-black text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        GUESS ⚡
                                    </button>

                                </div>

                            </div>)}

                        {/* Result */}

                        {!roundEnded && answerResult && (
                            <div
                                className={`mt-4 rounded-2xl p-4 text-center ${answerResult.correct
                                    ? "bg-green-950 text-green-300"
                                    : "bg-red-950 text-red-300"
                                    }`}
                            >
                                {answerResult.correct ? (
                                    <>
                                        <p className="text-2xl font-black">
                                            Correct! 🎉
                                        </p>

                                        <p className="mt-1">
                                            +{answerResult.points} points
                                        </p>
                                    </>
                                ) : (
                                    <p className="font-bold">
                                        Not quite! 😭
                                    </p>
                                )}
                            </div>
                        )}

                    </section>

                    {/* Leaderboard */}

                    {!roundEnded &&
                        (
                            <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

                                <div className="flex items-center justify-between">

                                    <h2 className="text-lg font-black">
                                        🏆 Live Scores
                                    </h2>

                                    <span className="text-xs text-zinc-500">
                                        LIVE
                                    </span>

                                </div>

                                <div className="mt-4 space-y-2">

                                    {players.map((player, index) => (
                                        <div
                                            key={player.id}
                                            className="flex items-center justify-between rounded-xl bg-zinc-950 p-3"
                                        >

                                            <div className="flex min-w-0 items-center gap-3">

                                                <span className="w-6 text-center font-bold text-zinc-500">
                                                    {index + 1}
                                                </span>

                                                <span className="truncate font-semibold">
                                                    {player.name}
                                                </span>

                                            </div>

                                            <span className="font-black">
                                                {player.score}
                                            </span>

                                        </div>
                                    ))}

                                </div>

                            </section>
                        )}
                </div>
            )}

        </main>
    );
}

export default Game;
