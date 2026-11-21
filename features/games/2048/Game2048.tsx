"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Tile, Direction } from "./types";
import { CELL, GAP, getColor } from "./constants";
import { moveTiles, spawnTile, isGameOver } from "./engine";
import "7.css";

export default function Game2048() {
  const [tiles, setTiles] = useState<Tile[]>(() => {
    const first = spawnTile([]);
    const second = spawnTile([first!]);
    return [first!, second!];
  });

  const [score, setScore] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const prevTilesRef = useRef<Record<string, Tile>>({});

  const move = useCallback((dir: Direction) => {
    setTiles((prev) => {
      const result = moveTiles(prev, dir);

      const spawned = spawnTile(result.tiles);

      if (spawned) result.tiles.push(spawned);

      setScore((s) => s + result.scoreGain);

      // check game over on the new tile set
      const nextTiles = result.tiles;
      if (isGameOver(nextTiles)) setGameOver(true);

      return nextTiles;
    });
  }, []);

  const [gameOver, setGameOver] = useState(false);

  const restart = useCallback(() => {
    const first = spawnTile([]);
    const second = spawnTile([first!]);
    setTiles([first!, second!]);
    setScore(0);
    setGameOver(false);
  }, []);

  // clear transient flags (`merged`, `isNew`) shortly after they appear
  useEffect(() => {
    const timers: number[] = [];

    tiles.forEach((t) => {
      if (t.merged || t.isNew) {
        const id = window.setTimeout(() => {
          setTiles((prev) =>
            prev.map((p) =>
              p.id === t.id ? { ...p, merged: false, isNew: false } : p
            )
          );
        }, 160);

        timers.push(id);
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [tiles]);

  // keep previous tiles snapshot for change detection
  useEffect(() => {
    const map: Record<string, Tile> = {};
    tiles.forEach((t) => (map[t.id] = t));
    prevTilesRef.current = map;
  }, [tiles]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move("left");
      if (e.key === "ArrowRight") move("right");
      if (e.key === "ArrowUp") move("up");
      if (e.key === "ArrowDown") move("down");
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  return (
    <div>
      <div className="mb-4 flex gap-4">
        <div className="rounded px-4 py-2 seven">
          Score: {score}
        </div>
        <div>
          <button className="seven" onClick={restart}>
            Restart
          </button>
        </div>
      </div>

      <div
        className="relative rounded-2xl bg-[#bbada0] p-3"
        style={{
          width: CELL * 4 + GAP * 3 + 24,
          height: CELL * 4 + GAP * 3 + 24,
        }}
        onTouchStart={(e) => {
          touch.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }}
        onTouchEnd={(e) => {
          if (!touch.current) return;

          const dx =
            e.changedTouches[0].clientX - touch.current.x;
          const dy =
            e.changedTouches[0].clientY - touch.current.y;

          if (Math.abs(dx) > Math.abs(dy)) {
            move(dx > 0 ? "right" : "left");
          } else {
            move(dy > 0 ? "down" : "up");
          }
        }}
      >
        {/* background grid cells */}
        {Array.from({ length: 4 }).map((_, r) =>
          Array.from({ length: 4 }).map((__, c) => (
            <div
              key={`bg-${r}-${c}`}
              className="absolute rounded-xl"
              style={{
                left: GAP + c * (CELL + GAP),
                top: GAP + r * (CELL + GAP),
                width: CELL,
                height: CELL,
                background: "rgba(238, 228, 218, 0.35)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
          ))
        )}

        {tiles.map((t) => {
          const prev = prevTilesRef.current[t.id];
          const moved = !!prev && (prev.row !== t.row || prev.col !== t.col);
          const valueChanged = !!prev && prev.value !== t.value;
          const changed = !prev || moved || valueChanged || !!t.merged || !!t.isNew;

          const transition = changed
            ? { type: "spring", stiffness: 420, damping: 30 }
            : { duration: 0 };

          let initialState: any = undefined;

          if (t.isNew) {
            initialState = {
              x: t.col * (CELL + GAP),
              y: t.row * (CELL + GAP),
              scale: 0.18,
              backgroundColor: getColor(t.value),
            };
          } else if (prev && moved) {
            // animate from previous tile coordinates
            initialState = {
              x: prev.col * (CELL + GAP),
              y: prev.row * (CELL + GAP),
              scale: prev.merged ? 1.15 : 1,
              backgroundColor: getColor(prev.value),
            };
          }

          return (
            <motion.div
              key={t.id}
              initial={initialState}
              animate={{
                x: t.col * (CELL + GAP),
                y: t.row * (CELL + GAP),
                scale: t.merged ? 1.15 : 1,
                backgroundColor: getColor(t.value),
              }}
              transition={transition as any}
              className="absolute flex items-center justify-center rounded-xl font-bold shadow-md"
              style={{
                left: GAP,
                top: GAP,
                width: CELL,
                height: CELL,
                color: t.value <= 4 ? "#776e65" : "white",
                fontSize: t.value >= 1024 ? 28 : 34,
                zIndex: 2,
              }}
            >
              {t.value}
            </motion.div>
          );
        })}

        {gameOver && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 10 }}
          >
            <div className="rounded-xl p-6 bg-white/90 shadow-lg seven">
              <h2 className="text-2xl font-bold mb-2">Game Over</h2>
              <p className="mb-4 bg-transparent">Score: {score}</p>
              <div className="flex gap-2">
                <button className="seven" onClick={restart}>
                  Play Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}