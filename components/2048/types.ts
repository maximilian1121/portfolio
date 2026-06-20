export type Tile = {
  id: string;
  value: number;

  row: number;
  col: number;

  // animation targets
  targetRow: number;
  targetCol: number;

  merged?: boolean;
  remove?: boolean;
  isNew?: boolean;
};

export type Direction = "up" | "down" | "left" | "right";