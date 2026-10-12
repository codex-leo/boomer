import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { socket } from "../lib/socket";
import type { GameMode, Room } from "../types";
import { gameComponents } from "./games";

function Game() {
    const { roomCode } = useParams();
    const location = useLocation();
    const navigationMode = (location.state as { mode?: GameMode } | null)?.mode;
    const [mode, setMode] = useState<GameMode | null>(navigationMode ?? null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (navigationMode) {
            setMode(navigationMode);
            return;
        }

        let active = true;

        socket.emit(
            "get_room",
            { roomId: roomCode },
            (response: {
                success: boolean;
                room?: Room;
                reason?: string;
            }) => {
                if (!active) {
                    return;
                }

                if (!response.success || !response.room) {
                    setError(response.reason ?? "Unable to load game.");
                    return;
                }

                setMode(response.room.mode);
            },
        );

        return () => {
            active = false;
        };
    }, [navigationMode, roomCode]);

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
                <p className="text-center text-zinc-300">{error}</p>
            </main>
        );
    }

    if (!mode) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
                Loading game...
            </main>
        );
    }

    const GameComponent = gameComponents[mode];

    if (!GameComponent) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
                <p className="text-center text-zinc-300">This game mode is not available yet.</p>
            </main>
        );
    }

    return <GameComponent roomCode={roomCode} />;
}

export default Game;
