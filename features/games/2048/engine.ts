import { Tile, Direction } from "./types";
import { SIZE } from "./constants";

let id = 0;
const uid = () => `${Date.now()}-${id++}`;

export function createEmpty(): (Tile | null)[][] {
  return Array.from({ length: SIZE }, () =>
    Array(SIZE).fill(null)
  );
}

export function spawnTile(tiles: Tile[]): Tile | null {
  const grid = createEmpty();

  tiles.forEach((t) => {
    grid[t.row][t.col] = t;
  });

  const empty: [number, number][] = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c]) empty.push([r, c]);
    }
  }

  if (!empty.length) return null;

  const [row, col] =
    empty[Math.floor(Math.random() * empty.length)];

  return {
    id: uid(),
    value: Math.random() < 0.9 ? 2 : 4,
    row,
    col,
    targetRow: row,
    targetCol: col,
    isNew: true,
  };
}

/**
 * CORE RULE:
 * returns next tile state WITHOUT deleting merged tiles immediately
 */
export function moveTiles(
  tiles: Tile[],
  dir: Direction
): {
  tiles: Tile[];
  scoreGain: number;
} {
  const grid: (Tile | null)[][] = createEmpty();

  tiles.forEach((t) => {
    grid[t.row][t.col] = t;
  });

  const result: Tile[] = [];
  let score = 0;

  const processLine = (cells: (Tile | null)[]) => {
    const arr = cells.filter(Boolean) as Tile[];
    const out: Tile[] = [];

    let i = 0;

    while (i < arr.length) {
      const a = arr[i];
      const b = arr[i + 1];

      if (b && a.value === b.value) {
        const mergedValue = a.value * 2;
        score += mergedValue;

        // keep BOTH tiles alive for animation
        out.push({
          ...a,
          value: mergedValue,
          merged: true,
        });

        i += 2;
      } else {
        out.push({
          ...a,
          merged: false,
        });

        i++;
      }
    }

    return out;
  };

  const writeLine = (
    line: Tile[],
    r: number,
    isRow: boolean,
    reverse = false
  ) => {
    line.forEach((t, i) => {
      const index = reverse ? SIZE - 1 - i : i;

      result.push({
        ...t,
        row: isRow ? r : index,
        col: isRow ? index : r,
        targetRow: isRow ? r : index,
        targetCol: isRow ? index : r,
      });
    });
  };

  if (dir === "left" || dir === "right") {
    for (let r = 0; r < SIZE; r++) {
      const row = grid[r];
      const line =
        dir === "left"
          ? processLine(row)
          : processLine([...row].reverse());

      writeLine(line, r, true, dir === "right");
    }
  }

  if (dir === "up" || dir === "down") {
    for (let c = 0; c < SIZE; c++) {
      const col = [];

      for (let r = 0; r < SIZE; r++) {
        col.push(grid[r][c]);
      }

      const line =
        dir === "up"
          ? processLine(col)
          : processLine([...col].reverse());

      line.forEach((t, i) => {
        const index = dir === "down" ? SIZE - 1 - i : i;

        result.push({
          ...t,
          row: index,
          col: c,
          targetRow: index,
          targetCol: c,
        });
      });
    }
  }

  return { tiles: result, scoreGain: score };
}

export function isGameOver(tiles: Tile[]): boolean {
  const grid: (Tile | null)[][] = createEmpty();

  tiles.forEach((t) => {
    grid[t.row][t.col] = t;
  });

  // if any empty cell -> not game over
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c]) return false;
    }
  }

  // check for possible merges horizontally or vertically
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = grid[r][c]!;
      if (c + 1 < SIZE) {
        const right = grid[r][c + 1];
        if (right && right.value === t.value) return false;
      }
      if (r + 1 < SIZE) {
        const down = grid[r + 1][c];
        if (down && down.value === t.value) return false;
      }
    }
  }

  return true;
}