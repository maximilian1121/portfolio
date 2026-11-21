"use client";

import type { Profile } from "@/hooks/use-user-client";
import { createClient } from "@/utils/supabase/client";
import { UserTag } from "./UserTag";
import type { Board, Player, WinRecord } from "./types";

type TicTacToeMatchProps = {
    board: Board;
    player: Player | null;
    turn: Player;
    status: string;
    winner: Player | "draw" | null;
    copied: boolean;
    winHistory: WinRecord[];
    playerXId: string | null;
    playerOId: string | null;
    userId: string | null;
    profile: Profile | null;
    supabase: ReturnType<typeof createClient>;
    onPlay: (index: number) => void;
    onRestart: () => void;
    onCopyInvite: () => void;
};

export default function TicTacToeMatch({
    board,
    player,
    turn,
    status,
    winner,
    copied,
    winHistory,
    playerXId,
    playerOId,
    userId,
    profile,
    supabase,
    onPlay,
    onRestart,
    onCopyInvite,
}: TicTacToeMatchProps) {
    const xWins = winHistory.filter((record) => record.winner === "X").length;
    const oWins = winHistory.filter((record) => record.winner === "O").length;
    const draws = winHistory.filter((record) => record.winner === "draw").length;

    return (
        <div className="flex flex-wrap gap-4 p-6 justify-center">
            <div className="window glass w-72 h-full">
                <div className="title-bar">
                    <div className="title-bar-text">Tic Tac Toe — {player}</div>
                </div>

                <div className="window-body p-3 flex flex-col gap-3 h-full">
                    <div className="flex justify-between text-xs">
                        <span>
                            Turn: <b>{turn}</b>
                        </span>

                        {player === "X" && status === "waiting" && (
                            <button onClick={onCopyInvite}>
                                {copied ? "Copied!" : "Invite"}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                        {board.map((cell, index) => (
                            <button
                                key={index}
                                onClick={() => onPlay(index)}
                                disabled={
                                    !!cell ||
                                    player !== turn ||
                                    !!winner ||
                                    status === "waiting"
                                }
                                className="w-16 h-16 text-2xl font-bold"
                            >
                                {cell}
                            </button>
                        ))}
                    </div>

                    {status === "abandoned" && (
                        <p className="text-xs text-red-500">
                            Opponent disconnected!
                        </p>
                    )}

                    {(winner || status === "abandoned") && (
                        <button onClick={onRestart}>Play Again</button>
                    )}
                </div>
            </div>

            <span className="flex flex-col gap-4 w-52">
                <div className="window glass w-full">
                    <div className="title-bar">
                        <div className="title-bar-text">Stats</div>
                    </div>

                    <div className="window-body p-3 text-xs">
                        <p>X wins: {xWins}</p>
                        <p>O wins: {oWins}</p>
                        <p>Draws: {draws}</p>
                    </div>
                </div>

                <div className="window glass w-full">
                    <div className="title-bar">
                        <div className="title-bar-text">Players</div>
                    </div>

                    <div className="window-body p-3 text-xs flex flex-col gap-2">
                        <span className="opacity-70">
                            {playerXId ? (
                                <UserTag
                                    id={playerXId}
                                    type="X"
                                    userId={userId}
                                    profile={profile}
                                    supabase={supabase}
                                />
                            ) : (
                                "Waiting..."
                            )}
                        </span>

                        <span className="opacity-70">
                            {playerOId ? (
                                <UserTag
                                    id={playerOId}
                                    type="O"
                                    userId={userId}
                                    profile={profile}
                                    supabase={supabase}
                                />
                            ) : (
                                "Waiting..."
                            )}
                        </span>
                    </div>
                </div>

                <div className="window glass w-full">
                    <div className="title-bar">
                        <div className="title-bar-text">Win History</div>
                    </div>

                    <div className="window-body text-xs max-h-64 overflow-y-auto">
                        {winHistory.length === 0 ? (
                            <p className="p-3">No games played yet</p>
                        ) : (
                            <ul className="tree-view">
                                {winHistory
                                    .slice()
                                    .reverse()
                                    .map((record, index) => (
                                        <li
                                            key={`${record.timestamp}-${index}`}
                                            className="flex justify-between"
                                        >
                                            <span>
                                                {record.winner === "draw"
                                                    ? "Draw 🤝"
                                                    : `${record.winner} won`}
                                            </span>
                                            <span className="opacity-60">
                                                {new Date(
                                                    record.timestamp,
                                                ).toLocaleTimeString()}
                                            </span>
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>
                </div>
            </span>
        </div>
    );
}
