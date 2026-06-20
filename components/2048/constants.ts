export const SIZE = 4;

export const CELL = 90;
export const GAP = 12;

export const COLORS: Record<number, string> = {
  2: "#f7f3e8",
  4: "#d7f2e1",
  8: "#c6e0ff",
  16: "#d9c3ff",
  32: "#ffd6a5",
  64: "#ffb3c6",
  128: "#e6ffd9",
  256: "#fff3b0",
  512: "#cde8ff",
  1024: "#ffdbe6",
  2048: "#f9e6c8",
};

export function getColor(v: number) {
  return COLORS[v] ?? "#3c3a32";
}