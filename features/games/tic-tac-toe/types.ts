export type Player = "X" | "O";
export type Board = (Player | null)[];

export type WinRecord = {
    winner: Player | "draw";
    timestamp: string;
};

export type MatchListing = {
    id: string;
    created_at: string;
    player_x: string;
};

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

export function checkWinner(board: Board): Player | "draw" | null {
    for (const [a, b, c] of WIN_LINES) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a] as Player;
        }
    }
    if (board.every(Boolean)) return "draw";
    return null;
}
