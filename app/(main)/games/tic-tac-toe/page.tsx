"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import SignInForm from "@/components/auth/SignInForm";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserClient } from "@/hooks/use-user-client";
import TicTacToeLobby from "@/features/games/tic-tac-toe/TicTacToeLobby";
import TicTacToeMatch from "@/features/games/tic-tac-toe/TicTacToeMatch";
import {
    checkWinner,
    type Board,
    type MatchListing,
    type Player,
    type WinRecord,
} from "@/features/games/tic-tac-toe/types";

export default function TicTacToe() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { user, profile, loading: userLoading } = useUserClient();
    const userId = user?.id ?? null;
    const joinId = searchParams.get("join");

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

        if (joinId) {
            joinMatchById(userId, joinId);
        }
    }, [joinId, userId]);

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
            <TicTacToeLobby
                username={profile?.username}
                userId={userId ?? ""}
                loading={loading}
                openMatches={openMatches}
                onCreateMatch={createMatch}
                onJoinMatch={joinMatch}
            />
        );
    }

    return (
        <TicTacToeMatch
            board={board}
            player={player}
            turn={turn}
            status={status}
            winner={winner}
            copied={copied}
            winHistory={winHistory}
            playerXId={playerXId}
            playerOId={playerOId}
            userId={userId}
            profile={profile}
            supabase={supabase}
            onPlay={play}
            onRestart={restartMatch}
            onCopyInvite={copyJoinUrl}
        />
    );
}
