"use client";

import type { MatchListing } from "./types";

type TicTacToeLobbyProps = {
    username: string | null | undefined;
    userId: string;
    loading: boolean;
    openMatches: MatchListing[];
    onCreateMatch: () => void;
    onJoinMatch: (id: string) => void;
};

export default function TicTacToeLobby({
    username,
    userId,
    loading,
    openMatches,
    onCreateMatch,
    onJoinMatch,
}: TicTacToeLobbyProps) {
    return (
        <div className="flex flex-col items-center gap-4 p-6">
            <div className="window glass w-72">
                <div className="title-bar">
                    <div className="title-bar-text">Tic Tac Toe</div>
                </div>

                <div className="window-body p-4 flex flex-col gap-3">
                    <p className="text-xs">
                        Logged in as <strong>{username}</strong>
                    </p>

                    <button onClick={onCreateMatch} disabled={loading}>
                        Create Match (X)
                    </button>
                </div>
            </div>

            <div className="window glass w-72">
                <div className="title-bar">
                    <div className="title-bar-text">Open Matches</div>
                </div>

                <div className="window-body p-3">
                    {openMatches.length === 0 ? (
                        <p className="text-xs">No matches yet</p>
                    ) : (
                        <ul className="tree-view">
                            {openMatches.map((match) => (
                                <li
                                    key={match.id}
                                    className="flex justify-between"
                                >
                                    <span className="text-xs">
                                        {match.player_x.slice(0, 8)}
                                    </span>
                                    <button
                                        onClick={() => onJoinMatch(match.id)}
                                        disabled={match.player_x === userId}
                                    >
                                        Join
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
