import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { socket } from "../lib/socket";
import type { Room } from "../types";
import { QRCodeSVG } from "qrcode.react";

import { useNavigate } from "react-router-dom";

function Lobby() {
    const { roomCode } = useParams();
    const inviteUrl =
        `${window.location.origin}/join/${roomCode}`;

    const [room, setRoom] = useState<Room | null>(null);
    const [error, setError] = useState("");
    const [starting, setStarting] = useState(false);

    const [copied, setCopied] = useState(false);

    const navigate = useNavigate();


    useEffect(() => {
        function handleGameCountdown() {
            navigate(`/game/${roomCode}`);
        }

        socket.on(
            "game_countdown",
            handleGameCountdown,
        );

        return () => {
            socket.off(
                "game_countdown",
                handleGameCountdown,
            );
        };
    }, [navigate, roomCode]);

    useEffect(() => {
        function handleRoomUpdate(data: { room: Room }) {
            setRoom(data.room);
        }

        socket.on("room_updated", handleRoomUpdate);

        return () => {
            socket.off("room_updated", handleRoomUpdate);
        };
    }, []);

    useEffect(() => {
        // Request current room state.
        socket.emit(
            "get_room",
            { roomId: roomCode },
            (response: {
                success: boolean;
                room?: Room;
                reason?: string;
            }) => {
                if (!response.success || !response.room) {
                    setError(response.reason ?? "Unable to load room.");
                    return;
                }

                setRoom(response.room);
            },
        );
    }, [roomCode]);

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
                <div className="text-center">
                    <div className="text-5xl">😕</div>
                    <h1 className="mt-4 text-2xl font-bold">
                        Room unavailable
                    </h1>
                    <p className="mt-2 text-zinc-400">{error}</p>
                </div>
            </main>
        );
    }

    if (!room) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
                Loading lobby...
            </main>
        );
    }

    const isHost = room.hostId === socket.id;

    return (
        <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">

            <div className="mx-auto w-full max-w-3xl">

                <div className="text-center">

                    <p className="text-sm font-semibold text-yellow-400">
                        GAME LOBBY
                    </p>

                    <h1 className="mt-2 text-4xl font-black">
                        {room.id}
                    </h1>

                    <p className="mt-2 text-zinc-400">
                        {room.mode === "song"
                            ? "🎵 Song Guessor"
                            : "🎤 Actor Guessor"}
                        {" · "}
                        {room.totalRounds} rounds
                    </p>

                </div>
                <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8">
                    <div className="flex flex-col items-center text-center">
                        <p className="text-sm font-semibold text-zinc-400">
                            INVITE YOUR FRIENDS
                        </p>
                        <div className="mt-5 rounded-2xl bg-white p-4">
                            <QRCodeSVG
                                value={inviteUrl}
                                size={180}
                                level="M"
                            />
                        </div>
                        <p className="mt-4 text-sm text-zinc-400">
                            Scan this QR code to join
                        </p>
                        <div className="mt-5 w-full max-w-md">
                            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-2">
                                <input
                                    readOnly
                                    value={inviteUrl}
                                    className="min-w-0 flex-1 bg-transparent px-2 text-xs text-zinc-400 outline-none sm:text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(inviteUrl);
                                            setCopied(true);
                                            setTimeout(() => {
                                                setCopied(false);
                                            }, 1500);
                                        } catch {
                                            // Clipboard may be unavailable in some browsers.
                                        }
                                    }}
                                    className="min-h-10 shrink-0 rounded-lg bg-zinc-800 px-3 text-sm font-semibold hover:bg-zinc-700"
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8">

                    <div className="flex items-center justify-between">

                        <h2 className="text-xl font-bold">
                            Players
                        </h2>

                        <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm">
                            {room.players.length}/15
                        </span>

                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">

                        {room.players.map((player) => (
                            <div
                                key={player.id}
                                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800">
                                    👤
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate font-semibold">
                                        {player.name}
                                    </p>

                                    {player.isHost && (
                                        <p className="text-xs text-yellow-400">
                                            HOST
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                    </div>

                    <div className="mt-8 rounded-2xl bg-zinc-950 p-5 text-center">
                        <p className="text-zinc-400">
                            Waiting for the host to start the game...
                        </p>

                        {isHost && (
                            <p className="mt-2 font-semibold text-yellow-400">
                                You're the host.
                            </p>
                        )}
                    </div>

                </div>

                {isHost && (
                    <button
                        type="button"
                        disabled={starting || room.players.length < 1}
                        onClick={() => {
                            setStarting(true);

                            socket.emit(
                                "start_game",
                                {
                                    roomId: room.id,
                                },
                                (response: {
                                    success: boolean;
                                    reason?: string;
                                }) => {
                                    if (!response.success) {
                                        setStarting(false);
                                        setError(
                                            response.reason ??
                                            "Unable to start game.",
                                        );
                                    }
                                },
                            );
                        }}
                        className="mt-6 min-h-12 w-full rounded-xl bg-yellow-500 font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
                    >
                        {starting
                            ? "Starting..."
                            : "Start Game 🎬"}
                    </button>
                )}

            </div>

        </main>
    );
}

export default Lobby;