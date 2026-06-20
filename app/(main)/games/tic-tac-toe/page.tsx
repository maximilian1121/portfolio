"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import SignInForm from "@/components/SignInForm";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserClient } from "@/hooks/use-user-client";
import { UserTag } from "./UserTag";

type Player = "X" | "O";
type Board = (Player | null)[];

interface WinRecord {
    winner: Player | "draw";
    timestamp: string;
}

interface MatchListing {
    id: string;
    created_at: string;
    player_x: string;
}

const WIN_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

function checkWinner(board: Board): Player | "draw" | null {
    for (const [a, b, c] of WIN_LINES) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a] as Player;
        }
    }
    if (board.every(Boolean)) return "draw";
    return null;
}

export default function TicTacToe() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { user, profile, loading: userLoading } = useUserClient();
    const userId = user?.id ?? null;

    const [matchId, setMatchId] = useState<string | null>(null);
    const [board, setBoard] = useState<Board>(Array(9).fill(null));
    const [player, setPlayer] = useState<Player | null>(null);
    const [turn, setTurn] = useState<Player>("X");
    const [status, setStatus] = useState<string>("idle");
    const [winner, setWinner] = useState<Player | "draw" | null>(null);
    const [loading, setLoading] = useState(false);
    const [winHistory, setWinHistory] = useState<WinRecord[]>([]);
    const [openMatches, setOpenMatches] = useState<MatchListing[]>([]);
    const [copied, setCopied] = useState(false);
    const [playerXId, setPlayerXId] = useState<string | null>(null);
    const [playerOId, setPlayerOId] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const joinId = searchParams.get("join");
        if (joinId) {
            joinMatchById(userId, joinId);
        }
    }, [userId]);

    useEffect(() => {
        if (matchId) return;

        const fetchOpen = async () => {
            const { data } = await supabase
                .from("tictactoe_matches")
                .select("id, created_at, player_x")
                .eq("status", "waiting")
                .order("created_at", { ascending: false })
                .limit(10);

            setOpenMatches(data ?? []);
        };

        fetchOpen();

        const channel = supabase
            .channel("lobby")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "tictactoe_matches" },
                fetchOpen,
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchId]);

    useEffect(() => {
        if (!matchId) return;

        const fetchHistory = async () => {
            const { data } = await supabase
                .from("tictactoe_matches")
                .select("win_history")
                .eq("id", matchId)
                .single();

            if (data?.win_history) setWinHistory(data.win_history);
        };

        fetchHistory();
    }, [matchId]);

    useEffect(() => {
        if (!matchId) return;

        const channel = supabase
            .channel(`match:${matchId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "tictactoe_matches",
                    filter: `id=eq.${matchId}`,
                },
                (payload) => {
                    const row: any = payload.new;

                    setBoard(row.board);
                    setTurn(row.turn);
                    setStatus(row.status);
                    setWinHistory(row.win_history ?? []);
                    setWinner(checkWinner(row.board));

                    setPlayerXId(row.player_x);
                    setPlayerOId(row.player_o);
                },
            )
            .on("presence", { event: "leave" }, ({ leftPresences }) => {
                const otherPlayer = player === "X" ? "O" : "X";
                const didOpponentLeave = leftPresences.some(
                    (p: any) => p.player === otherPlayer,
                );
                if (didOpponentLeave) {
                    setStatus("abandoned");
                }
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({ player, userId });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchId]);

    const joinMatchById = async (uid: string, id: string) => {
        setLoading(true);

        const { data, error } = await supabase
            .from("tictactoe_matches")
            .update({ player_o: uid, status: "playing" })
            .eq("id", id)
            .is("player_o", null)
            .select()
            .single();

        if (error || !data) {
            console.error("Join failed:", error?.message);
            setLoading(false);
            return;
        }

        router.replace("/games/tic-tac-toe");

        setMatchId(id);
        setPlayer("O");
        setBoard(data.board);
        setTurn(data.turn);
        setStatus(data.status);
        setWinHistory(data.win_history ?? []);
        setPlayerXId(data.player_x);
        setPlayerOId(uid);
        setLoading(false);
    };

    const createMatch = async () => {
        if (!userId) return;
        setLoading(true);

        const { data, error } = await supabase
            .from("tictactoe_matches")
            .insert({
                player_x: userId,
                board: Array(9).fill(null),
                turn: "X",
                status: "waiting",
                win_history: [],
            })
            .select()
            .single();

        if (error || !data) {
            console.error("Create failed:", error?.message);
            setLoading(false);
            return;
        }

        setMatchId(data.id);
        setPlayer("X");
        setBoard(data.board);
        setStatus(data.status);
        setWinHistory([]);
        setPlayerXId(userId);
        setPlayerOId(null);
        setLoading(false);
    };

    const joinMatch = async (id: string) => {
        if (!userId) return;
        await joinMatchById(userId, id);
    };

    const play = async (i: number) => {
        if (!matchId || !player || winner) return;
        if (board[i] || player !== turn) return;

        const newBoard = [...board];
        newBoard[i] = player;

        const result = checkWinner(newBoard);
        const nextTurn: Player = player === "X" ? "O" : "X";

        let newHistory = winHistory;
        if (result) {
            newHistory = [
                ...winHistory,
                { winner: result, timestamp: new Date().toISOString() },
            ];
        }

        setBoard(newBoard);
        setTurn(nextTurn);
        setWinner(result);

        await supabase
            .from("tictactoe_matches")
            .update({
                board: newBoard,
                turn: nextTurn,
                status: result ? "finished" : "playing",
                winner: result ?? null,
                win_history: newHistory,
            })
            .eq("id", matchId);
    };

    const restartMatch = async () => {
        if (!matchId) return;

        const freshBoard: Board = Array(9).fill(null);

        await supabase
            .from("tictactoe_matches")
            .update({
                board: freshBoard,
                turn: "X",
                status: "playing",
                winner: null,
            })
            .eq("id", matchId);

        setBoard(freshBoard);
        setTurn("X");
        setWinner(null);
        setStatus("playing");
    };

    const copyJoinUrl = () => {
        const url = `${window.location.origin}/games/tic-tac-toe?join=${matchId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const xWins = winHistory.filter((r) => r.winner === "X").length;
    const oWins = winHistory.filter((r) => r.winner === "O").length;
    const draws = winHistory.filter((r) => r.winner === "draw").length;

    if (!userId && !userLoading) {
        return (
            <SignInForm
                open={true}
                onClose={(wasX) => {
                    if (wasX) router.push("/games");
                }}
                help="This game requires you to be signed into an account!"
            />
        );
    }

    if (!matchId) {
        return (
            <div className="flex flex-col items-center gap-4 p-6">
                <div className="window glass w-72">
                    <div className="title-bar">
                        <div className="title-bar-text">Tic Tac Toe</div>
                    </div>

                    <div className="window-body p-4 flex flex-col gap-3">
                        <p className="text-xs">
                            Logged in as <strong>{profile?.username}</strong>
                        </p>

                        <button onClick={createMatch} disabled={loading}>
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
                                {openMatches.map((m) => (
                                    <li
                                        key={m.id}
                                        className="flex justify-between"
                                    >
                                        <span className="text-xs">
                                            {m.player_x.slice(0, 8)}
                                        </span>
                                        <button
                                            onClick={() => joinMatch(m.id)}
                                            disabled={m.player_x === userId}
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
                            <button onClick={copyJoinUrl}>
                                {copied ? "Copied!" : "Invite"}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                        {board.map((cell, i) => (
                            <button
                                key={i}
                                onClick={() => play(i)}
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

                    {winner && (
                        <button onClick={restartMatch}>Play Again</button>
                    )}

                    {status === "abandoned" && (
                        <p className="text-xs text-red-500">
                            Opponent disconnected!
                        </p>
                    )}

                    {(winner || status === "abandoned") && (
                        <button onClick={restartMatch}>Play Again</button>
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
                                    .map((record, i) => (
                                        <li
                                            key={i}
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
