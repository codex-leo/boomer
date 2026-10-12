import type { ComponentType } from "react";

import type { GameMode } from "../../types";
import SongGame from "./SongGame";

export interface GameComponentProps {
    roomCode?: string;
}

// Register each mode here; Game.tsx stays independent of individual game UIs.
export const gameComponents: Record<GameMode, ComponentType<GameComponentProps>> = {
    song: SongGame,
    bollyscribble: SongGame,
};
